import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.resolve(__dirname, "../../uploads");

// Тип файла определяем по первым байтам содержимого, а не по file.mimetype
// (аудит, SEC-003) — mimetype это Content-Type, который клиент указывает
// сам в multipart-запросе, его легко подделать (прислать произвольный файл
// с Content-Type: image/jpeg). Только три формата, без SVG (может нести
// активный контент) и без GIF (раньше был разрешён, по этому аудиту —
// сознательно сужаем список до того, что реально нужно сайту).
function detectImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: ".jpg", mime: "image/jpeg" };
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { ext: ".png", mime: "image/png" };
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: ".webp", mime: "image/webp" };
  }
  return null;
}

async function readHeader(filePath, length) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buf = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buf, 0, length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function multerErrorMessage(err) {
  if (err.code === "LIMIT_FILE_SIZE") return "Файл слишком большой — максимум 5 МБ.";
  return err.message || "Не удалось загрузить файл.";
}

// Оборачиваем multer в промис, чтобы роут сам обрабатывал ошибку загрузки.
function createImageUploader(subfolder) {
  const dir = path.join(uploadsRoot, subfolder);
  fs.mkdirSync(dir, { recursive: true });

  // Имя файла — случайное, без расширения: настоящее расширение узнаём
  // только после того, как файл дописан на диск и мы заглянули в байты.
  const storage = multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.upload`),
  });

  const multerUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 МБ
  }).single("image");

  function uploadImage(req, res) {
    return new Promise((resolve, reject) => {
      multerUpload(req, res, async (err) => {
        if (err) return reject(new Error(multerErrorMessage(err)));
        if (!req.file) return resolve(); // файл не выбран — решает сам роут (обязателен он там или нет)

        try {
          const header = await readHeader(req.file.path, 12);
          const type = detectImageType(header);
          if (!type) {
            fs.unlink(req.file.path, () => {});
            return reject(new Error("Разрешены только изображения: JPG, PNG или WEBP (проверка по содержимому файла не прошла)."));
          }
          // Пережимаем в WebP вне зависимости от исходного формата (аудит,
          // шаг 3б/PERF): ширина не больше 1600px (сохраняя пропорции,
          // не увеличиваем меньшие), quality:80. Имя всегда .webp —
          // настоящее содержимое уже проверено detectImageType() выше,
          // sharp работает с уже провалидированными байтами, а не с тем,
          // что прислал клиент напрямую.
          const finalName = req.file.filename.replace(/\.upload$/, ".webp");
          const finalPath = path.join(dir, finalName);
          await sharp(req.file.path)
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(finalPath);
          await fs.promises.unlink(req.file.path);
          req.file.filename = finalName;
          req.file.path = finalPath;
          req.file.mimetype = "image/webp";
          resolve();
        } catch (e) {
          fs.unlink(req.file.path, () => {});
          reject(e);
        }
      });
    });
  }

  function deleteImageFile(imageUrl) {
    if (!imageUrl) return;
    const filePath = path.join(uploadsRoot, imageUrl.replace(/^\/uploads\//, ""));
    fs.unlink(filePath, () => {});
  }

  return { uploadImage, deleteImageFile };
}

const productImages = createImageUploader("products");
export const uploadProductImage = productImages.uploadImage;
export const deleteProductImageFile = productImages.deleteImageFile;

const newsImages = createImageUploader("news");
export const uploadNewsImage = newsImages.uploadImage;
export const deleteNewsImageFile = newsImages.deleteImageFile;

const categoryImages = createImageUploader("categories");
export const uploadCategoryImage = categoryImages.uploadImage;
export const deleteCategoryImageFile = categoryImages.deleteImageFile;
