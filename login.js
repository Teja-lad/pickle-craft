/* ============================================================
   PICKLECRAFT — login.js  (Flask-connected version)
   All form submissions now POST to Flask at localhost:5000
   ============================================================ */

const FLASK_URL = 'http://localhost:5000';   // ← Change if Flask runs on a different port

/* ─── DOM Refs ───────────────────────────────────────────── */
const header           = document.getElementById('header');
const hamburger        = document.getElementById('hamburger');
const cartCountEl      = document.getElementById('cartCount');
const loginForm        = document.getElementById('loginForm');
const registerForm     = document.getElementById('registerForm');
const loginFormEl      = document.getElementById('loginFormElement');
const registerFormEl   = document.getElementById('registerFormElement');
const successModal     = document.getElementById('successModal');
const modalTitle       = document.getElementById('modalTitle');
const modalMessage     = document.getElementById('modalMessage');
const modalBtn         = document.getElementById('modalBtn');
const strengthFill     = document.getElementById('strengthFill');
const strengthText     = document.getElementById('strengthText');
const toastEl          = document.getElementById('toast');
const toastMsgEl       = document.getElementById('toastMessage');

/* ─── Sticky Nav ─────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

/* ─── Mobile Drawer ──────────────────────────────────────── */
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
    { href: 'contact.html',  label: 'Contact',  icon: '✉️' },
  ];

  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="logo">
        <span class="logo-icon">🥒</span>
        <span class="logo-text">PickleCraft</span>
      </div>
      <button class="drawer-close" id="drawerClose" aria-label="Close menu">✕</button>
    </div>
    <div class="drawer-nav">
      ${pages.map(p => `
        <a href="${p.href}" class="drawer-nav-link">
          <span>${p.icon}</span> ${p.label}
        </a>
      `).join('')}
    </div>
    <div class="drawer-actions">
      <a href="cart.html" class="drawer-nav-link">
        <span>🛒</span> Cart
        <span style="margin-left:auto;background:var(--green-600);color:#fff;
          font-size:11px;padding:2px 8px;border-radius:10px;" id="drawerCartCount">0</span>
      </a>
      <a href="login.html" class="drawer-nav-link active">
        <span>👤</span> Login / Register
      </a>
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

/* ─── Cart Count ─────────────────────────────────────────── */
function updateCartCount() {
  const cart  = JSON.parse(localStorage.getItem('picklecraft_cart')) || [];
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = total;
  const dc = document.getElementById('drawerCartCount');
  if (dc) dc.textContent = total;
}

/* ─── Welcome Panel Content ──────────────────────────────── */
const WELCOME_STATES = {
  login:    { title: 'Welcome <em>Back!</em>',   text: 'Login to access your account and continue your pickle journey with us.' },
  register: { title: 'Join the <em>Craft</em>',  text: 'Create your account and enjoy exclusive offers, order tracking, and more.' },
};

function updateWelcomePanel(mode) {
  const titleEl = document.querySelector('.welcome-title');
  const textEl  = document.querySelector('.welcome-text');
  if (!titleEl || !textEl) return;
  const state = WELCOME_STATES[mode] || WELCOME_STATES.login;
  titleEl.innerHTML  = state.title;
  textEl.textContent = state.text;
}

/* ─── Form Toggle ────────────────────────────────────────── */
function showForm(target) {
  const isLogin = target === 'login';
  loginForm.classList.toggle('active', isLogin);
  registerForm.classList.toggle('active', !isLogin);
  updateWelcomePanel(target);
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelector('.forms-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('.toggle-form-link');
  if (!link) return;
  e.preventDefault();
  showForm(link.dataset.target);
});

/* ─── Form Validation ────────────────────────────────────── */
const loginValidators = {
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email',
  password: v => v.length >= 1 ? '' : 'Please enter your password',
};

const registerValidators = {
  name:            v => v.trim().length >= 2  ? '' : 'Full name must be at least 2 characters',
  email:           v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email',
  phone:           v => /^[\d\s\+\-\(\)]{7,15}$/.test(v.trim()) ? '' : 'Please enter a valid phone number',
  password:        v => v.length >= 8         ? '' : 'Password must be at least 8 characters',
  confirmPassword: v => {
    const pass = document.getElementById('registerPassword')?.value || '';
    return v === pass ? '' : 'Passwords do not match';
  },
};

function validateField(input, validators) {
  const name     = input.name;
  const validate = validators[name];
  if (!validate) return true;
  const error = validate(input.value);
  const existingError = input.closest('.form-group')?.querySelector('.field-error');
  if (existingError) existingError.remove();
  if (error) {
    input.classList.add('error');
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = error;
    input.closest('.form-group')?.appendChild(errorEl);
    return false;
  }
  input.classList.remove('error');
  return true;
}

function validateForm(formEl, validators) {
  let allValid = true;
  formEl.querySelectorAll('input').forEach(input => {
    if (!validateField(input, validators)) allValid = false;
  });
  return allValid;
}

function bindLiveValidation(formEl, validators) {
  formEl.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateField(input, validators));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(input, validators);
    });
  });
}

/* ─── Password Strength Meter ────────────────────────────── */
function calcPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)          score++;
  if (password.length >= 12)         score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LEVELS = [
  { label: '',         color: 'transparent', width: '0%'   },
  { label: 'Weak',     color: '#C0442A',     width: '20%'  },
  { label: 'Fair',     color: '#C97B4B',     width: '40%'  },
  { label: 'Good',     color: '#D4A849',     width: '60%'  },
  { label: 'Strong',   color: '#4A7A3A',     width: '80%'  },
  { label: 'Excellent',color: '#3D6630',     width: '100%' },
];

