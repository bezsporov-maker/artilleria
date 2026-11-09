const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

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

const contactForm = document.querySelector("#contact-form");
const projectMessage = document.querySelector("#project-message");
const projectConsent = document.querySelector("#project-consent");
const formStatus = document.querySelector("#form-status");

contactForm.querySelector("button").disabled = false;
projectMessage.addEventListener("input", () => projectMessage.setCustomValidity(""));
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = projectMessage.value.trim();
  projectMessage.setCustomValidity(message ? "" : "Коротко опишите вашу задачу.");
  if (!contactForm.reportValidity() || !projectConsent.checked) return;

  const subject = encodeURIComponent("Заявка с сайта «Артиллерия»");
  const body = encodeURIComponent([
    message,
    "Даю ИП Русакову Дмитрию Николаевичу согласие на обработку моих персональных данных для ответа на это обращение (редакция 1): https://bezsporov-maker.github.io/artilleria/consent.html",
  ].join("\r\n\r\n"));

  formStatus.textContent = "Если почтовое приложение не открылось, напишите на d.rusakov@artilleria.ru.";
  formStatus.hidden = false;
  window.location.href = `mailto:d.rusakov@artilleria.ru?subject=${subject}&body=${body}`;
});

const counterId = 114093905;
const analyticsPreference = "artilleria-analytics-v1";
const preferenceLifetime = 180 * 24 * 60 * 60 * 1000;
const analyticsBanner = document.querySelector("#analytics-banner");
const analyticsSettings = document.querySelector("#analytics-settings");
const rejectAnalytics = document.querySelector("#analytics-reject");
const acceptAnalytics = document.querySelector("#analytics-accept");

let analyticsChoice;
let openedFromSettings = false;
try {
  const saved = JSON.parse(localStorage.getItem(analyticsPreference));
  if (saved && saved.expires > Date.now()) analyticsChoice = saved.choice;
} catch {
  // Analytics stays off when the saved preference cannot be read.
}

function startAnalytics() {
  window[`disableYaCounter${counterId}`] = false;
  if (window.ym) return;

  window.ym = function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  document.head.append(tag);
  window.ym(counterId, "init", {
    clickmap: true,
    webvisor: false,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

function setAnalyticsChoice(choice) {
  const wasAllowed = analyticsChoice === "allow";
  analyticsChoice = choice;
  try {
    localStorage.setItem(analyticsPreference, JSON.stringify({
      choice,
      expires: Date.now() + preferenceLifetime,
    }));
  } catch {
    // The visitor can still choose for the current page.
  }

  analyticsBanner.hidden = true;
  if (openedFromSettings) analyticsSettings.focus({ preventScroll: true });
  openedFromSettings = false;
  if (choice === "allow") {
    startAnalytics();
  } else if (wasAllowed) {
    window[`disableYaCounter${counterId}`] = true;
  }
}

analyticsSettings.hidden = false;
analyticsSettings.addEventListener("click", () => {
  openedFromSettings = true;
  analyticsBanner.hidden = false;
  rejectAnalytics.focus();
});
rejectAnalytics.addEventListener("click", () => setAnalyticsChoice("reject"));
acceptAnalytics.addEventListener("click", () => setAnalyticsChoice("allow"));

if (analyticsChoice === "allow") {
  startAnalytics();
} else if (analyticsChoice !== "reject") {
  analyticsBanner.hidden = false;
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-goal]");
  if (link && analyticsChoice === "allow" && typeof window.ym === "function") {
    window.ym(counterId, "reachGoal", link.dataset.goal);
  }
});
