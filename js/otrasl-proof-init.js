(function () {
  var slug = new URLSearchParams(window.location.search).get("slug");
  var ind = industries.find(function (x) { return x.slug === slug; });
  var wrap = document.getElementById("indProofWrap");
  if (!ind) return; // industry-page.js ниже отрисует "отрасль не найдена"
  var proof = industriesProof.find(function (x) { return x.slug === ind.slug; });
  if (proof) {
    wrap.innerHTML = industryProofHTML(proof);
    initIndustryProof(wrap, proof);
  } else {
    wrap.closest("section").remove();
  }
})();
