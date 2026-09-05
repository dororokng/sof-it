import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { newsRouter } from "./routes/news.js";
import { categoriesRouter } from "./routes/categories.js";
import { settingsRouter } from "./routes/settings.js";
import { leadsRouter } from "./routes/leads.js";
import { publicApiRouter } from "./routes/publicApi.js";
import { csrfMiddleware } from "./middleware/csrf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

const app = express();
const port = process.env.PORT || 4000;

// Express по умолчанию парсит query-string через "qs" (query parser:
// "extended") — там сейчас открытая уязвимость без выпущенного патча
// (array-limit bypass / DoS через вложенные bracket-ключи, см. npm audit).
// В проекте нигде не используются вложенные/массивные query-параметры
// (везде плоские вида ?id=..., ?slug=..., ?flash=...), поэтому переключаем
// на встроенный querystring ("simple") — он не подвержен этой уязвимости и
// покрывает все реальные кейсы. Если когда-нибудь понадобится вложенный
// параметр вида ?a[b]=1 — эту строку придётся убрать и решать проблему
// иначе (обновлением qs, как только выйдет патч).
app.set("query parser", "simple");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Временный слой Basic Auth поверх ВСЕГО сайта (включая /admin), нужен только
// пока сервер прокинут в публичный интернет через ngrok/туннель. Активируется
// исключительно если заданы обе переменные окружения — без них ведёт себя как
// раньше, без каких-либо ограничений (обычная локальная разработка).
const PUBLIC_AUTH_USER = process.env.PUBLIC_BASIC_AUTH_USER;
const PUBLIC_AUTH_PASS = process.env.PUBLIC_BASIC_AUTH_PASS;
if (PUBLIC_AUTH_USER && PUBLIC_AUTH_PASS) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded) {
      const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
      const userOk = user?.length === PUBLIC_AUTH_USER.length && crypto.timingSafeEqual(Buffer.from(user), Buffer.from(PUBLIC_AUTH_USER));
      const passOk = pass?.length === PUBLIC_AUTH_PASS.length && crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(PUBLIC_AUTH_PASS));
      if (userOk && passOk) return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="Sofit"');
    res.status(401).send("Authentication required.");
  });
}

// Отдаём наружу только публичные директории, а не весь корень репозитория
// (в нём же server/, docker-compose.yml, .env).
app.use("/css", express.static(path.join(projectRoot, "css")));
app.use("/js", express.static(path.join(projectRoot, "js")));
app.use("/pages", express.static(path.join(projectRoot, "pages")));
app.use("/partials", express.static(path.join(projectRoot, "partials")));
app.use("/images", express.static(path.join(projectRoot, "images")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
for (const file of ["favicon.svg", "robots.txt", "sitemap.xml", "404.html"]) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(projectRoot, file)));
}
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(projectRoot, "index.html")));

app.use(express.static(path.join(__dirname, "public")));

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({ pool: pgPool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);
app.use(csrfMiddleware);

app.get("/api/health", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});
app.use("/api", publicApiRouter);

app.get("/admin", (req, res) => res.redirect("/admin/products"));
app.use("/admin", authRouter);
app.use("/admin/products", productsRouter);
app.use("/admin/categories", categoriesRouter);
app.use("/admin/news", newsRouter);
app.use("/admin/settings", settingsRouter);
app.use("/admin/leads", leadsRouter);

// Единый обработчик ошибок — всегда последним. Не полагается на NODE_ENV:
// клиенту в любом окружении уходит только код и общая фраза, полная ошибка
// со стеком — только в серверный лог. Без этого блока Express в режиме
// development (по умолчанию, если NODE_ENV не выставлен явно) отдаёт
// клиенту стек вызовов прямо в теле ответа.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).send("Внутренняя ошибка сервера.");
});

app.listen(port, () => {
  console.log(`Sofit API listening on http://localhost:${port}`);
});
