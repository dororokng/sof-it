import sharp from "sharp";
import { readdirSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const srcServices = path.join(root, "design-src/images/services");
const srcIndustries = path.join(root, "design-src/images/industries");
const outImages = path.join(root, "images");
mkdirSync(path.join(outImages, "industries"), { recursive: true });
mkdirSync(path.join(outImages, "services"), { recursive: true });

const PHOTOS = [
  "manufacturing.jpeg", "metallurgy.jpeg", "retail.jpeg",
  "logistics.jpeg", "construction.jpeg", "service-sector.jpeg",
];
const SCHEMES_SERVICES = [
  "avtomatizaciya-scheme.png", "dorabotka-scheme.png", "obnovlenie-scheme.png",
  "soprovozhdenie-scheme.png", "vnedrenie-scheme.png", "it.jpeg",
];
const SCHEMES_INDUSTRIES = ["industry-scheme.png"];

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

const report = [];

// Две фотографии при стандартном quality:78 на 1600px не укладывались в
// цель 150 КБ (metallurgy — высокодетальная сцена с искрами/текстурой
// металла, 214 КБ; logistics — 154 КБ). Понижено точечно только для них,
// только на 1600w (800w и так укладывался) — на глаз разницы с q78 нет
// (сравнивал 1600px рядом), баннинга/артефактов не появилось.
const QUALITY_OVERRIDE_1600 = { metallurgy: 56, logistics: 76 };

async function convertPhoto(name) {
  const base = name.replace(/\.(jpe?g|png)$/i, "");
  const src = path.join(srcIndustries, name);
  const origSize = statSync(src).size;
  for (const w of [800, 1600]) {
    const quality = w === 1600 && QUALITY_OVERRIDE_1600[base] ? QUALITY_OVERRIDE_1600[base] : 78;
    const out = path.join(outImages, "industries", `${base}-${w}.webp`);
    const buf = await sharp(src).resize({ width: w }).webp({ quality }).toBuffer();
    await sharp(buf).toFile(out);
    report.push({ file: `industries/${base}-${w}.webp`, orig: origSize, out: buf.length, kind: "photo", quality });
  }
}

async function convertScheme(name, srcDir, outSubdir) {
  const base = name.replace(/\.(jpe?g|png)$/i, "");
  const src = path.join(srcDir, name);
  const origSize = statSync(src).size;
  const lossless = await sharp(src).webp({ lossless: true }).toBuffer();
  const q90 = await sharp(src).webp({ quality: 90 }).toBuffer();
  const pick = lossless.length <= q90.length ? { buf: lossless, mode: "lossless" } : { buf: q90, mode: "q90" };
  const out = path.join(outImages, outSubdir, `${base}.webp`);
  await sharp(pick.buf).toFile(out);
  report.push({
    file: `${outSubdir}/${base}.webp`, orig: origSize, out: pick.buf.length, kind: "scheme",
    mode: pick.mode, lossless: lossless.length, q90: q90.length,
  });
}

for (const name of PHOTOS) await convertPhoto(name);
for (const name of SCHEMES_SERVICES) await convertScheme(name, srcServices, "services");
for (const name of SCHEMES_INDUSTRIES) await convertScheme(name, srcIndustries, "industries");

console.log("\n=== Отчёт конвертации ===");
for (const r of report) {
  const extra = r.kind === "scheme" ? ` (lossless=${kb(r.lossless)}KB, q90=${kb(r.q90)}KB, выбрано=${r.mode})` : "";
  console.log(`${r.file}: ${kb(r.orig)}KB -> ${kb(r.out)}KB${extra}`);
}
