// Экранирует только опасные для HTML символы (< и >) — этого достаточно,
// чтобы значения из БД, вставляемые через innerHTML, не могли создать
// настоящий тег/скрипт. Амперсанд (&) намеренно не трогаем — иначе ломается
// подстановка ниже (пары вида "Pick&Place").
function escapeHtml(str) {
  return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Латинские названия брендов/моделей (MOTOMAN, GP4, IP67, Yaskawa) внутри
// русского текста визуально "кричат" на фоне кириллицы. Оборачиваем такие
// куски в <span class="latin-inline"> — CSS (см. style.css) слегка
// приглушает их размер и цвет, чтобы они читались как часть текста, а не
// выделялись. Строка сперва экранируется (см. выше), поэтому оборачивание
// в HTML-тег безопасно даже для текста, введённого через админку.
function highlightLatin(str) {
  return escapeHtml(str).replace(/([A-Za-z][A-Za-z0-9&/+.\-]*)/g, '<span class="latin-inline">$1</span>');
}

// Для значений внутри HTML-атрибутов (alt="...") кавычки экранировать нужно
// обязательно — иначе можно вырваться из атрибута; здесь это не мешает
// подстановке highlightLatin, поэтому амперсанд экранируем тоже, как обычно.
function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function productThumbHTML(p) {
  if (p.image) {
    return `<img src="${p.image}" alt="${escapeAttr(p.name)}" loading="lazy" />`;
  }
  return `<div class="thumb-fallback">Фото не загружено</div>`;
}

function productCardHTML(p) {
  return `<div class="product-card">
    <div class="product-thumb">${productThumbHTML(p)}</div>
    <div class="product-body">
      <span class="product-cat">${escapeHtml(p.catLabel)}</span>
      <h4>${escapeHtml(p.name)}</h4>
      <p>${highlightLatin(p.desc)}</p>
      <div class="product-actions">
        <a href="/pages/product.html?id=${p.id}" class="btn btn-outline">Подробнее</a>
        <a href="/pages/contacts.html" class="btn btn-primary">Консультация</a>
      </div>
    </div>
  </div>`;
}

function serviceCardHTML(s) {
  return `<div class="service-card">
    <h4>${escapeHtml(s.name)}</h4>
    <p>${highlightLatin(s.shortDescription)}</p>
  </div>`;
}

function newsThumbHTML(n) {
  if (n.image) {
    return `<img src="${n.image}" alt="${escapeAttr(n.title)}" loading="lazy" />`;
  }
  return `<div class="grid-overlay"></div>`;
}

function newsCardHTML(n) {
  return `<a class="news-card" href="/pages/news-detail.html?id=${n.id}">
    <div class="news-thumb">${newsThumbHTML(n)}</div>
    <span class="news-date">${escapeHtml(n.date)}</span>
    <h4>${escapeHtml(n.title)}</h4>
    <p>${highlightLatin(n.excerpt)}</p>
    <span class="news-more">Подробнее →</span>
  </a>`;
}