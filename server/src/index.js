import "dotenv/config";
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
import { servicesRouter } from "./routes/services.js";
import { settingsRouter } from "./routes/settings.js";
import { leadsRouter } from "./routes/leads.js";
import { publicApiRouter } from "./routes/publicApi.js";
import { csrfMiddleware } from "./middleware/csrf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../"); // корень репозитория — там css/, js/, pages/

const app = express();
const port = process.env.PORT || 4000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // нужен для fetch(JSON) с формы заявки на /pages/contacts.html

// Отдаём наружу только то, что реально должно быть публичным — НЕ весь
// корень репозитория целиком (там же лежат server/, docker-compose.yml,
// .env и т.п., которым в вебе делать нечего).
app.use("/css", express.static(path.join(projectRoot, "css")));
app.use("/js", express.static(path.join(projectRoot, "js")));
app.use("/pages", express.static(path.join(projectRoot, "pages")));
app.use("/partials", express.static(path.join(projectRoot, "partials")));
app.use("/images", express.static(path.join(projectRoot, "images"))); // статичные картинки дизайна (не то же самое, что uploads/ — туда попадает только загруженное через админку)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"))); // фото товаров и новостей (uploads/products, uploads/news)
for (const file of ["favicon.svg", "robots.txt", "sitemap.xml", "404.html"]) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(projectRoot, file)));
}
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(projectRoot, "index.html")));

app.use(express.static(path.join(__dirname, "public"))); // отдаёт /admin.css

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({ pool: pgPool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // неделя
  })
);
app.use(csrfMiddleware); // кладёт res.locals.csrfToken — нужен и /admin/login (до входа), и всем формам админки

app.get("/api/health", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});
app.use("/api", publicApiRouter);

app.get("/admin", (req, res) => res.redirect("/admin/products"));
app.use("/admin", authRouter);
app.use("/admin/products", productsRouter);
app.use("/admin/categories", categoriesRouter);
app.use("/admin/services", servicesRouter);
app.use("/admin/news", newsRouter);
app.use("/admin/settings", settingsRouter);
app.use("/admin/leads", leadsRouter);

app.listen(port, () => {
  console.log(`Sofit API listening on http://localhost:${port}`);
});
