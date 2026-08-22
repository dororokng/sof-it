import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadNewsImage, deleteNewsImageFile } from "../lib/upload.js";

export const newsRouter = Router();
newsRouter.use(requireAuth);

newsRouter.get("/", async (req, res) => {
  const news = await prisma.newsPost.findMany({ orderBy: { date: "desc" } });
  res.render("news/list", { news, flash: req.query.flash || null });
});

newsRouter.get("/new", (req, res) => {
  res.render("news/form", { post: null, values: null, error: null });
});

newsRouter.post("/new", async (req, res) => {
  try {
    await uploadNewsImage(req, res);
  } catch (err) {
    return res.render("news/form", {
      post: null,
      values: req.body,
      error: err.message || "Не удалось загрузить файл.",
    });
  }

  // Фото у новости необязательно — в отличие от товара, ошибки при его отсутствии нет.
  const { id, date, title, excerpt, body } = req.body;
  try {
    await prisma.newsPost.create({
      data: {
        id,
        date: new Date(date),
        title,
        excerpt,
        body,
        imageUrl: req.file ? `/uploads/news/${req.file.filename}` : null,
      },
    });
    res.redirect("/admin/news?flash=" + encodeURIComponent(`Новость «${title}» создана.`));
  } catch (e) {
    if (req.file) deleteNewsImageFile(`/uploads/news/${req.file.filename}`); // не оставляем файл-сироту
    res.render("news/form", {
      post: null,
      values: req.body,
      error: e.code === "P2002" ? `Новость с id «${id}» уже существует.` : "Не удалось сохранить новость.",
    });
  }
});

newsRouter.get("/:id/edit", async (req, res) => {
  const post = await prisma.newsPost.findUnique({ where: { id: req.params.id } });
  if (!post) return res.redirect("/admin/news");
  res.render("news/form", { post, values: null, error: null });
});

newsRouter.post("/:id/edit", async (req, res) => {
  try {
    await uploadNewsImage(req, res);
  } catch (err) {
    const post = await prisma.newsPost.findUnique({ where: { id: req.params.id } });
    return res.render("news/form", { post, values: null, error: err.message || "Не удалось загрузить файл." });
  }

  const { date, title, excerpt, body } = req.body;
  const existing = await prisma.newsPost.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.redirect("/admin/news");

  const newImageUrl = req.file ? `/uploads/news/${req.file.filename}` : existing.imageUrl;

  try {
    await prisma.newsPost.update({
      where: { id: req.params.id },
      data: { date: new Date(date), title, excerpt, body, imageUrl: newImageUrl },
    });
    if (req.file && existing.imageUrl) deleteNewsImageFile(existing.imageUrl); // заменили — старое фото больше не нужно
    res.redirect("/admin/news?flash=" + encodeURIComponent(`Новость «${title}» сохранена.`));
  } catch (e) {
    if (req.file) deleteNewsImageFile(newImageUrl);
    res.render("news/form", { post: existing, values: null, error: "Не удалось сохранить новость." });
  }
});

newsRouter.post("/:id/delete", async (req, res) => {
  const post = await prisma.newsPost.findUnique({ where: { id: req.params.id } });
  await prisma.newsPost.delete({ where: { id: req.params.id } }).catch(() => {});
  if (post) deleteNewsImageFile(post.imageUrl);
  res.redirect("/admin/news?flash=" + encodeURIComponent("Новость удалена."));
});
