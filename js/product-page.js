document.addEventListener("data:ready", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  const p = products.find((x) => x.id === id);

  if (!p) {
    document.querySelector("main").innerHTML =
      "<div class='wrap empty-state'>Товар не найден.</div>";
    return;
  }

  document.title = `Софит — ${p.name}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", p.desc.slice(0, 160));

  document.getElementById("pdBreadcrumbName").textContent = p.name;
  document.getElementById("pdName").textContent = p.name;
  // innerHTML + highlightLatin: переносы строк держит white-space:pre-line в CSS.
  document.getElementById("pdDesc").innerHTML = highlightLatin(p.desc);
  if (p.image) {
    document.getElementById("pdImage").src = p.image;
    document.querySelector(".pd-thumb").classList.add("has-photo");
  }
  document.getElementById("pdSpecs").innerHTML = p.specs
    .map((s) => `<tr><td>${escapeHtml(s[0])}</td><td>${highlightLatin(s[1])}</td></tr>`)
    .join("");
  document.getElementById("pdTags").innerHTML =
    `<span>${escapeHtml(p.catLabel)}</span><span>Производитель: ${escapeHtml(p.manufacturer)}</span>`;

  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3);
  document.getElementById("pdRelatedGrid").innerHTML = related.map(productCardHTML).join("");
});