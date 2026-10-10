// Экранирование только < и > — амперсанд не трогаем, иначе ломается
// highlightLatin (пары вида "Pick&Place").
function escapeHtml(str) {
  return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Латинские слова (бренды/модели) внутри русского текста оборачиваем в
// .latin-inline, чтобы они не выделялись на фоне кириллицы. Строка сперва
// экранируется, поэтому обёртка в тег безопасна.
function highlightLatin(str) {
  return escapeHtml(str).replace(/([A-Za-z][A-Za-z0-9&/+.\-]*)/g, '<span class="latin-inline">$1</span>');
}

// Для значений внутри атрибутов кавычки и амперсанд экранируем тоже.
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

// Карточки отраслей / решений 1С / тарифов / кейсов. Данные — статический
// js/solutions-data.js, не БД; escapeHtml здесь для единообразия.

function industryCardHTML(ind) {
  return `<a class="service-card" href="/pages/otrasl.html?slug=${ind.slug}">
    <h4>${escapeHtml(ind.name)}</h4>
    <p>${escapeHtml(ind.offer)}</p>
    <span class="more">Решения для отрасли →</span>
  </a>`;
}

function industryCategoryCardHTML(cat) {
  return `<a class="service-card" href="/otrasli/${cat.slug}">
    <h4>${escapeHtml(cat.name)}</h4>
    <p>${highlightLatin(cat.offer)}</p>
    <span class="more">Выбрать направление →</span>
  </a>`;
}

// categorySlug нужен для сборки вложенного чистого URL /otrasli/:group/:item —
// у самого item только собственный слаг, группа известна только вызывающей
// стороне (industry-category-page.js).
function industryCategoryItemCardHTML(item, categorySlug) {
  return `<a class="service-card" href="/otrasli/${categorySlug}/${item.slug}">
    <h4>${escapeHtml(item.name)}</h4>
    ${item.desc ? `<p>${highlightLatin(item.desc)}</p>` : ""}
    <span class="more">${escapeHtml(item.moreLabel || "Подробнее →")}</span>
  </a>`;
}

function programCardHTML(p) {
  return `<a class="service-card" href="/pages/programma.html?slug=${p.slug}">
    <h4>${highlightLatin(p.name)}</h4>
    <p>${escapeHtml(p.shortDesc)}</p>
    <span class="more">Подробнее →</span>
  </a>`;
}

// Вариант карточки отрасли с фоновым фото — только на главной. Текст лежит
// прямо на фото: затемняющий градиент + лёгкий backdrop-blur под текстом
// (см. .industry-media-overlay в style.css), чтобы подпись оставалась
// читаемой на любом снимке. media-frame--raw отключает синий дуотон, фото
// показывается в естественном цвете. Без ind.image рендерится подпись-хинт
// из data-hint вместо фото.
function industryMediaCardHTML(ind) {
  const frame = ind.image
    ? `<div class="media-frame media-frame--card media-frame--raw"><img src="${escapeAttr(ind.image)}" alt="${escapeAttr(ind.name)}" loading="lazy" /></div>`
    : `<div class="media-frame media-frame--card" data-hint="Фото: ${escapeAttr(ind.name)}"></div>`;
  return `<a class="industry-media-card" href="/pages/otrasl.html?slug=${ind.slug}">
    ${frame}
    <div class="industry-media-overlay">
      <h4>${escapeHtml(ind.name)}</h4>
      <p>${escapeHtml(ind.offer)}</p>
      <span class="more">Решения для отрасли →</span>
    </div>
  </a>`;
}

// Медиа-карточка категории отраслевых решений — ведёт на хаб категории
// (/otrasli/:group), используется на главной. С cat.image — тот же вид,
// что у industryMediaCardHTML (фото + градиент-оверлей снизу). Без
// cat.image — оформленная тёмная обложка (.media-frame--cover), а не
// дашед-рамка с хинтом: те же пропорции 16:10, что у карточки с фото.
// Как только у категории появится image в js/solutions-data.js — эта
// функция сама переключится на фото-ветку, код трогать не придётся.
function industryCategoryMediaCardHTML(cat) {
  if (cat.image) {
    return `<a class="industry-media-card" href="/otrasli/${cat.slug}">
      <div class="media-frame media-frame--card media-frame--raw"><img src="${escapeAttr(cat.image)}" alt="${escapeAttr(cat.name)}" loading="lazy" /></div>
      <div class="industry-media-overlay">
        <h4>${escapeHtml(cat.name)}</h4>
        <p>${highlightLatin(cat.offer)}</p>
        <span class="more">Выбрать направление →</span>
      </div>
    </a>`;
  }
  return `<a class="industry-media-card" href="/otrasli/${cat.slug}">
    <div class="media-frame media-frame--card media-frame--cover">
      <span class="media-frame-cover-label">Направление</span>
      <h4 class="media-frame-cover-name">${escapeHtml(cat.name)}</h4>
      <p class="media-frame-cover-offer">${highlightLatin(cat.offer)}</p>
      <span class="media-frame-cover-more">Выбрать направление →</span>
    </div>
  </a>`;
}

function tariffCardHTML(t) {
  // Слот бейджа рендерится всегда (в невыделенных карточках скрыт через CSS) —
  // так у всех карточек одинаковая высота шапки.
  return `<div class="tariff-card${t.highlighted ? " highlighted" : ""}">
    <span class="tariff-badge">${t.highlighted ? "Популярный выбор" : ""}</span>
    <h4>${escapeHtml(t.name)}</h4>
    <div class="tariff-term">${escapeHtml(t.term)}</div>
    <div class="tariff-price">${escapeHtml(t.priceFrom)}</div>
    <ul class="tariff-features">
      ${t.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
    </ul>
    <a href="/pages/contacts.html" class="btn btn-primary">Заказать пакет</a>
  </div>`;
}

// Кейс всегда помечен как демонстрационный прямо на карточке — она одна и та
// же на 4 поверхностях сайта, отдельный .placeholder-note рядом может быть не
// на каждой странице.
function caseCardHTML(c) {
  // Обратные связи "кейс → отрасль / решение": хранятся на стороне отрасли
  // (industries[].caseSlugs) и как список названий программ (c.programs),
  // поэтому ищем по ним. industries/onecPrograms — глобальные из solutions-data.js.
  const relatedIndustries = typeof industries !== "undefined" ? industries.filter((ind) => (ind.caseSlugs || []).includes(c.slug)) : [];
  const relatedPrograms = typeof onecPrograms !== "undefined" ? onecPrograms.filter((p) => (c.programs || []).includes(p.name)) : [];
  const links = [
    ...relatedIndustries.map((ind) => `<a class="link-chip" href="/pages/otrasl.html?slug=${ind.slug}">${escapeHtml(ind.name)}</a>`),
    ...relatedPrograms.map((p) => `<a class="link-chip" href="/pages/programma.html?slug=${p.slug}">${highlightLatin(p.name)}</a>`),
  ].join("");

  return `<div class="case-card">
    <span class="case-demo-badge">Демонстрационный пример</span>
    <span class="case-industry">${escapeHtml(c.industry)}</span>
    <h4>${escapeHtml(c.title)}</h4>
    <p>${highlightLatin(c.summary)}</p>
    <div class="case-metrics">
      ${c.metrics.map((m) => `<div><span class="case-metric-val">${escapeHtml(m.val)}</span><span class="case-metric-label">${escapeHtml(m.label)}</span></div>`).join("")}
    </div>
    ${links ? `<div class="link-row case-links">${links}</div>` : ""}
  </div>`;
}
