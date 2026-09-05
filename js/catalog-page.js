function renderCatalog(filter) {
  const grid = document.getElementById("catalogGrid");
  const list = filter === "all" ? products : products.filter((p) => p.cat === filter);
  grid.innerHTML = list.map(productCardHTML).join("");
}

function renderCatTabs() {
  const tabsHTML = [`<button class="cat-tab active" data-cat="all">Все категории</button>`].concat(
    categories.map((c) => `<button class="cat-tab" data-cat="${escapeAttr(c.slug)}">${escapeHtml(c.name)}</button>`)
  );
  document.getElementById("catTabs").innerHTML = tabsHTML.join("");
}

document.addEventListener("data:ready", () => {
  renderCatTabs();
  renderCatalog("all");
  document.getElementById("catTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-tab");
    if (!btn) return;
    document.querySelectorAll(".cat-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderCatalog(btn.dataset.cat);
  });
});
