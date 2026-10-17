// Разовый скрипт: берёт нужные woff2 из @fontsource (dev-пакеты, см.
// design-src/package.json) и собирает css/fonts.css + копирует файлы в
// /fonts. Инструменты сюда, не в рантайм сервера — см. CLAUDE.md.
//
// IBM Plex Sans — вариативный (@fontsource-variable), один файл на
// подмножество покрывает весь диапазон начертаний 100-700 разом (в
// style.css используются 400/500/600/700 — все внутри этого диапазона).
// IBM Plex Mono — обычный статический, только вес 400 (единственное
// место с 600 — .scheme-num на pages/robotics.html — переведено на 400,
// см. CLAUDE.md про аудит, шаг 3б: Google Fonts тоже никогда не грузил
// настоящий Mono-600, браузер его только имитировал синтетическим bold).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const fontsOut = path.join(root, "fonts");
fs.rmSync(fontsOut, { recursive: true, force: true });
fs.mkdirSync(fontsOut, { recursive: true });

const SUBSETS = ["latin", "latin-ext", "cyrillic"];

let out = "/* Автогенерировано design-src/build-fonts.mjs — не редактировать руками.\n" +
  "   Источник: @fontsource-variable/ibm-plex-sans, @fontsource/ibm-plex-mono\n" +
  "   (dev-зависимости design-src/package.json). Подмножества: latin, latin-ext\n" +
  "   (в нём ₽, U+20AD-20C0), cyrillic. Без italic — на сайте нигде не используется.\n" +
  "   Sans — вариативный шрифт (один файл на подмножество, вес 100-700 целиком),\n" +
  "   Mono — статический, только вес 400 (единственное место с 600 переведено\n" +
  "   на 400, см. CLAUDE.md). */\n\n";

// --- IBM Plex Sans Variable: wght.css, по одному блоку на подмножество ---
{
  const cssPath = path.join(root, "design-src/node_modules/@fontsource-variable/ibm-plex-sans/wght.css");
  const src = fs.readFileSync(cssPath, "utf8");
  const blocks = src.split(/\n\n+/).filter(Boolean);
  for (const block of blocks) {
    const nameMatch = block.match(/\/\* ([\w-]+) \*\//);
    const subset = SUBSETS.find((s) => nameMatch[1] === `ibm-plex-sans-${s}-wght-normal`);
    if (!subset) continue;
    const fileMatch = block.match(/url\(\.\/files\/([\w.-]+\.woff2)\)/);
    const rangeMatch = block.match(/unicode-range: ([^;]+);/);
    const srcFile = path.join(root, "design-src/node_modules/@fontsource-variable/ibm-plex-sans/files", fileMatch[1]);
    fs.copyFileSync(srcFile, path.join(fontsOut, fileMatch[1]));
    out += `@font-face {\n  font-family: 'IBM Plex Sans';\n  font-style: normal;\n  font-weight: 100 700;\n  font-display: swap;\n  src: url(/fonts/${fileMatch[1]}) format('woff2-variations');\n  unicode-range: ${rangeMatch[1]};\n}\n\n`;
  }
}

// --- IBM Plex Mono: только вес 400, статический ---
{
  const cssPath = path.join(root, "design-src/node_modules/@fontsource/ibm-plex-mono/400.css");
  const src = fs.readFileSync(cssPath, "utf8");
  const blocks = src.split(/\n\n+/).filter(Boolean);
  for (const block of blocks) {
    const nameMatch = block.match(/\/\* ([\w-]+) \*\//);
    const subset = SUBSETS.find((s) => nameMatch[1] === `ibm-plex-mono-${s}-400-normal`);
    if (!subset) continue;
    const fileMatch = block.match(/url\(\.\/files\/([\w.-]+\.woff2)\)/);
    const rangeMatch = block.match(/unicode-range: ([^;]+);/);
    const srcFile = path.join(root, "design-src/node_modules/@fontsource/ibm-plex-mono/files", fileMatch[1]);
    fs.copyFileSync(srcFile, path.join(fontsOut, fileMatch[1]));
    out += `@font-face {\n  font-family: 'IBM Plex Mono';\n  font-style: normal;\n  font-weight: 400;\n  font-display: swap;\n  src: url(/fonts/${fileMatch[1]}) format('woff2');\n  unicode-range: ${rangeMatch[1]};\n}\n\n`;
  }
}

fs.writeFileSync(path.join(root, "css/fonts.css"), out);
console.log("Готово:", fs.readdirSync(fontsOut).length, "файлов в /fonts, css/fonts.css собран.");
