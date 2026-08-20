document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newsListGrid").innerHTML = news.map(newsCardHTML).join("");
});