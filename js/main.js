// Логика, зависящая от шапки/футера — ждём, пока include.js их подгрузит.
document.addEventListener("layout:ready", () => {
  const header = document.getElementById("siteHeader");
  const burgerBtn = document.getElementById("burgerBtn");
  const closeBurger = document.getElementById("closeBurger");
  const mobileNav = document.getElementById("mobileNav");

  // Активный пункт меню — только верхний уровень: ссылки внутри .nav-dropdown
  // ведут на #якоря одной страницы и все помечались бы активными.
  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
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
