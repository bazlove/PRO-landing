'use strict';

const storageKey = 'san-sebastian-recipe-v1';
const stepButtons = [...document.querySelectorAll('.step-toggle')];
const savedChecks = [...document.querySelectorAll('[data-save]')];
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressTrack = document.querySelector('.progress-track');
const toast = document.getElementById('toast');
const variantButtons = [...document.querySelectorAll('[data-ingredient-variant]')];

const ingredientVariants = {
  base: {
    cheeseShort: 'ABC Krem sir Classic',
    creamShort: 'Moja Kravica 36%',
    starchShort: 'Čvrstin C',
    cheeseName: 'ABC Krem sir Classic',
    cheeseNote: '200 г + 100 г. Не заменять творогом, kajmak или sitan sir.',
    cheesePack: '300 г',
    cheesePrice: '319,98–465,98 RSD',
    cheeseLink: 'https://cenoteka.rs/p/krem-sir-abc-200g/',
    creamName: 'Moja Kravica 36%',
    creamNote: 'Молочные сливки 33–36%, не pavlaka za kuvanje и не растительные.',
    creamPack: '250 мл',
    creamPrice: '179,99–193,68 RSD',
    creamLink: 'https://cenoteka.rs/p/slatka-pavlaka-imlek-36mm-250ml/',
    starchName: 'Čvrstin C',
    starchNote: 'Подойдёт любой чистый кукурузный крахмал.',
    starchPack: '150 г',
    starchPrice: '≈ 120 RSD*',
    starchLink: 'https://cenoteka.rs/p/cvrstin-c-150g/',
    basketTitle: 'Базовая корзина',
    basket: '≈ 800–1000 RSD',
    basketNote: '* Для Čvrstin указана оценка: актуальная цена не подтверждена. Остатки яиц, сливок и крахмала можно использовать позже.',
    quick: '300 г ABC · 200 мл сливки 36% · 120 г варёная сгущёнка · 2 яйца M · 25 г крахмал',
    recipe: '300 г ABC Krem sir Classic, 200 мл молочных сливок 36%, 120 г варёной сгущёнки, 2 яйца M, 25 г кукурузного крахмала'
  },
  alternative: {
    cheeseShort: 'Arla Natural',
    creamShort: 'Meggle Lactofree 30%',
    starchShort: 'Dr. Oetker Gustin',
    cheeseName: 'Arla Natural',
    cheeseNote: 'Нужно 300 г: купить 2 упаковки по 200 г, 100 г останется.',
    cheesePack: '2 × 200 г',
    cheesePrice: '≈ 460 RSD',
    cheeseLink: 'https://cenoteka.rs/p/krem-sir-namaz-arla-200g/',
    creamName: 'Meggle Lactofree 30%',
    creamNote: 'Молочные сливки без лактозы. Вся упаковка точно на рецепт.',
    creamPack: '200 мл',
    creamPrice: '≈ 250 RSD',
    creamLink: 'https://cenoteka.rs/p/slatka-pavlaka-meggle-lactofree-30mm-200ml/',
    starchName: 'Dr. Oetker Gustin',
    starchNote: 'Чистый кукурузный крахмал; использовать те же 25 г.',
    starchPack: '200 г',
    starchPrice: '184,99–217,99 RSD',
    starchLink: 'https://cenoteka.rs/p/gustin-droetker-200g/',
    basketTitle: 'Корзина с заменой',
    basket: '≈ 1 080–1 120 RSD',
    basketNote: 'Цена Gustin подтверждена в диапазоне магазинов. Из двух упаковок Arla после рецепта останется около 100 г; Gustin также останется для следующих блюд.',
    quick: '300 г Arla · 200 мл Meggle 30% · 120 г варёная сгущёнка · 2 яйца M · 25 г Gustin',
    recipe: '300 г Arla Natural, 200 мл молочных сливок Meggle Lactofree 30%, 120 г варёной сгущёнки, 2 яйца M, 25 г Dr. Oetker Gustin'
  }
};

function readState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || { checks: {}, steps: [] };
  } catch {
    return { checks: {}, steps: [] };
  }
}

let state = readState();

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The recipe still works when storage is unavailable.
  }
}

function updateProgress() {
  const completed = document.querySelectorAll('.step-card.is-done').length;
  const percent = Math.round((completed / stepButtons.length) * 100);
  progressText.textContent = `${completed} из ${stepButtons.length}`;
  progressBar.style.width = `${percent}%`;
  progressTrack.setAttribute('aria-valuenow', String(completed));
}

savedChecks.forEach((input) => {
  input.checked = Boolean(state.checks?.[input.dataset.save]);
  input.addEventListener('change', () => {
    state.checks = state.checks || {};
    state.checks[input.dataset.save] = input.checked;
    saveState();
  });
});

