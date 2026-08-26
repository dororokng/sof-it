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

// ---------- Отрасли / программы 1С / тарифы / кейсы ----------
// Данные для этих карточек — статический js/solutions-data.js (не БД), см.
// комментарий в начале этого файла. escapeHtml/highlightLatin здесь не
// обязательны по соображениям безопасности (контент не редактируется через
// админку), но используются для единообразия с остальными карточками сайта.

function industryCardHTML(ind, i) {
  return `<a class="industry-card" href="/pages/otrasl.html?slug=${ind.slug}">
    <span class="n">${String(i + 1).padStart(2, "0")}</span>
    <h4>${escapeHtml(ind.name)}</h4>
    <p>${escapeHtml(ind.offer)}</p>
    <span class="more">Решения для отрасли →</span>
  </a>`;
}

function programCardHTML(p) {
  return `<a class="program-card" href="/pages/programma.html?slug=${p.slug}">
    <h4>${highlightLatin(p.name)}</h4>
    <p>${escapeHtml(p.shortDesc)}</p>
    <span class="more">Подробнее →</span>
  </a>`;
}

function tariffCardHTML(t) {
  return `<div class="tariff-card${t.highlighted ? " highlighted" : ""}">
    ${t.highlighted ? '<span class="tariff-badge">Популярный выбор</span>' : ""}
    <h4>${escapeHtml(t.name)}</h4>
    <div class="tariff-term">${escapeHtml(t.term)}</div>
    <div class="tariff-price">${escapeHtml(t.priceFrom)}</div>
    <ul class="tariff-features">
      ${t.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
    </ul>
    <a href="/pages/contacts.html" class="btn btn-primary">Заказать пакет</a>
  </div>`;
}

function caseCardHTML(c) {
  return `<div class="case-card">
    <span class="case-industry">${escapeHtml(c.industry)}</span>
    <h4>${escapeHtml(c.title)}</h4>
    <p>${highlightLatin(c.summary)}</p>
    <div class="case-metrics">
      ${c.metrics.map((m) => `<div><span class="case-metric-val">${escapeHtml(m.val)}</span><span class="case-metric-label">${escapeHtml(m.label)}</span></div>`).join("")}
    </div>
  </div>`;
}

function solutionTileHTML(tile) {
  return `<a class="solution-tile" href="${tile.href}">
    <span class="tile-cat">${escapeHtml(tile.cat)}</span>
    <h5>${escapeHtml(tile.name)}</h5>
  </a>`;
}