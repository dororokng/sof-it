// Раньше здесь лежали жёстко прописанные массивы products/news.
// Теперь данные приходят из БД через API (см. server/src/routes/publicApi.js),
// а этот файл только загружает их и раскладывает в те же глобальные переменные,
// чтобы остальной код (render.js, catalog-page.js и т.д.) не пришлось менять.
let products = [];
let news = [];
let categories = [];
let services = [];
let settings = {};

async function loadData() {
  try {
    const [productsRes, newsRes, categoriesRes, servicesRes, settingsRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/news"),
      fetch("/api/categories"),
      fetch("/api/services"),
      fetch("/api/settings"),
    ]);
    products = await productsRes.json();
    news = await newsRes.json();
    categories = await categoriesRes.json();
    services = await servicesRes.json();
    settings = await settingsRes.json();
  } catch (err) {
    console.error("Не удалось загрузить данные из API", err);
  }
  document.dispatchEvent(new Event("data:ready"));
}

loadData();