stepButtons.forEach((button) => {
  const card = button.closest('.step-card');
  const step = Number(card.dataset.step);
  const isDone = state.steps?.includes(step);
  card.classList.toggle('is-done', isDone);
  button.setAttribute('aria-pressed', String(isDone));

  button.addEventListener('click', () => {
    const nextDone = !card.classList.contains('is-done');
    card.classList.toggle('is-done', nextDone);
    button.setAttribute('aria-pressed', String(nextDone));
    const completed = new Set(state.steps || []);
    nextDone ? completed.add(step) : completed.delete(step);
    state.steps = [...completed].sort((a, b) => a - b);
    saveState();
    updateProgress();
  });
});

document.getElementById('resetSteps').addEventListener('click', () => {
  state.steps = [];
  stepButtons.forEach((button) => {
    button.closest('.step-card').classList.remove('is-done');
    button.setAttribute('aria-pressed', 'false');
  });
  saveState();
  updateProgress();
});

updateProgress();

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setLink(id, value) {
  const element = document.getElementById(id);
  if (element) element.href = value;
}

function applyIngredientVariant(name, announce = false) {
  const variantName = ingredientVariants[name] ? name : 'base';
  const variant = ingredientVariants[variantName];
  state.ingredientVariant = variantName;

  document.querySelectorAll('[data-choice-card]').forEach((card) => {
    card.classList.toggle('is-selected', card.dataset.choiceCard === variantName);
  });
  variantButtons.forEach((button) => {
    const selected = button.dataset.ingredientVariant === variantName;
    button.setAttribute('aria-pressed', String(selected));
    button.querySelector('span').textContent = selected ? 'Выбрано' : (button.dataset.ingredientVariant === 'base' ? 'Выбрать исходный набор' : 'Выбрать замену');
  });

  setText('ingredientCheeseName', variant.cheeseShort);
  setText('ingredientCreamName', variant.creamShort);
  setText('ingredientStarchName', variant.starchShort);
  setText('shopCheeseName', variant.cheeseName);
  setText('shopCheeseNote', variant.cheeseNote);
  setText('shopCheesePack', variant.cheesePack);
  setText('shopCheesePrice', variant.cheesePrice);
  setLink('shopCheeseLink', variant.cheeseLink);
  setText('shopCreamName', variant.creamName);
  setText('shopCreamNote', variant.creamNote);
  setText('shopCreamPack', variant.creamPack);
  setText('shopCreamPrice', variant.creamPrice);
  setLink('shopCreamLink', variant.creamLink);
  setText('shopStarchName', variant.starchName);
  setText('shopStarchNote', variant.starchNote);
  setText('shopStarchPack', variant.starchPack);
  setText('shopStarchPrice', variant.starchPrice);
  setLink('shopStarchLink', variant.starchLink);
  setText('basketTitle', variant.basketTitle);
  setText('basketEstimate', variant.basket);
  setText('basketNote', variant.basketNote);
  setText('quickIngredients', variant.quick);
  saveState();
  if (announce) showToast(variantName === 'base' ? 'Выбран исходный набор' : 'Выбрана рекомендованная замена');
}

variantButtons.forEach((button) => {
  button.addEventListener('click', () => applyIngredientVariant(button.dataset.ingredientVariant, true));
});

applyIngredientVariant(state.ingredientVariant || 'base');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -35px' });
  revealItems.forEach((item) => observer.observe(item));
}

function getRecipeText() {
  const variant = ingredientVariants[state.ingredientVariant] || ingredientVariants.base;
  return `Карамельный San Sebastián Cheesecake

Форма: 16–18 см
Ингредиенты: ${variant.recipe}.

Базовый ориентир для электрической духовки:
1. Верх + низ без вентилятора — 220 °C. Начать проверять с 15-й минуты.
2. Когда края держатся, а центр дрожит единым блоком, при необходимости включить гриль на 1–4 минуты только для цвета.
3. Охладить 1,5–2 часа на столе и минимум 6 часов в холодильнике.

Мой режим для Candy FCT615XL/1: Conventional — 220 °C, 20–21 минуты; затем Grill MAX — 3–4 минуты при закрытой двери.

Главное: не взбивать массу и не ждать неподвижного центра. После охлаждения он должен быть кремовым, но не текучим.`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

document.getElementById('copyRecipe').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(getRecipeText());
    showToast('Короткий рецепт скопирован');
  } catch {
    const area = document.createElement('textarea');
    area.value = getRecipeText();
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    showToast(copied ? 'Короткий рецепт скопирован' : 'Не удалось скопировать');
  }
});

document.getElementById('printRecipe').addEventListener('click', () => window.print());

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) window.setTimeout(() => target.focus({ preventScroll: true }), 450);
  });
});

window.addEventListener('scroll', () => {
  document.querySelector('.site-header').style.borderBottomColor = window.scrollY > 12 ? 'var(--line)' : 'transparent';
}, { passive: true });
