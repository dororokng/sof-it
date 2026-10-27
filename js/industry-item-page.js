// /otrasli/:group/:item (чистый URL) или /pages/otrasl-item.html?slug=... —
// конкретное направление внутри категории отраслевых решений
// (industryCategories[].items в js/solutions-data.js). Полная структура
// страницы (вводный текст → «Проблема → Решение → Результат» → «Когда нужна
// автоматизация» → «Специфика процессов отрасли» → «Подобранные решения» →
// блок призыва) — см. комментарий над industryCategories в solutions-data.js
// про опциональные поля item. Секции без данных убираются целиком (кроме
// «Подобранные решения» — там честный плейсхолдер, как на странице
// категории), а не остаются пустыми решётками.

const industryItemPage = (() => {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const otrasliAt = pathParts.indexOf("otrasli");
  let groupSlug = null;
  let itemSlug;
  if (otrasliAt !== -1 && pathParts.length >= otrasliAt + 3) {
    groupSlug = pathParts[otrasliAt + 1];
    itemSlug = pathParts[otrasliAt + 2];
  } else {
    itemSlug = new URLSearchParams(window.location.search).get("slug");
  }
  for (const cat of industryCategories) {
    if (groupSlug && cat.slug !== groupSlug) continue;
    const item = cat.items.find((x) => x.slug === itemSlug);
    if (item) return { item, category: cat };
  }
  return null;
})();

if (!industryItemPage) {
  document.querySelector("main").innerHTML = "<div class='wrap empty-state'>Направление не найдено.</div>";
} else {
  const { item, category } = industryItemPage;

  document.title = item.seoTitle || `Софит — 1С для направления «${item.name}»`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", item.seoDescription || item.desc || "");

  const catLink = document.getElementById("itemBreadcrumbCategory");
  catLink.textContent = category.name;
  catLink.href = `/sof-it/otrasli/${category.slug}`;

  document.getElementById("itemBreadcrumbName").textContent = item.name;
  document.getElementById("itemName").textContent = item.h1 || item.name;
  document.getElementById("itemOffer").innerHTML = item.desc ? highlightLatin(item.desc) : "";
  document.getElementById("itemCtaTitle").textContent = item.ctaTitle || `Готовы обсудить автоматизацию для направления «${item.name}»?`;
  document.getElementById("itemCtaText").textContent = item.ctaText || "Опишите текущую ситуацию — предложим решение под задачи вашего производства.";

  if (item.problem && item.solution && item.result) {
    document.getElementById("itemPsrGrid").innerHTML = `
      <div class="list-card"><span class="n">Проблема</span><h4>${escapeHtml(item.problem)}</h4></div>
      <div class="list-card"><span class="n">Решение 1С</span><h4>${escapeHtml(item.solution)}</h4></div>
      <div class="list-card"><span class="n">Результат</span><h4>${escapeHtml(item.result)}</h4></div>
    `;
  } else {
    document.getElementById("itemPsrWrap").closest("section").remove();
  }

  if (item.problems && item.problems.length) {
    const problemsGrid = document.getElementById("itemProblemsGrid");
    problemsGrid.className = item.problems.length === 5 ? "adv-grid adv-grid--3col adv-grid--fill-last" : "adv-grid";
    problemsGrid.innerHTML = item.problems.map((p) => `<div class="list-card"><h4>${escapeHtml(p)}</h4></div>`).join("");
  } else {
    document.getElementById("itemProblemsWrap").closest("section").remove();
  }

  // «Партия до/после» + «Журнал смены» (industry-proof.js) — для всех
  // направлений, у которых есть запись в industriesProof (сейчас это все
  // заведённые направления категорий, кроме «Полиграфии и упаковки» — там
  // пока нет самих items). Одно исключение: эталон «Пищевые продукты» —
  // slug направления (pishchevye-produkty) не совпадает со slug в
  // industries.ts (pishchevoe-proizvodstvo, имя пришло из макета), поэтому
  // для него связь — явная карта, а не совпадение по slug.
  const PROOF_ITEM_SLUGS = { "pishchevye-produkty": "pishchevoe-proizvodstvo" };
  const proofWrap = document.getElementById("itemProofWrap");
  const proofSlug = PROOF_ITEM_SLUGS[item.slug] || item.slug;
  const proof = industriesProof.find((x) => x.slug === proofSlug);
  if (proof) {
    document.getElementById("itemPsrWrap")?.closest("section").remove();
    document.getElementById("itemProblemsWrap")?.closest("section").remove();
    proofWrap.innerHTML = industryProofHTML(proof);
    initIndustryProof(proofWrap, proof);
  } else {
    proofWrap.closest("section").remove();
  }

  if (item.specifics && item.specifics.length) {
    document.getElementById("itemSpecificsGrid").innerHTML = item.specifics
      .map((s, i) => `<div class="list-card"><span class="n">${String(i + 1).padStart(2, "0")}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.desc)}</p></div>`)
      .join("");
  } else {
    document.getElementById("itemSpecificsWrap").closest("section").remove();
  }

  const solutions = onecPrograms.filter((p) => (item.solutionSlugs || []).includes(p.slug));
  const solutionsGrid = document.getElementById("itemSolutionsGrid");
  if (solutions.length) {
    solutionsGrid.innerHTML = solutions.map(programCardHTML).join("");
  } else {
    solutionsGrid.outerHTML = `<div class="placeholder-note">
      Подбираем конкретные решения 1С под это направление — опишите свою
      задачу, и команда предложит подходящую конфигурацию.
    </div>`;
  }
}
