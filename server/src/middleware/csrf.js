import crypto from "node:crypto";

// Простая CSRF-защита на сессионном токене (без сторонних пакетов). Токен
// кладётся в сессию при первом заходе на страницу с формой и должен
// вернуться в скрытом поле `_csrf` при отправке. Для multipart-форм (фото
// товара/новости/категории/услуги) req.body ещё пуст на момент срабатывания
// обычного middleware — там verifyCsrfToken() вызывается вручную в роуте,
// уже после multer, а не через requireCsrf.
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
