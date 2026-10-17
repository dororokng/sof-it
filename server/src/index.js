import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
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

const isProduction = process.env.NODE_ENV === "production";
// Держать в синхроне с .env.example — это ровно то значение, которое там
// лежит как подсказка. Если в продакшене SESSION_SECRET всё ещё равен ему,
// значит .env.example скопировали как есть и забыли сгенерировать секрет.
const EXAMPLE_SESSION_SECRET = "change_me_to_a_random_string";

// Продакшен-гварды времени запуска (аудит, находка DEPLOY-001/SEC-001):
// лучше не стартовать с понятной ошибкой, чем молча работать в опасной
// конфигурации (предсказуемый секрет сессии, либо secure-cookie за прокси
// без доверенного trust proxy — см. комментарий у TRUST_PROXY ниже).
if (isProduction) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === EXAMPLE_SESSION_SECRET) {
    console.error(
      "Отказ запуска: NODE_ENV=production, но SESSION_SECRET не задан или равен примеру из .env.example. Сгенерируйте реальный случайный секрет."
    );
    process.exit(1);
  }
  if (!process.env.TRUST_PROXY) {
    console.error(
      'Отказ запуска: NODE_ENV=production требует TRUST_PROXY (см. .env.example — "loopback", если Nginx на этом же сервере, или число хопов, например "1", если на отдельном). Без этого secure-cookie сессии и req.ip в rate-limit'
      + " сломаются за реверс-прокси."
    );
    process.exit(1);
  }
}

const app = express();
const port = process.env.PORT || 4000;

app.disable("x-powered-by");

// trust proxy — только из явной переменной окружения, никогда не включаем
// автоматическое "true" (аудит, SEC-001): "true" доверяет X-Forwarded-For от
// ЛЮБОГО клиента, что позволяет подделать IP и обойти rate-limit на
// /admin/login и /api/leads. Допустимые значения — то же, что принимает сам
// Express (число хопов, "loopback", список IP/CIDR и т.п.), кроме "true".
const TRUST_PROXY = process.env.TRUST_PROXY;
if (TRUST_PROXY) {
  if (TRUST_PROXY.trim().toLowerCase() === "true") {
    console.error('Отказ запуска: TRUST_PROXY="true" не допускается — используйте "loopback" или число хопов, например "1".');
    process.exit(1);
  }
  const asNumber = Number(TRUST_PROXY);
  app.set("trust proxy", Number.isNaN(asNumber) ? TRUST_PROXY : asNumber);
}

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

// Защитные заголовки (аудит, находка SEC-003) — до express.static, чтобы
// заголовки получала и статика (/css, /js, /images), и /uploads, а не
// только динамические роуты. Инвентаризация внешних ресурсов и инлайн-кода
// перед настройкой CSP (см. CLAUDE.md, раздел про аудит): iframe/внешних
// скриптов/виджетов нет. Инлайн-скриптов и обработчиков on*= в разметке
// не осталось — анти-FOUC скрипт вынесен в js/js-reveal-init.js, два места
// в JS, писавшие напрямую в style (reveal-задержка карточек и прогресс-бар
// «Журнала смены»), переведены на классы — см. js/main.js и
// js/industry-proof.js. Единственное исключение — pages/styleguide.html,
// внутренняя noindex-страница дизайн-системы, не связанная ссылками с
// остального сайта: там десятки inline style= для демонстрации цветовых
// токенов, которые нет смысла дробить на классы. Ей отдельно ниже
// переопределяется CSP с 'unsafe-inline' в style-src — остальной сайт
// получает строгую версию без него.
// Google Fonts (fonts.googleapis.com/fonts.gstatic.com) были единственным
// внешним ресурсом сайта — с раунда «Исправления после аудита, шаг 3»
// (2026-10-17) шрифты раздаются со своего сервера (/fonts, см. CLAUDE.md),
// внешних ресурсов не осталось вообще, default-src 'self' покрывает всё.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    // HSTS имеет смысл только на HTTPS — на голом HTTP (сейчас) заголовок
    // не шлём вообще, включится сам в production.
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: false, preload: false } : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    crossOriginEmbedderPolicy: false,
  })
);
// Permissions-Policy — вручную: у helmet нет для него готового модуля.
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
// Единственное исключение из строгого CSP — см. комментарий выше. Роут
// регистрируется раньше общей раздачи /pages, поэтому именно он отвечает
// на этот конкретный путь, и res.setHeader здесь успевает перезаписать
// CSP, выставленный helmet чуть выше (заголовки ещё не отправлены клиенту).
// В production страница вообще не отдаётся (404, как и любой другой
// несуществующий путь) — это внутренний dev-инструмент, 'unsafe-inline'
// в CSP ослаблять ради него на живом сайте незачем.
app.get("/pages/styleguide.html", (req, res) => {
  if (isProduction) {
    return res.status(404).sendFile(path.join(projectRoot, "404.html"));
  }
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
      "font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; " +
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  );
  res.sendFile(path.join(projectRoot, "pages", "styleguide.html"));
});

