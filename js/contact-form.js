document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const successBox = document.getElementById("formSuccess");
  const errorBox = document.getElementById("formError");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    successBox.classList.remove("show");
    errorBox.classList.remove("show");

    const name = document.getElementById("f-name").value.trim();
    const phone = document.getElementById("f-phone").value.trim();
    const consent = document.getElementById("f-consent").checked;
    const phoneDigits = phone.replace(/\D/g, "");

    if (!name || !phone || phoneDigits.length < 10 || !consent) {
      errorBox.textContent = "Заполните обязательные поля (имя, телефон) и подтвердите согласие на обработку персональных данных.";
      errorBox.classList.add("show");
      return;
    }

    const payload = {
      name,
      phone,
      company: document.getElementById("f-company").value.trim(),
      email: document.getElementById("f-email").value.trim(),
      comment: document.getElementById("f-comment").value.trim(),
      consent,
      website: document.getElementById("f-website").value, // honeypot — у людей всегда пусто
    };

    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.");
      }
      successBox.textContent = "Спасибо! Заявка отправлена. Мы свяжемся с вами.";
      successBox.classList.add("show");
      form.reset();
    } catch (err) {
      errorBox.textContent = err.message || "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.";
      errorBox.classList.add("show");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
