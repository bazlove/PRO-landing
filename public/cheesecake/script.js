'use strict';

const storageKey = 'san-sebastian-recipe-v1';
const stepButtons = [...document.querySelectorAll('.step-toggle')];
const savedChecks = [...document.querySelectorAll('[data-save]')];
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressTrack = document.querySelector('.progress-track');
const toast = document.getElementById('toast');

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

const recipeText = `Карамельный San Sebastián Cheesecake

Форма: 16 см
Ингредиенты: 300 г крем-сыра, 200 мл сливок 36%, 120 г варёной сгущёнки, 2 яйца M, 25 г кукурузного крахмала.

1. Conventional / верх + низ — 220 °C, 21–22 минуты.
2. Grill — MAX, 3–4 минуты. Следить непрерывно.
3. Охладить 1–1,5 часа на столе и минимум 6 часов в холодильнике.

Главное: не взбивать массу, не пересушивать, ориентироваться по схватившимся краям и дрожащему центру.`;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

document.getElementById('copyRecipe').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(recipeText);
    showToast('Короткий рецепт скопирован');
  } catch {
    const area = document.createElement('textarea');
    area.value = recipeText;
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
