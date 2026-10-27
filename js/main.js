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
      linkPath === "/sof-it/pages/otrasli.html" &&
      (currentPath.startsWith("/sof-it/otrasli/") || currentPath.startsWith("/sof-it/pages/otrasl"));
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

// ---------- Reveal-анимация при скролле (Этап 5) ----------
// Один общий IntersectionObserver на весь сайт. threshold:0 + нижний
// rootMargin (а не threshold:0.15): секция длиннее вьюпорта иначе не
// набрала бы 15% видимости и осталась бы с opacity:0.
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
// Решётки, чьи карточки появляются по очереди (а не всей секцией разом).
const REVEAL_GRID_SELECTOR =
  ".card-grid, .adv-grid, .principle-grid, .steps, .trust-grid, .effect-grid, " +
  ".news-grid, .case-grid, .segment-grid, .related-grid, .industry-media-grid, .stats-grid, " +
  ".tariff-grid, .contact-info-grid";
const REVEAL_STEP_MAX = 5; // 6 ступеней (0..5), шаг 40ms — см. CSS .reveal/--reveal-i

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      obs.unobserve(en.target); // страховка «появился один раз» — дальше не трогаем
    });
  },
  { threshold: 0, rootMargin: "0px 0px -10% 0px" }
);

// Элемент уже виден на экране в момент сканирования — это и есть страховки
// «hero/первый экран не анимировать», «открыто по якорю», «вернулись назад
// с восстановленным скроллом»: во всех трёх случаях элемент оказывается уже
// в вьюпорте раньше, чем сработал бы обычный скролл-триггер, и должен быть
// показан сразу в финальном состоянии, а не c опозданием на анимацию.
function isInViewportNow(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

function setupReveal(el, index) {
  if (el.dataset.revealDone) return;
  el.dataset.revealDone = "1";
  if (typeof index === "number") {
    // Класс, не style.setProperty — CSP style-src без 'unsafe-inline'
    // блокирует и программную запись в style, не только атрибут в разметке.
    el.classList.add("reveal-i-" + Math.min(index, REVEAL_STEP_MAX));
  }
  if (REDUCED_MOTION.matches || isInViewportNow(el)) {
    el.classList.add("reveal", "in");
    return;
  }
  el.classList.add("reveal");
  revealObserver.observe(el);
}

// Запускается при загрузке и повторно после data:ready (каталог/новости/
// отрасли дорисовываются в DOM уже после первого прохода) — idempotentно
// за счёт data-reveal-done/data-reveal-grid, уже обработанное не трогается.
function scanReveal() {
  const staggeredGrids = [];
  document.querySelectorAll(REVEAL_GRID_SELECTOR).forEach((grid) => {
    staggeredGrids.push(grid);
    if (grid.dataset.revealGrid) return;
    grid.dataset.revealGrid = "1";
    Array.from(grid.children).forEach((child, i) => setupReveal(child, i));
  });

  // IndustryProof (.proof-card/.proof-journal-wrap) намеренно исключён —
  // у него своя анимация (industry-proof.js), общий reveal её не трогает.
  document.querySelectorAll("main section").forEach((section) => {
    if (section.dataset.revealDone) return;
    if (section.querySelector(".proof-card, .proof-journal-wrap")) {
      section.dataset.revealDone = "1";
      return;
    }
    const hasOwnGrid = staggeredGrids.some((g) => section.contains(g));
    if (hasOwnGrid) {
      // Решётка внутри уже анимируется по карточкам — секцию целиком не
      // дублируем вторым fade поверх (иначе карточки «дёргались» бы дважды).
      section.dataset.revealDone = "1";
      return;
    }
    setupReveal(section);
  });
}

// Первый скан — после window.load, не раньше. Две причины сразу:
// 1) main.js в разметке стоит РАНЬШЕ страничных скриптов (industry-page.js,
//    program-page.js и т.п.), которые рисуют свои решётки синхронно из
//    статических данных solutions-data.js, без события data:ready — к
//    моменту load все <script> страницы уже отработали, решётки не пустые;
// 2) страховка «открыто по якорю» / «назад с восстановленным скроллом»:
//    переход браузера к #якорю или восстановление позиции скролла должны
//    успеть случиться раньше load, поэтому isInViewportNow() в setupReveal
//    увидит уже правильную, финальную позицию скролла, а не самый верх
//    страницы — иначе контент, в который читатель попал сразу, по ошибке
//    получил бы .reveal и вхолостую проигрывал анимацию у него на глазах.
if (document.readyState === "complete") {
  scanReveal();
} else {
  window.addEventListener("load", scanReveal);
}
// Повторный скан — для решёток, которые рисуются позже, уже после fetch
// (каталог, новости, похожие товары/публикации): тоже в setTimeout(0),
// чтобы отработали все обработчики data:ready, включая страничные.
document.addEventListener("data:ready", () => setTimeout(scanReveal, 0));
