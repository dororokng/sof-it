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
