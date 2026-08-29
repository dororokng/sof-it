// Карточка программы 1С: /pages/programma.html?slug=... — контент из
// статического массива onecPrograms (js/solutions-data.js).

const programPage = (() => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  return onecPrograms.find((x) => x.slug === slug);
})();

if (!programPage) {
  document.querySelector("main").innerHTML = "<div class='wrap empty-state'>Программа не найдена.</div>";
} else {
  const p = programPage;

  document.title = `Софит — ${p.name}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", p.shortDesc);

  document.getElementById("progBreadcrumbName").textContent = p.name;
  document.getElementById("progName").textContent = p.name;
  document.getElementById("progShortDesc").textContent = p.shortDesc;
  document.getElementById("progDesc").textContent = p.description;

  document.getElementById("progFeaturesGrid").innerHTML = p.features
    .map((f) => `<div class="list-card"><h4>${escapeHtml(f)}</h4></div>`)
    .join("");

  const relatedIndustries = industries.filter((ind) => p.industries.includes(ind.slug));
  document.getElementById("progIndustriesGrid").innerHTML = relatedIndustries
    .map((ind, i) => industryCardHTML(ind, i))
    .join("");
}
