// Загружает витринные данные из публичного API в глобальные переменные и
// кидает событие data:ready. Ошибка сети не роняет страницу — переменные
// остаются пустыми.
let products = [];
let news = [];
let categories = [];
let settings = {};

async function loadData() {
  try {
    const [productsRes, newsRes, categoriesRes, settingsRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/news"),
      fetch("/api/categories"),
      fetch("/api/settings"),
    ]);
    products = await productsRes.json();
    news = await newsRes.json();
    categories = await categoriesRes.json();
    settings = await settingsRes.json();
  } catch (err) {
    console.error("Не удалось загрузить данные из API", err);
  }
  document.dispatchEvent(new Event("data:ready"));
}

loadData();
