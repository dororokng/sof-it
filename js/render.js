function svgFor(cat) {
  if (cat === "industrial") {
    return `<circle cx="100" cy="140" r="10" fill="#6E8CB4"/><line x1="100" y1="140" x2="100" y2="90" stroke="#8FA6C2" stroke-width="4"/><line x1="100" y1="90" x2="150" y2="70" stroke="#8FA6C2" stroke-width="4"/><line x1="150" y1="70" x2="150" y2="40" stroke="#8FA6C2" stroke-width="4"/><circle cx="150" cy="40" r="6" fill="#8FA6C2"/><rect x="70" y="150" width="60" height="14" fill="#3E5C82"/>`;
  }
  return `<rect x="50" y="100" width="100" height="45" rx="4" stroke="#8FA6C2" stroke-width="3"/><circle cx="70" cy="150" r="10" fill="#6E8CB4"/><circle cx="130" cy="150" r="10" fill="#6E8CB4"/><line x1="60" y1="100" x2="60" y2="70" stroke="#3E5C82" stroke-width="3"/><line x1="60" y1="70" x2="100" y2="70" stroke="#3E5C82" stroke-width="3"/>`;
}

function productCardHTML(p) {
  return `<div class="product-card">
    <div class="product-thumb"><div class="grid-overlay"></div><svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">${svgFor(p.cat)}</svg></div>
    <div class="product-body">
      <span class="product-cat">${p.catLabel}</span>
      <h4>${p.name}</h4>
      <p>${p.desc}</p>
      <div class="product-actions">
        <a href="/pages/product.html?id=${p.id}" class="btn btn-outline">Подробнее</a>
        <a href="/pages/contacts.html" class="btn btn-primary">Консультация</a>
      </div>
    </div>
  </div>`;
}

function newsCardHTML(n) {
  return `<a class="news-card" href="/pages/news-detail.html?id=${n.id}">
    <div class="news-thumb"><div class="grid-overlay"></div></div>
    <span class="news-date">${n.date}</span>
    <h4>${n.title}</h4>
    <p>${n.excerpt}</p>
    <span class="news-more">Подробнее →</span>
  </a>`;
}