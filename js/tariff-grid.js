// Решётка тарифов — одинаковая логика на /pages/ceny.html и на блоке
// тарифов внутри /pages/vnedrenie-1s.html (разный id контейнера).
(function () {
  const ids = ["tariffsGrid", "pageTariffGrid"];
  const html = tariffs.map(tariffCardHTML).join("");
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
})();
