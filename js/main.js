// Логика, зависящая от шапки/футера — ждём, пока include.js их подгрузит
document.addEventListener("layout:ready", () => {
  const header = document.getElementById("siteHeader");
  const burgerBtn = document.getElementById("burgerBtn");
  const closeBurger = document.getElementById("closeBurger");
  const mobileNav = document.getElementById("mobileNav");

  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  // Только пункты верхнего уровня — ссылки внутри .nav-dropdown ведут на
  // разные #якоря одной и той же страницы (например, все пять подпунктов
  // "Услуги 1С" указывают на it.html), и раньше при сравнении по одному
  // pathname все они одновременно помечались активными и подчёркивались.
  document.querySelectorAll("nav.main-nav a").forEach((link) => {
    if (link.closest(".nav-dropdown")) return;
    const linkPath = new URL(link.href).pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
    if (linkPath === currentPath) link.classList.add("active");
  });

  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("compact", window.scrollY > 40);
    });
  }
  if (burgerBtn && mobileNav) {
    burgerBtn.addEventListener("click", () => mobileNav.classList.add("open"));
  }
  if (closeBurger && mobileNav) {
    closeBurger.addEventListener("click", () => mobileNav.classList.remove("open"));
  }
});

// Reveal-анимация секций при скролле — не зависит от шапки/футера
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add("in");
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll("section").forEach((s) => {
  s.classList.add("reveal");
  io.observe(s);
});