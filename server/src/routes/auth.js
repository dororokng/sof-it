import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireCsrf } from "../middleware/csrf.js";

export const authRouter = Router();

authRouter.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/admin/products");
  res.render("login", { error: null, email: "" });
});

authRouter.post("/login", requireCsrf, async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    return res.render("login", { error: "Неверный e-mail или пароль.", email });
  }
  req.session.userId = user.id;
  res.redirect("/admin/products");
});

authRouter.post("/logout", requireCsrf, (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});
