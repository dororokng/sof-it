// Публичные read-only эндпоинты для сайта (не для админки — без сессий/логина).
// Форма ответа намеренно повторяет старый js/data.js (поля cat/catLabel/desc),
// чтобы фронтенд (render.js, catalog-page.js и т.д.) не пришлось переписывать.
import { Router } from "express";
import { prisma } from "../db.js";

export const publicApiRouter = Router();

publicApiRouter.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

function toProductDTO(p) {
  return {
    id: p.id,
    cat: p.category.slug,
    catLabel: p.category.name,
    name: p.name,
    desc: p.description,
    manufacturer: p.manufacturer,
    specs: p.specs,
    image: p.imageUrl || null,
  };
}

function toCategoryDTO(c) {
  return { id: c.id, name: c.name, slug: c.slug };
}

function toServiceDTO(s) {
  return { id: s.id, name: s.name, shortDescription: s.shortDescription, fullDescription: s.fullDescription, image: s.imageUrl || null };
}

function toNewsDTO(n) {
  const d = n.date;
  const date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  return { id: n.id, date, title: n.title, excerpt: n.excerpt, body: n.body, image: n.imageUrl || null };
}

publicApiRouter.get("/products", async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { category: true },
  });
  res.json(products.map(toProductDTO));
});

publicApiRouter.get("/news", async (req, res) => {
  const news = await prisma.newsPost.findMany({ orderBy: { date: "desc" } });
  res.json(news.map(toNewsDTO));
});

publicApiRouter.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  res.json(categories.map(toCategoryDTO));
});

publicApiRouter.get("/services", async (req, res) => {
  const services = await prisma.service.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } });
  res.json(services.map(toServiceDTO));
});

publicApiRouter.get("/settings", async (req, res) => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  res.json({
    phone: settings?.phone || null,
    email: settings?.email || null,
    address: settings?.address || null,
    workingHours: settings?.workingHours || null,
    telegramUrl: settings?.telegramUrl || null,
    whatsappUrl: settings?.whatsappUrl || null,
    vkUrl: settings?.vkUrl || null,
    footerAbout: settings?.footerAbout || null,
  });
});

// ---------- Заявки с формы обратной связи (/pages/contacts.html) ----------
// Единственный "пишущий" публичный эндпоинт в этом файле — остальные выше
// read-only. Простая защита от спама без сторонних пакетов: honeypot-поле
// (людям его не видно, боты часто заполняют всё подряд) + ограничение
// частоты запросов по IP в памяти процесса (свежие данные не критичны,
// перезапуск сервера просто обнулит счётчик — это не хуже, чем не иметь
// лимита вовсе).
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 минут
const RATE_LIMIT_MAX = 5; // не больше 5 заявок с одного IP за окно
const rateLimitHits = new Map(); // ip -> [timestamps]

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Требуем минимум 10 цифр (российский номер без учёта форматирования) —
// не пытаемся строго валидировать формат, только заведомо неполные номера.
const PHONE_DIGITS_RE = /\d/g;

publicApiRouter.post("/leads", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Слишком много заявок с вашего адреса. Попробуйте позже или позвоните нам." });
  }

  const body = req.body || {};
  // Honeypot: обычное текстовое поле, скрытое CSS-ом на самой форме — если
  // оно заполнено, запрос почти наверняка от бота, тихо отклоняем без
  // подробностей (не подсказываем боту, что именно его выдало).
  if (body.website) {
    return res.status(400).json({ error: "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону." });
  }

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const company = String(body.company || "").trim();
  const email = String(body.email || "").trim();
  const comment = String(body.comment || "").trim();
  const consent = body.consent === true || body.consent === "true" || body.consent === "on" || body.consent === "1";

  const errors = [];
  if (!name) errors.push("Укажите имя.");
  else if (name.length > 200) errors.push("Имя слишком длинное.");
  const phoneDigits = phone.match(PHONE_DIGITS_RE) || [];
  if (!phone) errors.push("Укажите телефон.");
  else if (phoneDigits.length < 10) errors.push("Проверьте номер телефона.");
  if (email && !EMAIL_RE.test(email)) errors.push("Проверьте e-mail.");
  if (!consent) errors.push("Нужно согласие на обработку персональных данных.");
  if (company.length > 200) errors.push("Название компании слишком длинное.");
  if (comment.length > 4000) errors.push("Комментарий слишком длинный.");

  if (errors.length) {
    return res.status(400).json({ error: errors[0] });
  }

  try {
    await prisma.lead.create({
      data: {
        name,
        phone,
        company: company || null,
        email: email || null,
        comment: comment || null,
      },
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону." });
  }
});
