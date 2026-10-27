// Строка чипов-ссылок на решения 1С — одинаковая логика на нескольких
// страницах услуг (разный id контейнера), раньше была отдельным инлайн-
// скриптом на каждой странице — под строгим CSP (script-src 'self') такие
// скрипты браузер молча блокирует, поэтому вынесено сюда одним файлом.
(function () {
  const ids = [
    "autoProgramsRow",
    "revisionProgramsRow",
    "consultProgramsRow",
    "updateProgramsRow",
    "supportProgramsRow",
    "pageProgramsRow",
  ];
  const html = onecPrograms
    .map((p) => `<a class="link-chip" href="/sof-it/pages/programma.html?slug=${p.slug}">${highlightLatin(p.name)}</a>`)
    .join("");
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
})();
