document.addEventListener("data:ready", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  const n = news.find((x) => x.id === id);

  if (!n) {
    document.querySelector("main").innerHTML =
      "<div class='wrap empty-state'>Новость не найдена.</div>";
    return;
  }

  document.title = `Софит — ${n.title}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", n.excerpt.slice(0, 160));

  document.getElementById("ndBreadcrumb").textContent = n.title;
  document.getElementById("ndDate").textContent = n.date;
  document.getElementById("ndTitle").textContent = n.title;
  // innerHTML + highlightLatin (экранирует и смягчает латинские слова) —
  // переносы строк по-прежнему сохраняются через white-space:pre-line в CSS.
  document.getElementById("ndBody").innerHTML = highlightLatin(n.body);
  if (n.image) {
    document.getElementById("ndImage").src = n.image;
    document.querySelector(".news-thumb.article-thumb").classList.add("has-photo");
  }

  const related = news.filter((x) => x.id !== n.id).slice(0, 3);
  document.getElementById("ndRelatedGrid").innerHTML = related.map(newsCardHTML).join("");
});