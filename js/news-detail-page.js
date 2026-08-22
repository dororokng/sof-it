document.addEventListener("data:ready", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  const n = news.find((x) => x.id === id);

  if (!n) {
    document.querySelector("main").innerHTML =
      "<div class='wrap' style='padding:80px 0'>Новость не найдена.</div>";
    return;
  }

  document.getElementById("ndBreadcrumb").textContent = n.title;
  document.getElementById("ndDate").textContent = n.date;
  document.getElementById("ndTitle").textContent = n.title;
  // textContent (не innerHTML) + CSS white-space:pre-line на .article-body —
  // переносы строк, как их набрали в админке, сохраняются один в один.
  document.getElementById("ndBody").textContent = n.body;
  if (n.image) {
    document.getElementById("ndImage").src = n.image;
    document.querySelector(".news-thumb.article-thumb").classList.add("has-photo");
  }

  const related = news.filter((x) => x.id !== n.id).slice(0, 3);
  document.getElementById("ndRelatedGrid").innerHTML = related.map(newsCardHTML).join("");
});