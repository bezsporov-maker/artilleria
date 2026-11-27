'use strict';

const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const tabs = [...document.querySelectorAll('[data-tab]')];
const panels = tabs.map(tab => document.getElementById(tab.dataset.tab));
const dialog = document.querySelector('#request-dialog');
const form = document.querySelector('#lead-form');
const result = document.querySelector('#result');
const success = document.querySelector('.success');
const context = document.querySelector('#request-context');
const mobileRequest = document.querySelector('.mobile-actions [data-request]');
const mobileTopics = {
  repair: ['Ремонт техники', 'Оставить заявку'],
  parts: ['Подбор запчастей', 'Узнать наличие'],
  rent: ['Аренда МУП-351', 'Уточнить даты']
};
let subject = 'Ремонт техники';
const drafts = new Map();
let pending = false;
let trigger;

function setMenu(open) {
  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
menu.addEventListener('click', () => setMenu(!navigation.classList.contains('open')));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('header') || event.target.closest('nav a')) setMenu(false);
});

function showPanel(id) {
  const chosen = tabs.find(tab => tab.dataset.tab === id) || tabs[0];
  const [topic, action] = mobileTopics[chosen.dataset.tab];
  mobileRequest.dataset.request = topic;
  mobileRequest.textContent = action;
  tabs.forEach((tab, i) => {
    const active = tab === chosen;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
    panels[i].hidden = !active;
  });
}

function readHash() {
  const id = location.hash.slice(1);
  if (id === 'services' || !id || tabs.some(tab => tab.dataset.tab === id)) {
    showPanel(id);
    if (tabs.some(tab => tab.dataset.tab === id)) document.querySelector('#services').scrollIntoView();
  }
}
tabs.forEach(tab => {
  tab.setAttribute('role', 'button');
  tab.setAttribute('aria-controls', tab.dataset.tab);
  tab.addEventListener('keydown', event => {
    if (event.key === ' ') {
      event.preventDefault();
      tab.click();
    }
  });
  tab.addEventListener('click', event => {
    event.preventDefault();
    showPanel(tab.dataset.tab);
    if (location.hash !== tab.hash) history.pushState(null, '', tab.hash);
  });
});
navigation.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  const id = link.hash.slice(1);
  if (id === 'services' || tabs.some(tab => tab.dataset.tab === id)) {
    event.preventDefault();
    showPanel(id);
    history.pushState(null, '', '#' + id);
    document.getElementById('services').scrollIntoView();
  }
});
showPanel(location.hash.slice(1));
window.addEventListener('hashchange', readHash);

function setRequest(topic) {
  const description = form.elements['our-message'];
  const photo = form.elements.uploadfile;
  if (topic !== subject) {
    drafts.set(subject, {message: description.value, photos: photo.files});
    const draft = drafts.get(topic);
    description.value = draft?.message || '';
    if (draft?.photos.length) photo.files = draft.photos;
    else photo.value = '';
    photo.dispatchEvent(new Event('change'));
    form.elements['acceptance-875'].checked = false;
  }
  subject = topic;
  context.textContent = topic;
  const rental = topic.startsWith('Аренда');
  for (const field of [form.elements.dropdown, form.elements.uploadfile]) {
    field.disabled = rental;
    field.closest('label').hidden = rental;
  }
  let label = 'Что случилось?';
  let placeholder = 'Например, на МТЗ-82 не включается вторая передача';
  if (topic === 'Подбор запчастей') {
    label = 'Какая деталь нужна?';
    placeholder = 'Модель техники, название детали или артикул';
  } else if (rental) {
    label = 'Где и когда нужен трактор?';
    placeholder = 'Например, 12 декабря нужен трактор со щёткой в Котельниках';
  } else if (topic === 'Выезд мастера') {
    label = 'Где находится техника и что произошло?';
    placeholder = 'Адрес объекта, модель и признаки неисправности';
  }
  document.querySelector('#description-label').textContent = label;
  description.placeholder = placeholder;
}

document.addEventListener('click', event => {
  const link = event.target.closest('[data-request]');
  if (!link || typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  trigger = link;
  if (!pending) {
    if (!success.hidden) {
      form.reset();
      drafts.clear();
      subject = link.dataset.request;
    }
    form.hidden = false;
    success.hidden = true;
    result.replaceChildren();
    setRequest(link.dataset.request);
  }
  setMenu(false);
  dialog.showModal();
  document.body.classList.add('modal-open');
  document.querySelector('.close').focus({preventScroll:true});
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.querySelector('.finish').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  trigger?.focus({preventScroll:true});
});

const phone = form.elements.Phone;
const file = form.elements.uploadfile;
phone.addEventListener('input', () => phone.setCustomValidity(''));
file.addEventListener('change', () => {
  const photo = file.files[0];
  file.setCustomValidity(photo && (photo.size > 1024 * 1024 || !/\.(jpeg|jpg|png)$/i.test(photo.name))
    ? 'Выберите фото JPG или PNG размером до 1 МБ.' : '');
});

function showFallback(uncertain) {
  result.replaceChildren();
  result.append(uncertain ? 'Не удалось получить подтверждение. Уточните статус по телефону ' : 'Сервис не подтвердил отправку. Позвоните ');
  const tel = document.createElement('a');
  tel.href = 'tel:+74951431723';
  tel.textContent = '+7 (495) 143-17-23';
  const mail = document.createElement('a');
  mail.textContent = 'напишите по почте';
  const model = form.elements.dropdown;
  const details = [form.elements['our-message'].value, model.disabled ? '' : model.value, form.elements['your-name'].value, phone.value].filter(Boolean).join('\n');
  mail.href = 'mailto:89771314213@mail.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(details);
  result.append(tel, ' или ', mail, '.');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending) return;
  const number = phone.value.trim();
  const digits = number.replace(/\D/g, '');
  const validPhone = /^\+?[\d\s()-]+$/.test(number) && digits.length >= 10 && digits.length <= 15;
  phone.setCustomValidity(validPhone ? '' : 'Введите номер с кодом города или оператора, например +7 999 123 45 67.');
  if (!form.reportValidity()) return;
  const payload = new FormData(form);
  if (!file.files.length) payload.delete('uploadfile');
  payload.set('our-message', subject + '\n' + payload.get('our-message'));
  for (const [key, value] of Object.entries({
    _wpcf7:'9392', _wpcf7_version:'5.1.3', _wpcf7_locale:'en_US',
    _wpcf7_unit_tag:'wpcf7-f9392-p9640-o2', _wpcf7_container_post:'9640'
  })) payload.set(key, value);
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  pending = true;
  button.textContent = 'Отправляем…';
  result.replaceChildren();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch('https://mtz-cto.ru/wp-json/contact-form-7/v1/contact-forms/9392/feedback', {
      method:'POST', body:payload, signal:controller.signal, credentials:'omit'
    });
    if (!response.ok) throw new Error('Запрос не подтверждён');
    const data = await response.json();
    if (data.status === 'mail_sent') {
      form.hidden = true;
      success.hidden = false;
      if (dialog.open) dialog.querySelector('.finish').focus();
    } else if (data.status === 'validation_failed' && data.invalidFields?.length) {
      result.textContent = 'Проверьте имя, номер телефона и описание. При необходимости уберите вложение и попробуйте ещё раз.';
    } else {
      showFallback(false);
    }
  } catch {
    showFallback(true);
  } finally {
    clearTimeout(timeout);
    pending = false;
    button.disabled = false;
    button.textContent = 'Отправить заявку';
  }
});