function updateStrengthMeter(password) {
  if (!strengthFill || !strengthText) return;
  const score  = calcPasswordStrength(password);
  const level  = STRENGTH_LEVELS[score];
  strengthFill.style.width      = password ? level.width : '0%';
  strengthFill.style.background = level.color;
  strengthText.textContent      = password ? level.label : '';
  strengthText.style.color      = level.color;
}

/* ─── Toggle Password Visibility ────────────────────────── */
function initPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.dataset.target;
      const input    = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type        = isPassword ? 'text' : 'password';
      toggle.textContent = isPassword ? '🙈' : '👁️';
    });
  });
}

/* ─── API Helper ─────────────────────────────────────────── */
async function postJSON(endpoint, body) {
  const res = await fetch(`${FLASK_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return res.json();
}

/* ─── Login Submit → Flask /api/login ───────────────────── */
if (loginFormEl) {
  bindLiveValidation(loginFormEl, loginValidators);

  loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(loginFormEl, loginValidators)) {
      showToast('Please fix the errors above', true);
      return;
    }

    const btn = loginFormEl.querySelector('.submit-btn');
    const btnText = btn.querySelector('.btn-text');
    btn.classList.add('loading');
    btnText.textContent = 'Signing in...';

    try {
      const result = await postJSON('/api/login', {
        email:    document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      });

      if (result.ok) {
        // Store minimal user info in localStorage for UI use
        localStorage.setItem('picklecraft_user', JSON.stringify(result.data));

        modalTitle.textContent   = 'Welcome Back! 👋';
        modalMessage.textContent = result.message;
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        showToast(result.message || 'Login failed', true);
      }
    } catch (err) {
      showToast('Could not connect to server. Is Flask running?', true);
    } finally {
      btn.classList.remove('loading');
      btnText.textContent = 'Login';
    }
  });
}

/* ─── Register Submit → Flask /api/register ─────────────── */
if (registerFormEl) {
  bindLiveValidation(registerFormEl, registerValidators);

  const regPasswordInput = document.getElementById('registerPassword');
  if (regPasswordInput) {
    regPasswordInput.addEventListener('input', () => updateStrengthMeter(regPasswordInput.value));
  }

  registerFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    const termsCheck = document.getElementById('agreeTerms');
    if (termsCheck && !termsCheck.checked) {
      showToast('Please agree to the Terms & Conditions', true);
      return;
    }
    if (!validateForm(registerFormEl, registerValidators)) {
      showToast('Please fix the errors above', true);
      return;
    }

    const btn = registerFormEl.querySelector('.submit-btn');
    const btnText = btn.querySelector('.btn-text');
    btn.classList.add('loading');
    btnText.textContent = 'Creating account...';

    try {
      const result = await postJSON('/api/register', {
        name:     document.getElementById('registerName').value.trim(),
        email:    document.getElementById('registerEmail').value.trim(),
        phone:    document.getElementById('registerPhone').value.trim(),
        password: document.getElementById('registerPassword').value,
      });

      if (result.ok) {
        localStorage.setItem('picklecraft_user', JSON.stringify(result.data));

        const firstName = result.data?.name?.split(' ')[0] || 'there';
        modalTitle.textContent   = 'Account Created! 🎉';
        modalMessage.textContent = `Welcome to PickleCraft, ${firstName}! ${result.message}`;
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        showToast(result.message || 'Registration failed', true);
      }
    } catch (err) {
      showToast('Could not connect to server. Is Flask running?', true);
    } finally {
      btn.classList.remove('loading');
      btnText.textContent = 'Create Account';
    }
  });
}

/* ─── Modal Actions ──────────────────────────────────────── */
function closeModal() {
  successModal.classList.remove('active');
  document.body.style.overflow = '';
}

if (modalBtn) {
  modalBtn.addEventListener('click', () => {
    closeModal();
    setTimeout(() => { window.location.href = 'index.html'; }, 200);
  });
}
successModal?.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── Forgot Password ────────────────────────────────────── */
document.querySelectorAll('.forgot-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Password reset link sent! Check your email');
  });
});

/* ─── Social Buttons ─────────────────────────────────────── */
document.querySelectorAll('.social-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const provider = btn.classList.contains('google') ? 'Google' : 'Facebook';
    showToast(`${provider} sign-in coming soon!`);
  });
});

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

/* ─── Add welcome perks ──────────────────────────────────── */
function addWelcomePerks() {
  const content = document.querySelector('.welcome-content');
  if (!content || content.querySelector('.welcome-perks')) return;
  const perks = [
    { icon: '🎁', text: '10% off your first order' },
    { icon: '📦', text: 'Track your orders in real-time' },
    { icon: '🔁', text: 'Easy reorder from history' },
  ];
  const perksEl = document.createElement('ul');
  perksEl.className = 'welcome-perks';
  perksEl.innerHTML = perks.map(p => `
    <li class="perk-item">
      <span class="perk-icon">${p.icon}</span>
      <span>${p.text}</span>
    </li>
  `).join('');
  content.appendChild(perksEl);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  createDrawer();
  updateCartCount();
  initPasswordToggles();
  addWelcomePerks();
  showForm('login');
});