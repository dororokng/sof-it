// Единый шаблон для всех отраслей: /pages/otrasl.html?slug=... — контент
// подставляется из статического массива industries (js/solutions-data.js).
// Добавить новую отрасль — значит дописать один объект в этот массив, а не
// сверстать ещё одну HTML-страницу.

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

  document.getElementById("indProblemsGrid").innerHTML = ind.problems
    .map((p) => `<div class="adv-card"><h4>${escapeHtml(p)}</h4></div>`)
    .join("");

  document.getElementById("indSpecificsGrid").innerHTML = ind.specifics
    .map((s, i) => `<div class="principle-card"><span class="n">${String(i + 1).padStart(2, "0")}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.desc)}</p></div>`)
    .join("");

  const solutions = onecPrograms.filter((p) => ind.solutionSlugs.includes(p.slug));
  document.getElementById("indSolutionsGrid").innerHTML = solutions.map(programCardHTML).join("");

  document.getElementById("indEffectsGrid").innerHTML = ind.effects
    .map((e) => `<div class="effect-item"><span class="effect-val">${escapeHtml(e.val)}</span><span class="effect-label">${escapeHtml(e.label)}</span></div>`)
    .join("");
}
