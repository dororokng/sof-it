document.addEventListener("data:ready", () => {
  document.getElementById("newsListGrid").innerHTML = news.map(newsCardHTML).join("");
});