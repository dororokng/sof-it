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

// ---------- Отрасли / решения 1С / тарифы / кейсы ----------
// Данные для этих карточек — статический js/solutions-data.js (не БД), см.
// комментарий в начале этого файла. escapeHtml/highlightLatin здесь не
// обязательны по соображениям безопасности (контент не редактируется через
// админку), но используются для единообразия с остальными карточками сайта.
//
// Фаза 3 редизайна «убрать шаблонность»: все витринные карточки сведены к
// одному компоненту .service-card (Card A). Прежние .program-card /
// .industry-card / .solution-row / .svc-card удалены. Единственный
// самостоятельный вариант — .industry-media-card (та же карточка + рамка
// под фоновое фото), используется только на главной.

function industryCardHTML(ind) {
  return `<a class="service-card" href="/pages/otrasl.html?slug=${ind.slug}">
    <h4>${escapeHtml(ind.name)}</h4>
    <p>${escapeHtml(ind.offer)}</p>
    <span class="more">Решения для отрасли →</span>
  </a>`;
}

function programCardHTML(p) {
  return `<a class="service-card" href="/pages/programma.html?slug=${p.slug}">
    <h4>${highlightLatin(p.name)}</h4>
    <p>${escapeHtml(p.shortDesc)}</p>
    <span class="more">Подробнее →</span>
  </a>`;
}

// Карточка отрасли с рамкой под фоновое изображение — используется только на
// главной (блок «Отраслевые решения»). Если у отрасли задан ind.image —
// внутрь .media-frame кладётся <img>; модификатор .media-frame--raw отключает
// синий дуотон-фильтр (.media-frame img в style.css) — фото показывается в
// естественном цвете (решение заказчика). Иначе показывается подпись-хинт из
// data-hint. Для /pages/otrasli.html используется industryCardHTML выше
// (обычная .service-card без фото).
function industryMediaCardHTML(ind) {
  const frame = ind.image
    ? `<div class="media-frame media-frame--card media-frame--raw"><img src="${escapeAttr(ind.image)}" alt="${escapeAttr(ind.name)}" loading="lazy" /></div>`
    : `<div class="media-frame media-frame--card" data-hint="Фото: ${escapeAttr(ind.name)}"></div>`;
  return `<a class="industry-media-card" href="/pages/otrasl.html?slug=${ind.slug}">
    ${frame}
    <div class="industry-media-body">
      <h4>${escapeHtml(ind.name)}</h4>
      <p>${escapeHtml(ind.offer)}</p>
      <span class="more">Решения для отрасли →</span>
    </div>
  </a>`;
}

function tariffCardHTML(t) {
  // Слот бейджа рендерится всегда (в невыделенных карточках он скрыт через
  // visibility в CSS) — так у всех трёх карточек одинаковая высота шапки и
  // заголовок/цена/кнопка выстраиваются в одну линию.
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

// Кейс всегда помечен как демонстрационный пример прямо на карточке — не
// только текстом-предупреждением где-то рядом на странице (страницы могут
// добавлять/не добавлять свой .placeholder-note, а карточка одна и та же
// используется в 4 разных местах сайта: главная, /pages/keysy.html,
// карточка программы, карточка отрасли). Метка на самой карточке
// гарантирует, что кейс нигде не будет выглядеть как подтверждённый
// реальный результат компании, даже если конкретную страницу забудут
// снабдить отдельным .placeholder-note.
function caseCardHTML(c) {
  // Обратные ссылки "кейс → отрасль / решение": данные о них хранятся в
  // обратную сторону (industries[].caseSlugs, c.programs — массив названий
  // программ), поэтому здесь приходится искать по ним, а не по прямому полю
  // на самом кейсе. industries/onecPrograms — глобальные массивы из
  // js/solutions-data.js, которые везде подключены раньше этого файла.
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