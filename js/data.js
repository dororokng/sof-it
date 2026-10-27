// Загружает витринные данные из публичного API в глобальные переменные и
// кидает событие data:ready. Ошибка сети не роняет страницу — переменные
// остаются пустыми.
let products = [];
let news = [];
let categories = [];
let settings = {};
// true, если fetch упал — отличает «каталог реально пуст» от «не
// загрузился» (js/catalog-page.js показывает разные состояния).
let dataLoadFailed = false;

async function loadData() {
  try {
    const [productsRes, newsRes, categoriesRes, settingsRes] = await Promise.all([
      fetch("/sof-it/data/products.json"),
      fetch("/sof-it/data/news.json"),
      fetch("/sof-it/data/categories.json"),
      fetch("/sof-it/data/settings.json"),
    ]);
    products = await productsRes.json();
    news = await newsRes.json();
    categories = await categoriesRes.json();
    settings = await settingsRes.json();
  } catch (err) {
    console.error("Не удалось загрузить данные из API", err);
    dataLoadFailed = true;
  }
  document.dispatchEvent(new Event("data:ready"));
}

loadData();
