// /pages/otrasl-item.html?slug=... — конкретное направление внутри категории
// отраслевых решений (industryCategories[].items в js/solutions-data.js).

const industryItemPage = (() => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  for (const cat of industryCategories) {
    const item = cat.items.find((x) => x.slug === slug);
    if (item) return { item, category: cat };
  }
  return null;
})();

if (!industryItemPage) {
  document.querySelector("main").innerHTML = "<div class='wrap empty-state'>Направление не найдено.</div>";
} else {
  const { item, category } = industryItemPage;

  document.title = `Софит — 1С для направления «${item.name}»`;

  const catLink = document.getElementById("itemBreadcrumbCategory");
  catLink.textContent = category.name;
  catLink.href = `/pages/otrasl-kategoriya.html?slug=${category.slug}`;

  document.getElementById("itemBreadcrumbName").textContent = item.name;
  document.getElementById("itemName").textContent = item.name;
  document.getElementById("itemCtaTitle").textContent = `Готовы обсудить автоматизацию для направления «${item.name}»?`;

  document.getElementById("itemContent").innerHTML = item.desc
    ? `<p class="lead">${highlightLatin(item.desc)}</p>`
    : `<div class="placeholder-note">
        Подробное описание задач и подобранных решений 1С для этого
        направления пока готовится. Опишите свою ситуацию — команда
        подберёт решение под вашу специфику индивидуально.
      </div>`;
}
