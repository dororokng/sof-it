// /pages/otrasl-kategoriya.html?slug=... — контент из статического массива
// industryCategories (js/solutions-data.js).

const industryCategoryPage = (() => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  return industryCategories.find((x) => x.slug === slug);
})();

if (!industryCategoryPage) {
  document.querySelector("main").innerHTML = "<div class='wrap empty-state'>Категория не найдена.</div>";
} else {
  const cat = industryCategoryPage;

  document.title = `Софит — 1С для направления «${cat.name}»`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", cat.offer);

  document.getElementById("catBreadcrumbName").textContent = cat.name;
  document.getElementById("catName").textContent = cat.name;
  document.getElementById("catOffer").innerHTML = highlightLatin(cat.offer);

  const itemsGrid = document.getElementById("catItemsGrid");
  if (cat.items.length) {
    itemsGrid.innerHTML = cat.items.map(industryCategoryItemCardHTML).join("");
  } else {
    itemsGrid.outerHTML = `<div class="placeholder-note">
      Конкретные направления внутри этой категории пока уточняются.
      Опишите свою специфику — команда подберёт решение под ваше
      производство уже сейчас.
    </div>`;
  }
}
