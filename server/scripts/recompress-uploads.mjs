// Разовая миграция (аудит, шаг 3б) — существующие загрузки из админки
// пережимаются в WebP тем же кодом, что и новые (upload.js: width<=1600,
// quality:80). Оригиналы уходят в server/uploads-originals/ (вне раздачи
// — там нет express.static). Запускать один раз, после бэкапа БД.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { prisma } from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, "../uploads");
const originalsRoot = path.resolve(__dirname, "../uploads-originals");

const TARGETS = [
  { table: "product", folder: "products" },
  { table: "newsPost", folder: "news" },
];

for (const { table, folder } of TARGETS) {
  const rows = await prisma[table].findMany({ where: { imageUrl: { not: null } } });
  fs.mkdirSync(path.join(originalsRoot, folder), { recursive: true });

  for (const row of rows) {
    const relPath = row.imageUrl.replace(/^\/uploads\//, "");
    const srcPath = path.join(uploadsRoot, relPath);
    if (!fs.existsSync(srcPath)) {
      console.log(`[пропуск] ${table} ${row.id}: файл не найден — ${srcPath}`);
      continue;
    }
    const oldExt = path.extname(relPath);
    if (oldExt === ".webp") {
      console.log(`[пропуск] ${table} ${row.id}: уже .webp`);
      continue;
    }

    const newName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const newPath = path.join(uploadsRoot, folder, newName);
    await sharp(srcPath).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(newPath);

    const originalBackupPath = path.join(originalsRoot, folder, path.basename(srcPath));
    fs.renameSync(srcPath, originalBackupPath);

    const newImageUrl = `/uploads/${folder}/${newName}`;
    await prisma[table].update({ where: { id: row.id }, data: { imageUrl: newImageUrl } });

    const oldSize = fs.statSync(originalBackupPath).size;
    const newSize = fs.statSync(newPath).size;
    console.log(
      `[готово] ${table} ${row.id}: ${(oldSize / 1024).toFixed(0)} КБ -> ${(newSize / 1024).toFixed(0)} КБ, ` +
        `${row.imageUrl} -> ${newImageUrl}, оригинал -> uploads-originals/${folder}/${path.basename(srcPath)}`
    );
  }
}

await prisma.$disconnect();
