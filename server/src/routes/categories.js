import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireCsrf, verifyCsrfToken } from "../middleware/csrf.js";
import { uploadCategoryImage, deleteCategoryImageFile } from "../lib/upload.js";
import { isValidId } from "../lib/validate.js";

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  res.render("categories/list", { categories, flash: req.query.flash || null });
});

categoriesRouter.get("/new", (req, res) => {
  res.render("categories/form", { category: null, values: null, error: null });
});

categoriesRouter.post("/new", async (req, res) => {
  try {
    await uploadCategoryImage(req, res);
  } catch (err) {
    return res.render("categories/form", { category: null, values: req.body, error: err.message || "Не удалось загрузить файл." });
  }
  if (!verifyCsrfToken(req)) {
    if (req.file) deleteCategoryImageFile(`/uploads/categories/${req.file.filename}`);
    return res.render("categories/form", { category: null, values: req.body, error: "Форма устарела. Обновите страницу и попробуйте снова." });
  }

  const { id, name, description, order } = req.body;
  if (!isValidId(id)) {
    if (req.file) deleteCategoryImageFile(`/uploads/categories/${req.file.filename}`);
    return res.render("categories/form", {
      category: null,
      values: req.body,
      error: "Идентификатор может содержать только латиницу, цифры и дефис.",
    });
  }
  try {
    await prisma.category.create({
      data: {
        id,
        name,
        slug: id,
        description: description || null,
        order: Number(order) || 0,
        imageUrl: req.file ? `/uploads/categories/${req.file.filename}` : null,
      },
    });
    res.redirect("/admin/categories?flash=" + encodeURIComponent(`Категория «${name}» создана.`));
  } catch (e) {
    if (req.file) deleteCategoryImageFile(`/uploads/categories/${req.file.filename}`);
    res.render("categories/form", {
      category: null,
      values: req.body,
      error: e.code === "P2002" ? `Категория с id «${id}» уже существует.` : "Не удалось сохранить категорию.",
    });
  }
});

categoriesRouter.get("/:id/edit", async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) return res.redirect("/admin/categories");
  res.render("categories/form", { category, values: null, error: null });
});

categoriesRouter.post("/:id/edit", async (req, res) => {
  try {
    await uploadCategoryImage(req, res);
  } catch (err) {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    return res.render("categories/form", { category, values: null, error: err.message || "Не удалось загрузить файл." });
  }

  const { name, description, order, isActive } = req.body;
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.redirect("/admin/categories");
  if (!verifyCsrfToken(req)) {
    if (req.file) deleteCategoryImageFile(`/uploads/categories/${req.file.filename}`);
    return res.render("categories/form", { category: existing, values: null, error: "Форма устарела. Обновите страницу и попробуйте снова." });
  }

  const newImageUrl = req.file ? `/uploads/categories/${req.file.filename}` : existing.imageUrl;

  try {
    await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        description: description || null,
        order: Number(order) || 0,
        isActive: isActive === "on",
        imageUrl: newImageUrl,
      },
    });
    if (req.file && existing.imageUrl) deleteCategoryImageFile(existing.imageUrl);
    res.redirect("/admin/categories?flash=" + encodeURIComponent(`Категория «${name}» сохранена.`));
  } catch (e) {
    if (req.file) deleteCategoryImageFile(newImageUrl);
    res.render("categories/form", { category: existing, values: null, error: "Не удалось сохранить категорию." });
  }
});

categoriesRouter.post("/:id/delete", requireCsrf, async (req, res) => {
  const inUse = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (inUse > 0) {
    return res.redirect(
      "/admin/categories?flash=" +
        encodeURIComponent(`Нельзя удалить категорию — в ней ${inUse} товар(ов). Сначала перенесите или удалите их.`)
    );
  }
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  await prisma.category.delete({ where: { id: req.params.id } }).catch(() => {});
  if (category) deleteCategoryImageFile(category.imageUrl);
  res.redirect("/admin/categories?flash=" + encodeURIComponent("Категория удалена."));
});
