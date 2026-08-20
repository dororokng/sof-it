function renderCatalog(filter) {
  const grid = document.getElementById("catalogGrid");
  const list = filter === "all" ? products : products.filter((p) => p.cat === filter);
  grid.innerHTML = list.map(productCardHTML).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderCatalog("all");
  document.getElementById("catTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-tab");
    if (!btn) return;
    document.querySelectorAll(".cat-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderCatalog(btn.dataset.cat);
  });
});