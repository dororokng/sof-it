// Публичное read-only API сайта. Форма ответа повторяет поля, которые ждёт
// фронтенд (cat/catLabel/desc), — маппинг в DTO-функциях ниже.
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

// Приём заявок с формы контактов. Антиспам: honeypot-поле + rate-limit по IP
// в памяти процесса (сбрасывается при рестарте — допустимо).
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitHits = new Map(); // ip -> [timestamps]

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimitHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\d/g;

publicApiRouter.post("/leads", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Слишком много заявок с вашего адреса. Попробуйте позже или позвоните нам." });
  }

  const body = req.body || {};
  // Honeypot заполнен → бот, отклоняем без подробностей.
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
