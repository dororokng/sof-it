document.addEventListener("DOMContentLoaded", () => {
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
  document.getElementById("ndBody").innerHTML = `<p>${n.body}</p>`;
});