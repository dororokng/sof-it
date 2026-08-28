import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireCsrf, verifyCsrfToken } from "../middleware/csrf.js";
import { uploadServiceImage, deleteServiceImageFile } from "../lib/upload.js";

export const servicesRouter = Router();
servicesRouter.use(requireAuth);

servicesRouter.get("/", async (req, res) => {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  res.render("services/list", { services, flash: req.query.flash || null });
});

servicesRouter.get("/new", (req, res) => {
  res.render("services/form", { service: null, values: null, error: null });
});

servicesRouter.post("/new", async (req, res) => {
  try {
    await uploadServiceImage(req, res);
  } catch (err) {
    return res.render("services/form", { service: null, values: req.body, error: err.message || "Не удалось загрузить файл." });
  }

  if (!verifyCsrfToken(req)) {
    if (req.file) deleteServiceImageFile(`/uploads/services/${req.file.filename}`);
    return res.render("services/form", { service: null, values: req.body, error: "Форма устарела. Обновите страницу и попробуйте снова." });
  }

  const { id, name, shortDescription, fullDescription, order } = req.body;
  try {
    await prisma.service.create({
      data: {
        id,
        name,
        slug: id,
        shortDescription,
        fullDescription: fullDescription || null,
        order: Number(order) || 0,
        imageUrl: req.file ? `/uploads/services/${req.file.filename}` : null,
      },
    });
    res.redirect("/admin/services?flash=" + encodeURIComponent(`Услуга «${name}» создана.`));
  } catch (e) {
    if (req.file) deleteServiceImageFile(`/uploads/services/${req.file.filename}`);
    res.render("services/form", {
      service: null,
      values: req.body,
      error: e.code === "P2002" ? `Услуга с id «${id}» уже существует.` : "Не удалось сохранить услугу.",
    });
  }
});

servicesRouter.get("/:id/edit", async (req, res) => {
  const service = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!service) return res.redirect("/admin/services");
  res.render("services/form", { service, values: null, error: null });
});

servicesRouter.post("/:id/edit", async (req, res) => {
  try {
    await uploadServiceImage(req, res);
  } catch (err) {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    return res.render("services/form", { service, values: null, error: err.message || "Не удалось загрузить файл." });
  }

  const { name, shortDescription, fullDescription, order, isPublished } = req.body;
  const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.redirect("/admin/services");
  if (!verifyCsrfToken(req)) {
    if (req.file) deleteServiceImageFile(`/uploads/services/${req.file.filename}`);
    return res.render("services/form", { service: existing, values: null, error: "Форма устарела. Обновите страницу и попробуйте снова." });
  }

  const newImageUrl = req.file ? `/uploads/services/${req.file.filename}` : existing.imageUrl;

  try {
    await prisma.service.update({
      where: { id: req.params.id },
      data: {
        name,
        shortDescription,
        fullDescription: fullDescription || null,
        order: Number(order) || 0,
        isPublished: isPublished === "on",
        imageUrl: newImageUrl,
      },
    });
    if (req.file && existing.imageUrl) deleteServiceImageFile(existing.imageUrl);
    res.redirect("/admin/services?flash=" + encodeURIComponent(`Услуга «${name}» сохранена.`));
  } catch (e) {
    if (req.file) deleteServiceImageFile(newImageUrl);
    res.render("services/form", { service: existing, values: null, error: "Не удалось сохранить услугу." });
  }
});

servicesRouter.post("/:id/delete", requireCsrf, async (req, res) => {
  const service = await prisma.service.findUnique({ where: { id: req.params.id } });
  await prisma.service.delete({ where: { id: req.params.id } }).catch(() => {});
  if (service) deleteServiceImageFile(service.imageUrl);
  res.redirect("/admin/services?flash=" + encodeURIComponent("Услуга удалена."));
});
