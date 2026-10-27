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

  // «Партия до/после» + «Журнал смены» (IndustryProof) отрисовывается
  // инлайн-скриптом прямо в pages/otrasl.html, сразу у #indProofWrap —
  // не здесь (аудит, шаг 3в, см. комментарий в otrasl.html про CLS).

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
    .map((e) => `<div class="effect-item"><div class="stat-figure"><span class="v v--accent">${escapeHtml(e.val)}</span><span class="cap">${escapeHtml(e.label)}</span></div></div>`)
    .join("");
}
