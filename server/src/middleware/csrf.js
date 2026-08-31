import crypto from "node:crypto";

// CSRF-защита на сессионном токене в скрытом поле `_csrf`. Для multipart-форм
// req.body пуст до multer — там verifyCsrfToken() вызывается в роуте вручную
// после загрузки файла, а не через requireCsrf.
export function csrfMiddleware(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function verifyCsrfToken(req) {
  const token = req.body && req.body._csrf;
  return typeof token === "string" && token.length > 0 && token === req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  if (verifyCsrfToken(req)) return next();
  res.status(403).send("Форма устарела или недействительна. Вернитесь назад, обновите страницу и попробуйте снова.");
}
