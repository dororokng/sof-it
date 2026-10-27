async function includePartial(id, path) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(path);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error("Не удалось загрузить " + path, err);
  }
}

async function loadLayout() {
  await Promise.all([
    includePartial("header", "/sof-it/partials/header.html"),
    includePartial("footer", "/sof-it/partials/footer.html"),
  ]);
  document.dispatchEvent(new Event("layout:ready"));
}

loadLayout();