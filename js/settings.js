// Телефон/e-mail/адрес/мессенджеры теперь редактируются в админке
// («Настройки сайта»), а не зашиты в HTML. Ждём одновременно и разметку
// шапки/футера (layout:ready — они подгружаются отдельным fetch'ем в
// include.js), и сами данные (data:ready — из js/data.js), потому что
// неизвестно, что придёт раньше.
let layoutReady = false;
let dataReady = false;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

function setHref(id, href) {
  const el = document.getElementById(id);
  if (el && href) el.href = href;
}

function applySettings() {
  if (!layoutReady || !dataReady) return;

  setText("headerPhoneNumber", settings.phone);
  setHref("headerPhone", settings.phone && "tel:" + settings.phone.replace(/[^\d+]/g, ""));

  setText("footerPhone", settings.phone);
  setHref("footerPhone", settings.phone && "tel:" + settings.phone.replace(/[^\d+]/g, ""));
  setText("footerEmail", settings.email);
  setHref("footerEmail", settings.email && "mailto:" + settings.email);
  setText("footerAddress", settings.address);
  setText("footerHours", settings.workingHours);
  setText("footerAbout", settings.footerAbout);
  setHref("footerTelegram", settings.telegramUrl);
  setHref("footerWhatsapp", settings.whatsappUrl);
  setHref("footerVk", settings.vkUrl);

  setText("contactPhone", settings.phone);
  setText("contactEmail", settings.email);
  setText("contactAddress", settings.address);
  setText("contactHours", settings.workingHours);
  setHref("contactTelegram", settings.telegramUrl);
  setHref("contactWhatsapp", settings.whatsappUrl);
  setHref("contactCall", settings.phone && "tel:" + settings.phone.replace(/[^\d+]/g, ""));
}

document.addEventListener("layout:ready", () => {
  layoutReady = true;
  applySettings();
});
document.addEventListener("data:ready", () => {
  dataReady = true;
  applySettings();
});
