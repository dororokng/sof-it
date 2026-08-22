document.addEventListener("data:ready", () => {
  document.getElementById("servicesGrid").innerHTML = services.map(serviceCardHTML).join("");
});
