import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireCsrf, verifyCsrfToken } from "../middleware/csrf.js";
import { parseSpecsText, formatSpecsText } from "../lib/specs.js";
import { uploadProductImage, deleteProductImageFile } from "../lib/upload.js";
import { isValidId } from "../lib/validate.js";

export const productsRouter = Router();
productsRouter.use(requireAuth);

productsRouter.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  res.render("products/list", { products, flash: req.query.flash || null });
});

productsRouter.get("/new", async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  res.render("products/form", { product: null, values: null, specsText: "", categories, error: null });
});

productsRouter.post("/new", async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });

  try {
    await uploadProductImage(req, res);
  } catch (err) {
    return res.render("products/form", {
      product: null,
      values: req.body,
      specsText: req.body.specsText,
      categories,
      error: err.message || "Не удалось загрузить файл.",
    });
  }

  if (!verifyCsrfToken(req)) {
    if (req.file) deleteProductImageFile(`/uploads/products/${req.file.filename}`);
    return res.render("products/form", {
      product: null,
      values: req.body,
      specsText: req.body.specsText,
      categories,
      error: "Форма устарела. Обновите страницу и попробуйте снова.",
    });
  }

  const { id, categoryId, name, description, manufacturer, specsText } = req.body;

  if (!req.file) {
    return res.render("products/form", {
      product: null,
      values: req.body,
      specsText,
      categories,
      error: "Выберите фото товара — без изображения карточку создать нельзя.",
    });
  }
  if (!isValidId(id)) {
    deleteProductImageFile(`/uploads/products/${req.file.filename}`);
    return res.render("products/form", {
      product: null,
      values: req.body,
      specsText,
      categories,
      error: "Идентификатор может содержать только латиницу, цифры и дефис.",
    });
  }

  try {
    await prisma.product.create({
      data: {
        id,
        categoryId,
        name,
        description,
        manufacturer: manufacturer || "Уточняется",
        specs: parseSpecsText(specsText),
        imageUrl: `/uploads/products/${req.file.filename}`,
      },
    });
    res.redirect("/admin/products?flash=" + encodeURIComponent(`Товар «${name}» создан.`));
  } catch (e) {
    deleteProductImageFile(`/uploads/products/${req.file.filename}`); // не оставляем файл-сироту
    res.render("products/form", {
      product: null,
      values: req.body,
      specsText,
      categories,
      error: e.code === "P2002" ? `Товар с id «${id}» уже существует.` : "Не удалось сохранить товар.",
    });
  }
});

productsRouter.get("/:id/edit", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.redirect("/admin/products");
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  res.render("products/form", {
    product,
    values: null,
    specsText: formatSpecsText(product.specs),
    categories,
    error: null,
  });
});

productsRouter.post("/:id/edit", async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });

  try {
    await uploadProductImage(req, res);
  } catch (err) {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    return res.render("products/form", {
      product,
      values: null,
      specsText: req.body.specsText,
      categories,
      error: err.message || "Не удалось загрузить файл.",
    });
  }

  const { categoryId, name, description, manufacturer, specsText } = req.body;
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.redirect("/admin/products");
  if (!verifyCsrfToken(req)) {
    if (req.file) deleteProductImageFile(`/uploads/products/${req.file.filename}`);
    return res.render("products/form", { product: existing, values: null, specsText, categories, error: "Форма устарела. Обновите страницу и попробуйте снова." });
  }

  const newImageUrl = req.file ? `/uploads/products/${req.file.filename}` : existing.imageUrl;

  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: {
        categoryId,
        name,
        description,
        manufacturer: manufacturer || "Уточняется",
        specs: parseSpecsText(specsText),
        imageUrl: newImageUrl,
      },
    });
    if (req.file && existing.imageUrl) deleteProductImageFile(existing.imageUrl); // заменили — старое фото больше не нужно
    res.redirect("/admin/products?flash=" + encodeURIComponent(`Товар «${name}» сохранён.`));
  } catch (e) {
    if (req.file) deleteProductImageFile(newImageUrl);
    res.render("products/form", { product: existing, values: null, specsText, categories, error: "Не удалось сохранить товар." });
  }
});

productsRouter.post("/:id/delete", requireCsrf, async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  await prisma.product.delete({ where: { id: req.params.id } }).catch(() => {});
  if (product) deleteProductImageFile(product.imageUrl);
  res.redirect("/admin/products?flash=" + encodeURIComponent("Товар удалён."));
});
