// Логика, зависящая от шапки/футера — ждём, пока include.js их подгрузит.
document.addEventListener("layout:ready", () => {
  const header = document.getElementById("siteHeader");
  const burgerBtn = document.getElementById("burgerBtn");
  const closeBurger = document.getElementById("closeBurger");
  const mobileNav = document.getElementById("mobileNav");

  // Активный пункт меню — только верхний уровень: ссылки внутри .nav-dropdown
  // ведут на #якоря одной страницы и все помечались бы активными.
  // «Отрасли» — плоская ссылка (без дропдауна), но ведёт на целое поддерево
  // страниц (хаб /pages/otrasli.html, категории /otrasli/:group, направления
  // /otrasli/:group/:item, старые ?slug=-варианты otrasl*.html) — точное
  // совпадение пути подсвечивало вкладку только на самом хабе, а при переходе
  // в любую конкретную отрасль/категорию/направление подсветка пропадала.
  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  document.querySelectorAll("nav.main-nav a").forEach((link) => {
    if (link.closest(".nav-dropdown")) return;
    const linkPath = new URL(link.href).pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
    const isIndustriesActive =
      linkPath === "/pages/otrasli.html" &&
      (currentPath.startsWith("/otrasli/") || currentPath.startsWith("/pages/otrasl"));
    if (linkPath === currentPath || isIndustriesActive) link.classList.add("active");
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

// Reveal-анимация секций при скролле. threshold:0 + нижний rootMargin (а не
// threshold:0.15): секция длиннее вьюпорта иначе не набрала бы 15% видимости
// и осталась бы с opacity:0.
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) en.target.classList.add("in");
    });
  },
  { threshold: 0, rootMargin: "0px 0px -10% 0px" }
);
document.querySelectorAll("section").forEach((s) => {
  s.classList.add("reveal");
  io.observe(s);
});
