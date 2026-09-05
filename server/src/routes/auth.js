import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireCsrf } from "../middleware/csrf.js";

export const authRouter = Router();

// Грубая защита от подбора пароля: слишком много неудачных попыток с одного
// IP за окно времени — временный отказ ещё до обращения к БД. В памяти
// процесса, сбрасывается при рестарте — тот же приемлемый компромисс, что и
// у лимитера на /api/leads (server/src/routes/publicApi.js). До этого раунда
// «Технический анализ по всем файлам» (2026-09-05) /admin/login не имел
// вообще никакой защиты от перебора пароля.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map(); // ip -> timestamps[]

setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of loginAttempts) {
    if (hits.every((t) => now - t > LOGIN_WINDOW_MS)) loginAttempts.delete(ip);
  }
}, LOGIN_WINDOW_MS).unref();

function isLoginRateLimited(ip) {
  const now = Date.now();
  const hits = (loginAttempts.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  loginAttempts.set(ip, hits);
  return hits.length >= LOGIN_MAX_ATTEMPTS;
}

authRouter.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/admin/products");
  res.render("login", { error: null, email: "" });
});

authRouter.post("/login", requireCsrf, async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const { email, password } = req.body;

  if (isLoginRateLimited(ip)) {
    return res.render("login", { error: "Слишком много попыток входа. Подождите несколько минут и попробуйте снова.", email });
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    loginAttempts.set(ip, [...(loginAttempts.get(ip) || []), Date.now()]);
    return res.render("login", { error: "Неверный e-mail или пароль.", email });
  }
  req.session.userId = user.id;
  res.redirect("/admin/products");
});

authRouter.post("/logout", requireCsrf, (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});
