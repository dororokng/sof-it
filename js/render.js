function productThumbHTML(p) {
  if (p.image) {
    return `<img src="${p.image}" alt="${p.name}" loading="lazy" />`;
  }
  return `<div class="thumb-fallback">Фото не загружено</div>`;
}

function productCardHTML(p) {
  return `<div class="product-card">
    <div class="product-thumb">${productThumbHTML(p)}</div>
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

function serviceCardHTML(s, index) {
  const num = String(index + 1).padStart(2, "0");
  return `<div class="service-card">
    <span class="tag">IT / ${num}</span>
    <h4>${s.name}</h4>
    <p>${s.shortDescription}</p>
  </div>`;
}

function newsThumbHTML(n) {
  if (n.image) {
    return `<img src="${n.image}" alt="${n.title}" loading="lazy" />`;
  }
  return `<div class="grid-overlay"></div>`;
}

function newsCardHTML(n) {
  return `<a class="news-card" href="/pages/news-detail.html?id=${n.id}">
    <div class="news-thumb">${newsThumbHTML(n)}</div>
    <span class="news-date">${n.date}</span>
    <h4>${n.title}</h4>
    <p>${n.excerpt}</p>
    <span class="news-more">Подробнее →</span>
  </a>`;
}