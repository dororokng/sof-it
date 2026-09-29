// /otrasli/:group (чистый URL) или /pages/otrasl-kategoriya.html?slug=... —
// контент из статического массива industryCategories (js/solutions-data.js).
// Слаг группы берётся из пути, если страница открыта через чистый URL
// (см. server/src/index.js), иначе — из query-строки для прямых обращений
// к /pages/otrasl-kategoriya.html.

const industryCategoryPage = (() => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const groupSlug =
    pathParts[0] === "otrasli" && pathParts.length >= 2
      ? pathParts[1]
      : new URLSearchParams(window.location.search).get("slug");
  return industryCategories.find((x) => x.slug === groupSlug);
})();

if (!industryCategoryPage) {
  document.querySelector("main").innerHTML = "<div class='wrap empty-state'>Категория не найдена.</div>";
} else {
  const cat = industryCategoryPage;

  document.title = `Софит — 1С для направления «${cat.name}»`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", cat.offer);

  document.getElementById("catBreadcrumbName").textContent = cat.name;
  document.getElementById("catName").textContent = cat.h1 || cat.name;
  document.getElementById("catOffer").innerHTML = highlightLatin(cat.offer);
  document.getElementById("catCtaTitle").textContent = cat.ctaTitle || "Не нашли своё направление?";
  document.getElementById("catCtaText").textContent = cat.ctaText || "Расскажите о своём бизнесе — подберём решение индивидуально.";

  const itemsGrid = document.getElementById("catItemsGrid");
  if (cat.items.length) {
    itemsGrid.innerHTML = cat.items.map((item) => industryCategoryItemCardHTML(item, cat.slug)).join("");
  } else {
    itemsGrid.outerHTML = `<div class="placeholder-note">
      Конкретные направления внутри этой категории пока уточняются.
      Опишите свою специфику — команда подберёт решение под ваше
      производство уже сейчас.
    </div>`;
  }
}
