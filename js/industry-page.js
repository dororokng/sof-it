// /pages/otrasl.html?slug=... — контент из статического массива industries
// (js/solutions-data.js).

const industryPage = (() => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  return industries.find((x) => x.slug === slug);
})();

if (!industryPage) {
  document.querySelector("main").innerHTML = "<div class='wrap empty-state'>Отрасль не найдена.</div>";
} else {
  const ind = industryPage;

  document.title = `Софит — 1С для отрасли «${ind.name}»`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", ind.offer);

  document.getElementById("indBreadcrumbName").textContent = ind.name;
  document.getElementById("indName").textContent = ind.name;
  document.getElementById("indOffer").textContent = ind.offer;
  document.getElementById("indCtaTitle").textContent = `Готовы обсудить автоматизацию для отрасли «${ind.name}»?`;

  // Реальное фото вместо общей SVG-схемы «проблема → решение → результат» —
  // только у отраслей с заданным ind.schemeImage (пока только «Производство»).
  if (ind.schemeImage) {
    document.getElementById("indSchemeWrap").innerHTML = `<div class="media-frame media-frame--wide media-frame--raw media-frame--flush">
      <img src="${escapeAttr(ind.schemeImage)}" alt="${escapeAttr(ind.name)}" loading="lazy" />
    </div>`;
  }

  // Число пунктов «когда нужна 1С» разное по отраслям (4 или 5) — решётка
  // .adv-grid по умолчанию 4-колоночная, для 5 пунктов без модификатора
  // осталась бы пустая ячейка (см. фикс «пустых квадратов» в CLAUDE.md).
  const problemsGrid = document.getElementById("indProblemsGrid");
  problemsGrid.className = ind.problems.length === 5 ? "adv-grid adv-grid--3col adv-grid--fill-last" : "adv-grid";
  problemsGrid.innerHTML = ind.problems
    .map((p) => `<div class="list-card"><h4>${escapeHtml(p)}</h4></div>`)
    .join("");

  document.getElementById("indSpecificsGrid").innerHTML = ind.specifics
    .map((s, i) => `<div class="list-card"><span class="n">${String(i + 1).padStart(2, "0")}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.desc)}</p></div>`)
    .join("");

  const solutions = onecPrograms.filter((p) => ind.solutionSlugs.includes(p.slug));
  const solutionsGrid = document.getElementById("indSolutionsGrid");
  if (solutions.length) {
    solutionsGrid.innerHTML = solutions.map(programCardHTML).join("");
  } else {
    solutionsGrid.outerHTML = `<div class="placeholder-note">
      Подбираем конкретные решения 1С под эту отрасль — опишите свою
      задачу, и команда предложит подходящую конфигурацию.
    </div>`;
  }

  document.getElementById("indEffectsGrid").innerHTML = ind.effects
    .map((e) => `<div class="effect-item"><span class="effect-val">${escapeHtml(e.val)}</span><span class="effect-label">${escapeHtml(e.label)}</span></div>`)
    .join("");
}
