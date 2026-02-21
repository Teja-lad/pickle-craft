/* ============================================================
   PICKLECRAFT — contact.js  (Flask-connected version)
   Contact form now POSTs to Flask at localhost:5000
   ============================================================ */

const FLASK_URL = 'http://localhost:5000';

const header        = document.getElementById('header');
const hamburger     = document.getElementById('hamburger');
const cartCountEl   = document.getElementById('cartCount');
const contactForm   = document.getElementById('contactForm');
const successModal  = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModal');
const toastEl       = document.getElementById('toast');
const toastMsgEl    = document.getElementById('toastMessage');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

function createDrawer() {
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawerOverlay';
  const drawer = document.createElement('nav');
  drawer.className = 'nav-drawer';
  drawer.id = 'navDrawer';
  const pages = [
    { href: 'index.html',    label: 'Home',     icon: '🏠' },
    { href: '#about',        label: 'About Us', icon: '📖' },
    { href: 'products.html', label: 'Pickles',  icon: '🥒' },
    { href: 'order.html',    label: 'Order Now',icon: '🛍️' },
    { href: 'contact.html',  label: 'Contact',  icon: '✉️', active: true },
  ];
  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="logo"><span class="logo-icon">🥒</span><span class="logo-text">PickleCraft</span></div>
      <button class="drawer-close" id="drawerClose" aria-label="Close menu">✕</button>
    </div>
    <div class="drawer-nav">
      ${pages.map(p => `<a href="${p.href}" class="drawer-nav-link ${p.active ? 'active' : ''}"><span>${p.icon}</span> ${p.label}</a>`).join('')}
    </div>
    <div class="drawer-actions">
      <a href="cart.html" class="drawer-nav-link"><span>🛒</span> Cart
        <span style="margin-left:auto;background:var(--green-600);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;" id="drawerCartCount">0</span>
      </a>
      <a href="login.html" class="drawer-nav-link"><span>👤</span> Login / Register</a>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  hamburger.addEventListener('click', () => toggleDrawer(true));
  document.getElementById('drawerClose').addEventListener('click', () => toggleDrawer(false));
  overlay.addEventListener('click', () => toggleDrawer(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleDrawer(false); });
}

function toggleDrawer(open) {
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('drawerOverlay');
  drawer.classList.toggle('active', open);
  overlay.classList.toggle('active', open);
  hamburger.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function updateCartCount() {
  const cart  = JSON.parse(localStorage.getItem('picklecraft_cart')) || [];
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = total;
  const dc = document.getElementById('drawerCartCount');
  if (dc) dc.textContent = total;
}

function initScrollReveal() {
  const targets = document.querySelectorAll('.info-card, .faq-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = [...entry.target.parentNode.children];
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), idx * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  targets.forEach(el => observer.observe(el));
}

/* ─── Form Validation ────────────────────────────────────── */
const validators = {
  name:    v => v.trim().length >= 2   ? '' : 'Please enter your full name',
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address',
  phone:   v => v.trim() === '' || /^[\d\s\+\-\(\)]{7,15}$/.test(v.trim()) ? '' : 'Please enter a valid phone number',
  subject: v => v !== '' ? '' : 'Please select a subject',
  message: v => v.trim().length >= 10  ? '' : 'Message must be at least 10 characters',
};

function validateField(input) {
  const validate = validators[input.name];
  if (!validate) return true;
  const err = validate(input.value);
  const existingError = input.parentNode.querySelector('.field-error');
  if (existingError) existingError.remove();
  if (err) {
    input.classList.add('error');
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = err;
    input.parentNode.appendChild(errorEl);
    return false;
  }
  input.classList.remove('error');
  return true;
}

function validateAll() {
  const fields = contactForm.querySelectorAll('input, select, textarea');
  let allValid = true;
  fields.forEach(field => { if (!validateField(field)) allValid = false; });
  return allValid;
}

if (contactForm) {
  contactForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => { if (field.classList.contains('error')) validateField(field); });
  });
}

/* ─── Contact Form Submit → Flask /api/contact ───────────── */
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      showToast('Please fix the errors above', true);
      return;
    }

    const btn = contactForm.querySelector('.submit-btn');
    const btnText = btn.querySelector('.btn-text');
    btn.classList.add('loading');
    btnText.textContent = 'Sending...';

    const payload = {
      name:    document.getElementById('name').value.trim(),
      email:   document.getElementById('email').value.trim(),
      phone:   document.getElementById('phone').value.trim(),
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value.trim(),
    };

    try {
      const res = await fetch(`${FLASK_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.ok) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        contactForm.reset();
      } else {
        showToast(result.message || 'Failed to send message', true);
      }
    } catch (err) {
      showToast('Could not connect to server. Is Flask running?', true);
    } finally {
      btn.classList.remove('loading');
      btnText.textContent = 'Send Message';
    }
  });
}

/* ─── Close Modal ────────────────────────────────────────── */
function closeModal() {
  successModal.classList.remove('active');
  document.body.style.overflow = '';
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
successModal?.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── FAQ Accordion ──────────────────────────────────────── */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');
    if (!question || !answer) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
    question.setAttribute('role', 'button');
    question.setAttribute('tabindex', '0');
    question.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); question.click(); }
    });
  });
}

/* ─── Toast ──────────────────────────────────────────────── */
let toastTimer;
function showToast(message, isError = false) {
  toastMsgEl.textContent = message;
  toastEl.classList.remove('toast-error');
  if (isError) toastEl.classList.add('toast-error');
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  createDrawer();
  updateCartCount();
  initScrollReveal();
  initFAQ();
});