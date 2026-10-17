// Вынесено из инлайн-скрипта в <head> каждой страницы (аудит, CSP без
// 'unsafe-inline' блокирует инлайн-скрипты). Должен грузиться первым в
// <head>, без defer/async — ставит класс до покраски страницы, чтобы
// html.js-reveal .reveal (см. css/style.css) не мигнул видимым контентом
// перед тем как спрятать его для анимации появления.
document.documentElement.classList.add("js-reveal");
