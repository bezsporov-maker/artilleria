const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const contactForm = document.querySelector("#contact-form");
const formNote = document.querySelector("#form-note");
const contactEmail = "d.rusakov@artilleria.ru";

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Открыть меню" : "Закрыть меню");
  siteNav.classList.toggle("is-open", !isOpen);
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    siteNav.classList.remove("is-open");
  }
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const data = new FormData(contactForm);
  const subject = encodeURIComponent(`Заявка на маркетинг от ${data.get("name")}`);
  const body = encodeURIComponent(
    [
      `Имя: ${data.get("name")}`,
      `Контакт для ответа: ${data.get("contact")}`,
      `Задача: ${data.get("message") || "Не указана"}`,
    ].join("\n"),
  );

  formNote.dataset.state = "error";
  formNote.textContent =
    "Перед публикацией подключите рабочую почту в script.js: адрес получателя пока не настроен.";

  if (!contactEmail) return;

  window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  formNote.dataset.state = "success";
  formNote.textContent = "Черновик письма подготовлен. Отправьте его из почтового приложения.";
});