// Отдаём наружу только публичные директории, а не весь корень репозитория
// (в нём же server/, docker-compose.yml, .env).
app.use("/css", express.static(path.join(projectRoot, "css")));
app.use("/js", express.static(path.join(projectRoot, "js")));
app.use("/pages", express.static(path.join(projectRoot, "pages")));
app.use("/partials", express.static(path.join(projectRoot, "partials")));
// Cache-Control по аудиту (шаг 3, кэш/сжатие): /fonts и /uploads — год и
// immutable, у обоих имена файлов уникальные и никогда не переиспользуются
// (шрифты — хеш в имени от @fontsource, загрузки — <timestamp>-<rand>).
// /images — 7 дней: именная часть может со временем смениться (см. CLAUDE.md
// — при замене картинки менять имя файла, не перезаписывать путь), но не
// настолько часто, чтобы совсем не кэшировать. CSS/JS/HTML — без явного
// Cache-Control, как и раньше (браузер сверяется по ETag на каждый запрос).
app.use("/fonts", express.static(path.join(projectRoot, "fonts"), { maxAge: "1y", immutable: true }));
app.use("/images", express.static(path.join(projectRoot, "images"), { maxAge: "7d" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), { maxAge: "1y", immutable: true }));
for (const file of ["favicon.svg", "robots.txt", "sitemap.xml"]) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(projectRoot, file)));
}
// Отдельно от остальных статических файлов: прямой заход на /404.html тоже
// должен возвращать код 404, а не 200 (аудит, находка SEO-001).
app.get("/404.html", (req, res) => res.status(404).sendFile(path.join(projectRoot, "404.html")));
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(projectRoot, "index.html")));

// Чистые URL для отраслевых направлений (категория → направление, см.
// industryCategories в js/solutions-data.js): /otrasli/:group и
// /otrasli/:group/:item отдают те же статические шаблоны, что раньше были
// доступны только по ?slug=... — сам слаг клиентский JS разбирает из
// location.pathname (industry-category-page.js / industry-item-page.js).
app.get("/otrasli/:group/:item", (req, res) => res.sendFile(path.join(projectRoot, "pages", "otrasl-item.html")));
app.get("/otrasli/:group", (req, res) => res.sendFile(path.join(projectRoot, "pages", "otrasl-kategoriya.html")));

app.use(express.static(path.join(__dirname, "public")));

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true,
      // Явно прописан дефолт connect-pg-simple (аудит, находка INFRA-001 —
      // проверка, что очистка просроченных сессий включена): раз в 15 минут
      // удаляет из таблицы session строки с истёкшим expire.
      pruneSessionInterval: 60 * 15,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      // HTTPS пока не настроен (см. аудит, DEPLOY-001) — secure-cookie
      // включится сам, когда сайт реально заработает на HTTPS под
      // NODE_ENV=production; до этого на голом HTTP secure:true сломал бы
      // вход полностью (браузер не отправит такую cookie без TLS).
      secure: isProduction,
    },
  })
);

app.get("/api/health", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});
app.use("/api", publicApiRouter);

// CSRF — только для /admin/*, где реально рендерятся формы с полем _csrf
// (аудит, находка INFRA-001). Раньше стоял глобально и на каждый анонимный
// запрос, включая чтения публичного /api/*, писал новую сессию в Postgres.
app.use("/admin", csrfMiddleware);
app.get("/admin", (req, res) => res.redirect("/admin/products"));
app.use("/admin", authRouter);
app.use("/admin/products", productsRouter);
app.use("/admin/categories", categoriesRouter);
app.use("/admin/news", newsRouter);
app.use("/admin/settings", settingsRouter);
app.use("/admin/leads", leadsRouter);

// Catch-all для несуществующих путей — должен стоять после всех реальных
// роутов и статики, но до обработчика ошибок (аудит, находка SEO-001).
// /api/* отдаёт JSON (это API, не HTML-страница), всё остальное — фирменную
// 404.html с кодом 404 (раньше неизвестный путь отдавал голую техническую
// страницу Express с "Cannot GET ...").
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(projectRoot, "404.html"));
});

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
