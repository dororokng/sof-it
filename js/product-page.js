document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  const p = products.find((x) => x.id === id);

  if (!p) {
    document.querySelector("main").innerHTML =
      "<div class='wrap' style='padding:80px 0'>Товар не найден.</div>";
    return;
  }

  document.getElementById("pdBreadcrumbName").textContent = p.name;
  document.getElementById("pdCat").textContent = p.catLabel;
  document.getElementById("pdName").textContent = p.name;
  document.getElementById("pdDesc").textContent = p.desc;
  document.getElementById("pdSvg").innerHTML = svgFor(p.cat);
  document.getElementById("pdSpecs").innerHTML = p.specs
    .map((s) => `<tr><td>${s[0]}</td><td>${s[1]}</td></tr>`)
    .join("");
  document.getElementById("pdTags").innerHTML =
    `<span>${p.catLabel}</span><span>Производитель: ${p.manufacturer}</span>`;
});