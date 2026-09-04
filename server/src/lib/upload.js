import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.resolve(__dirname, "../../uploads");

// Расширение сохраняемого файла берём из проверенного MIME-типа, а не из
// имени файла клиента (иначе можно подсунуть x.html с Content-Type image/jpeg).
const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

// Оборачиваем multer в промис, чтобы роут сам обрабатывал ошибку загрузки.
function createImageUploader(subfolder) {
  const dir = path.join(uploadsRoot, subfolder);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => {
      const ext = ALLOWED_TYPES.get(file.mimetype) || ".bin";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  const multerUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 МБ
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_TYPES.has(file.mimetype)) {
        return cb(new Error("Разрешены только изображения: JPG, PNG, WEBP или GIF."));
      }
      cb(null, true);
    },
  }).single("image");

  function uploadImage(req, res) {
    return new Promise((resolve, reject) => {
      multerUpload(req, res, (err) => (err ? reject(err) : resolve()));
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
