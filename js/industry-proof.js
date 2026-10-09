// Компонент «Партия до/после» + «Журнал смены» — единая секция, которой
// заменены старая SVG/фото-схема и грид «Когда нужна автоматизация» на
// страницах отраслей. Данные — только из industriesProof (industries.ts /
// js/industries-proof-data.js), в разметке отраслевой текст не хардкодится.
// Вызывается с двух страниц: industry-page.js (9 плоских отраслей,
// pages/otrasl.html) и industry-item-page.js (эталон «Пищевые продукты»,
// pages/otrasl-item.html).
//
// industryProofHTML(p) — возвращает HTML секции (вставляется innerHTML).
// initIndustryProof(root, p) — вызывается после вставки: запускает анимации
// чисел и навешивает чекбоксы журнала смены + передачу данных в заявку.

const PROOF_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

function proofFormatMetric(value, metric) {
  const fmt = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
    signDisplay: metric.signed ? "exceptZero" : "auto",
  });
  return `${fmt.format(value)} ${metric.unit}`;
}

function proofStepsHTML(p) {
  const plain = p.stepsMode === "control";
  return p.steps
    .map(
      (s) => `<div class="proof-step${plain ? " proof-step--plain" : ""}">
        <span class="proof-step-name">${escapeHtml(s.name)}</span>
        <span class="proof-step-dots"></span>
        <span class="proof-step-value${plain ? " proof-step-value--plain" : ""}">${escapeHtml(s.value)}</span>
      </div>`
    )
    .join("");
}

function proofTallyText(n, m, verdictObject) {
  if (n === 0) return "Отметьте, что происходит у вас";
  if (n === 1) return "Начнём с одного участка — так быстрее увидеть эффект";
  if (n === m) return "Полный набор. Покажем решение на ваших данных";
  return `Пора вести ${verdictObject} в 1С. Разберём ваш процесс на звонке`;
}

function industryProofHTML(p) {
  const journalMod = p.log.length === 5 ? " proof-journal--5" : "";
  return `
  <div class="proof-card">
    <div class="proof-card-head">
      <span class="proof-case-header">${escapeHtml(p.caseHeader)}</span>
      <span class="info-label proof-sample-note">Пример расчёта</span>
    </div>
    <div class="proof-grid">
      <div class="proof-col">
        <span class="info-label">Проблема</span>
        <h4>${escapeHtml(p.titles.problem)}</h4>
        <span class="proof-metric-label">${escapeHtml(p.metric.label)}</span>
        <span class="proof-metric proof-metric--problem" data-min="${p.metric.problemRange[0]}" data-max="${p.metric.problemRange[1]}"></span>
      </div>
      <div class="proof-col proof-col--solution">
        <span class="info-label">Решение 1С</span>
        <h4>${escapeHtml(p.titles.solution)}</h4>
        <div class="proof-steps">${proofStepsHTML(p)}</div>
      </div>
      <div class="proof-col">
        <span class="info-label">Результат</span>
        <h4>${escapeHtml(p.titles.result)}</h4>
        <span class="proof-metric-label">${escapeHtml(p.metric.label)}</span>
        <span class="proof-metric proof-metric--result" data-value="${p.metric.resultValue}">${proofFormatMetric(0, p.metric)}</span>
        <div class="proof-result-lines">
          ${p.resultLines.map((l) => `<p>${escapeHtml(l)}</p>`).join("")}
        </div>
      </div>
    </div>
  </div>

  <div class="proof-journal-wrap">
    <div class="section-head">
      <div><h2>${escapeHtml(p.checkTitle)}</h2></div>
    </div>
    <div class="proof-journal${journalMod}">
      ${p.log
        .map(
          (entry, i) => `<label class="proof-log-card">
            <div class="proof-log-head">
              <span class="proof-log-time">${escapeHtml(entry.time)}</span>
              <span class="proof-log-place">${escapeHtml(entry.place)}</span>
            </div>
            <p class="proof-log-quote">«${escapeHtml(entry.quote)}»</p>
            <span class="proof-log-check">
              <input type="checkbox" data-thesis="${escapeAttr(entry.thesis)}" />
              <span>${escapeHtml(entry.thesis)}</span>
            </span>
          </label>`
        )
        .join("")}
    </div>
    <div class="proof-tally">
      <span class="proof-tally-count">Отмечено 0 из ${p.log.length}</span>
      <p class="proof-tally-verdict">${proofTallyText(0, p.log.length, p.verdictObject)}</p>
      <a href="/pages/contacts.html" class="btn btn-primary btn-arrow proof-tally-cta">Заказать консультацию</a>
    </div>
  </div>`;
}

function proofAnimateProblem(el) {
  const min = Number(el.dataset.min);
  const max = Number(el.dataset.max);
  const metric = el.__proofMetric;
  if (PROOF_REDUCED_MOTION.matches) {
    el.textContent = proofFormatMetric((min + max) / 2, metric);
    return;
  }
  const tick = () => {
    const value = min + Math.random() * (max - min);
    el.textContent = proofFormatMetric(value, metric);
  };
  tick();
  el.__proofInterval = setInterval(tick, 900);
}

function proofAnimateResult(el) {
  const target = Number(el.dataset.value);
  const metric = el.__proofMetric;
  if (PROOF_REDUCED_MOTION.matches) {
    el.textContent = proofFormatMetric(target, metric);
    return;
  }
  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = proofFormatMetric(target * eased, metric);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initIndustryProof(root, p) {
  const problemEl = root.querySelector(".proof-metric--problem");
  const resultEl = root.querySelector(".proof-metric--result");
  if (problemEl) problemEl.__proofMetric = p.metric;
  if (resultEl) resultEl.__proofMetric = p.metric;

  const card = root.querySelector(".proof-card");
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        if (problemEl) proofAnimateProblem(problemEl);
        if (resultEl) proofAnimateResult(resultEl);
        obs.disconnect();
      });
    },
    { threshold: 0.3 }
  );
  if (card) io.observe(card);

  const countEl = root.querySelector(".proof-tally-count");
  const verdictEl = root.querySelector(".proof-tally-verdict");
  const checkboxes = Array.from(root.querySelectorAll(".proof-log-check input[type=checkbox]"));
  const cta = root.querySelector(".proof-tally-cta");
  const total = p.log.length;

  const updateTally = () => {
    const checked = checkboxes.filter((c) => c.checked);
    countEl.textContent = `Отмечено ${checked.length} из ${total}`;
    verdictEl.textContent = proofTallyText(checked.length, total, p.verdictObject);
    if (cta) {
      cta.dataset.theses = checked.map((c) => c.dataset.thesis).join("\n");
    }
  };

  checkboxes.forEach((c) => c.addEventListener("change", updateTally));
  updateTally();

  if (cta) {
    cta.addEventListener("click", () => {
      const theses = (cta.dataset.theses || "").split("\n").filter(Boolean);
      const lines = [`Отрасль: ${p.name} (${p.slug})`];
      if (theses.length) {
        lines.push("Отметили на странице:");
        theses.forEach((t) => lines.push(`— ${t}`));
      }
      try {
        sessionStorage.setItem("leadPrefillComment", lines.join("\n"));
      } catch (e) {
        // sessionStorage недоступен (приватный режим и т.п.) — просто откроем
        // форму без префилла, заявку всё равно можно отправить вручную.
      }
    });
  }
}
