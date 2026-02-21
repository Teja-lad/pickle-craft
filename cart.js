/* ============================================================
   PICKLECRAFT — cart.js
   Added: Login popup when clicking Proceed to Checkout
   After login → automatically goes to order.html
   ============================================================ */

const FLASK_URL = 'http://localhost:5000';

const PROMO_CODES = {
  'PICKLE10':  { discount: 0.10, label: '10% off applied!' },
  'WELCOME15': { discount: 0.15, label: '15% off for new customers!' },
  'SAVE20':    { discount: 0.20, label: '20% off applied!' },
  'CRAFT5':    { discount: 0.05, label: '5% off applied!' }
};

const DELIVERY_FEE     = 5.00;
const FREE_DELIVERY_AT = 50.00;
const TAX_RATE         = 0.05;

const RECOMMENDED = [
  { id: 1,  name: 'Classic Mango Pickle',   price: 12.99, image: "images/Mango-pickle.jpg",          category: 'veg'     },
  { id: 3,  name: 'Lemon Ginger Pickle',    price: 10.99, image: "images/lemon-pickle.png",           category: 'veg'     },
  { id: 5,  name: 'Prawn Balchão Pickle',   price: 17.99, image: "images/PrawnsPickle.jpg",           category: 'non-veg' },
  { id: 6,  name: 'Chicken Pickle (Dry)',   price: 18.99, image: "images/chicken-pickle.jpg",         category: 'non-veg' },
  { id: 8,  name: 'Mutton Keema Pickle',    price: 19.99, image: "images/mutton-pickle.jpg",          category: 'non-veg' },
];

let cart        = JSON.parse(localStorage.getItem('picklecraft_cart')) || [];
let appliedCode = JSON.parse(localStorage.getItem('picklecraft_promo')) || null;

const header           = document.getElementById('header');
const hamburger        = document.getElementById('hamburger');
const cartCountEl      = document.getElementById('cartCount');
const itemCountEl      = document.getElementById('itemCount');
const cartItemsEl      = document.getElementById('cartItems');
const emptyCartEl      = document.getElementById('emptyCart');
const subtotalEl       = document.getElementById('subtotal');
const deliveryFeeEl    = document.getElementById('deliveryFee');
const taxEl            = document.getElementById('tax');
const totalEl          = document.getElementById('total');
const promoInput       = document.getElementById('promoCode');
const applyPromoBtn    = document.getElementById('applyPromo');
const discountInfoEl   = document.getElementById('discountInfo');
const discountTextEl   = document.getElementById('discountText');
const checkoutBtn      = document.getElementById('checkoutBtn');
const clearCartBtn     = document.getElementById('clearCart');
const confirmModal     = document.getElementById('confirmModal');
const cancelClearBtn   = document.getElementById('cancelClear');
const confirmClearBtn  = document.getElementById('confirmClear');
const toastEl          = document.getElementById('toast');
const toastMsgEl       = document.getElementById('toastMessage');
const recSection       = document.getElementById('recommendedSection');
const recProductsEl    = document.getElementById('recommendedProducts');

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
      <div class="logo"><span class="logo-icon">🥒</span><span class="logo-text">PickleCraft</span></div>
      <button class="drawer-close" id="drawerClose" aria-label="Close menu">✕</button>
    </div>
    <div class="drawer-nav">
      ${pages.map(p => `<a href="${p.href}" class="drawer-nav-link"><span>${p.icon}</span> ${p.label}</a>`).join('')}
    </div>
    <div class="drawer-actions">
      <a href="cart.html" class="drawer-nav-link active"><span>🛒</span> Cart
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleDrawer(false); });
}

function toggleDrawer(open) {
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('drawerOverlay');
  drawer.classList.toggle('active', open);
  overlay.classList.toggle('active', open);
  hamburger.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ─── Cart Persistence ───────────────────────────────────── */
function saveCart() { localStorage.setItem('picklecraft_cart', JSON.stringify(cart)); }
function savePromo() { localStorage.setItem('picklecraft_promo', JSON.stringify(appliedCode)); }

/* ─── Update Cart Count Badge ────────────────────────────── */
function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = total;
  const drawerCount = document.getElementById('drawerCartCount');
  if (drawerCount) drawerCount.textContent = total;
  if (itemCountEl) itemCountEl.textContent = total;
}

/* ─── Check if user is logged in ─────────────────────────── */
function isLoggedIn() {
  const user = localStorage.getItem('picklecraft_user');
  return user !== null;
}

/* ══════════════════════════════════════════════════════════
   LOGIN POPUP MODAL
   Shows when user clicks checkout but is not logged in
   ══════════════════════════════════════════════════════════ */
function createLoginPopup() {
  // Don't create twice
  if (document.getElementById('loginPopup')) return;

  const popup = document.createElement('div');
  popup.id = 'loginPopup';
  popup.style.cssText = `
    position: fixed; inset: 0; z-index: 5000;
    display: none; align-items: center; justify-content: center;
    padding: 20px;
  `;

  popup.innerHTML = `
    <!-- Dark overlay -->
    <div id="loginPopupOverlay" style="
      position: absolute; inset: 0;
      background: rgba(44,36,22,0.55);
      backdrop-filter: blur(4px);
    "></div>

    <!-- Popup Box -->
    <div style="
      position: relative; z-index: 1;
      background: #FAF7F2;
      border-radius: 20px;
      padding: 40px 36px;
      max-width: 420px; width: 100%;
      box-shadow: 0 8px 32px rgba(44,36,22,0.2);
      animation: popupIn 0.25s ease;
    ">
      <!-- Close button -->
      <button id="closeLoginPopup" style="
        position: absolute; top: 16px; right: 16px;
        width: 32px; height: 32px;
        background: #F2EBE0; border: none;
        border-radius: 8px; font-size: 16px;
        color: #4A3C2C; cursor: pointer;
      ">✕</button>

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
        <h2 style="font-family: 'Playfair Display', serif; font-size: 24px; color: #2C2416; margin-bottom: 8px;">
          Login to Continue
        </h2>
        <p style="font-size: 13px; color: #7A6555;">
          Please login or register to place your order
        </p>
      </div>

      <!-- Tab buttons -->
      <div style="display: flex; background: #F2EBE0; border-radius: 10px; padding: 4px; margin-bottom: 24px;">
        <button id="popupLoginTab" onclick="switchPopupTab('login')" style="
          flex: 1; padding: 10px; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          background: #4A7A3A; color: #fff;
          transition: all 0.2s ease;
        ">Login</button>
        <button id="popupRegisterTab" onclick="switchPopupTab('register')" style="
          flex: 1; padding: 10px; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          background: transparent; color: #7A6555;
          transition: all 0.2s ease;
        ">Register</button>
      </div>

      <!-- LOGIN FORM -->
      <div id="popupLoginForm">
        <div style="margin-bottom: 16px;">
          <label style="font-size: 12px; font-weight: 600; color: #4A3C2C; display: block; margin-bottom: 6px;">Email</label>
          <input id="popupEmail" type="email" placeholder="your@email.com" style="
            width: 100%; padding: 11px 14px;
            border: 1.5px solid #E8DDD0; border-radius: 10px;
            font-size: 14px; font-family: 'DM Sans', sans-serif;
            background: #fff; outline: none; color: #2C2416;
          ">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="font-size: 12px; font-weight: 600; color: #4A3C2C; display: block; margin-bottom: 6px;">Password</label>
          <input id="popupPassword" type="password" placeholder="Enter password" style="
            width: 100%; padding: 11px 14px;
            border: 1.5px solid #E8DDD0; border-radius: 10px;
            font-size: 14px; font-family: 'DM Sans', sans-serif;
            background: #fff; outline: none; color: #2C2416;
          ">
        </div>
        <button onclick="handlePopupLogin()" style="
          width: 100%; padding: 13px;
          background: #4A7A3A; color: #fff;
          border: none; border-radius: 11px;
          font-size: 15px; font-weight: 600; cursor: pointer;
        ">Login & Continue to Order →</button>
      </div>

      <!-- REGISTER FORM -->
      <div id="popupRegisterForm" style="display: none;">
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 600; color: #4A3C2C; display: block; margin-bottom: 6px;">Full Name</label>
          <input id="popupRegName" type="text" placeholder="Your full name" style="
            width: 100%; padding: 11px 14px;
            border: 1.5px solid #E8DDD0; border-radius: 10px;
            font-size: 14px; font-family: 'DM Sans', sans-serif;
            background: #fff; outline: none; color: #2C2416;
          ">
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 600; color: #4A3C2C; display: block; margin-bottom: 6px;">Email</label>
          <input id="popupRegEmail" type="email" placeholder="your@email.com" style="
            width: 100%; padding: 11px 14px;
            border: 1.5px solid #E8DDD0; border-radius: 10px;
            font-size: 14px; font-family: 'DM Sans', sans-serif;
            background: #fff; outline: none; color: #2C2416;
          ">
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 600; color: #4A3C2C; display: block; margin-bottom: 6px;">Phone</label>
          <input id="popupRegPhone" type="tel" placeholder="+91 99999 99999" style="
            width: 100%; padding: 11px 14px;
            border: 1.5px solid #E8DDD0; border-radius: 10px;
            font-size: 14px; font-family: 'DM Sans', sans-serif;
            background: #fff; outline: none; color: #2C2416;
          ">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="font-size: 12px; font-weight: 600; color: #4A3C2C; display: block; margin-bottom: 6px;">Password</label>
          <input id="popupRegPassword" type="password" placeholder="Min 8 characters" style="
            width: 100%; padding: 11px 14px;
            border: 1.5px solid #E8DDD0; border-radius: 10px;
            font-size: 14px; font-family: 'DM Sans', sans-serif;
            background: #fff; outline: none; color: #2C2416;
          ">
        </div>
        <button onclick="handlePopupRegister()" style="
          width: 100%; padding: 13px;
          background: #4A7A3A; color: #fff;
          border: none; border-radius: 11px;
          font-size: 15px; font-weight: 600; cursor: pointer;
        ">Register & Continue to Order →</button>
      </div>

      <!-- Error message area -->
      <p id="popupError" style="
        display: none; margin-top: 14px;
        text-align: center; font-size: 13px;
        color: #C0442A; background: #FDECEA;
        padding: 10px; border-radius: 8px;
      "></p>

    </div>

    <style>
      @keyframes popupIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    </style>
  `;

  document.body.appendChild(popup);

  // Close on overlay click
  document.getElementById('loginPopupOverlay').addEventListener('click', closeLoginPopup);
  document.getElementById('closeLoginPopup').addEventListener('click', closeLoginPopup);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLoginPopup(); });
}

/* ─── Switch between Login / Register tabs in popup ──────── */
function switchPopupTab(tab) {
  const loginForm    = document.getElementById('popupLoginForm');
  const registerForm = document.getElementById('popupRegisterForm');
  const loginTab     = document.getElementById('popupLoginTab');
  const registerTab  = document.getElementById('popupRegisterTab');
  const errorEl      = document.getElementById('popupError');

  if (errorEl) errorEl.style.display = 'none';

  if (tab === 'login') {
    loginForm.style.display    = 'block';
    registerForm.style.display = 'none';
    loginTab.style.background  = '#4A7A3A';
    loginTab.style.color       = '#fff';
    registerTab.style.background = 'transparent';
    registerTab.style.color      = '#7A6555';
  } else {
    loginForm.style.display    = 'none';
    registerForm.style.display = 'block';
    registerTab.style.background = '#4A7A3A';
    registerTab.style.color      = '#fff';
    loginTab.style.background  = 'transparent';
    loginTab.style.color       = '#7A6555';
  }
}

/* ─── Show / Hide popup ──────────────────────────────────── */
function openLoginPopup() {
  const popup = document.getElementById('loginPopup');
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLoginPopup() {
  const popup = document.getElementById('loginPopup');
  popup.style.display = 'none';
  document.body.style.overflow = '';
}

/* ─── Show error inside popup ─────────────────────────────── */
function showPopupError(message) {
  const el = document.getElementById('popupError');
  el.textContent = message;
  el.style.display = 'block';
}

/* ─── Handle Login inside popup ──────────────────────────── */
async function handlePopupLogin() {
  const email    = document.getElementById('popupEmail').value.trim();
  const password = document.getElementById('popupPassword').value;

  if (!email || !password) {
    showPopupError('Please enter email and password');
    return;
  }

  const btn = event.target;
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    const res = await fetch(`${FLASK_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();

    if (result.ok) {
      // Save user to localStorage
      localStorage.setItem('picklecraft_user', JSON.stringify(result.data));
      closeLoginPopup();
      showToast('✅ Logged in! Taking you to order page...');
      // Wait 1 second then go to order page
      setTimeout(() => {
        window.location.href = 'order.html';
      }, 1000);
    } else {
      showPopupError(result.message || 'Login failed. Check your email and password.');
      btn.textContent = 'Login & Continue to Order →';
      btn.disabled = false;
    }
  } catch (err) {
    showPopupError('Cannot connect to server. Is Flask running?');
    btn.textContent = 'Login & Continue to Order →';
    btn.disabled = false;
  }
}

/* ─── Handle Register inside popup ───────────────────────── */
async function handlePopupRegister() {
  const name     = document.getElementById('popupRegName').value.trim();
  const email    = document.getElementById('popupRegEmail').value.trim();
  const phone    = document.getElementById('popupRegPhone').value.trim();
  const password = document.getElementById('popupRegPassword').value;

  if (!name || !email || !phone || !password) {
    showPopupError('Please fill in all fields');
    return;
  }
  if (password.length < 8) {
    showPopupError('Password must be at least 8 characters');
    return;
  }

  const btn = event.target;
  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res = await fetch(`${FLASK_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, phone, password })
    });
    const result = await res.json();

    if (result.ok) {
      localStorage.setItem('picklecraft_user', JSON.stringify(result.data));
      closeLoginPopup();
      showToast('🎉 Account created! Taking you to order page...');
      setTimeout(() => {
        window.location.href = 'order.html';
      }, 1000);
    } else {
      showPopupError(result.message || 'Registration failed. Try again.');
      btn.textContent = 'Register & Continue to Order →';
      btn.disabled = false;
    }
  } catch (err) {
    showPopupError('Cannot connect to server. Is Flask running?');
    btn.textContent = 'Register & Continue to Order →';
    btn.disabled = false;
  }
}

/* ─── Checkout Button Click ───────────────────────────────── */
function handleCheckout(e) {
  e.preventDefault();

  if (cart.length === 0) {
    showToast('Your cart is empty!', true);
    return;
  }

  if (isLoggedIn()) {
    // Already logged in — go directly to order page
    window.location.href = 'order.html';
  } else {
    // Not logged in — show login popup
    openLoginPopup();
  }
}

/* ─── Totals Calculator ──────────────────────────────────── */
function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discount = 0;
  if (appliedCode) discount = subtotal * appliedCode.discount;
  const discountedSubtotal = subtotal - discount;
  const delivery = discountedSubtotal === 0 ? 0 : (discountedSubtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE);
  const tax   = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + delivery + tax;
  return { subtotal, discount, delivery, tax, total };
}

/* ─── Update Summary Panel ───────────────────────────────── */
function updateSummary() {
  const { subtotal, discount, delivery, tax, total } = calculateTotals();
  subtotalEl.textContent    = `₹${subtotal.toFixed(2)}`;
  deliveryFeeEl.textContent = delivery === 0 && subtotal > 0 ? 'Free! 🎉' : `₹${delivery.toFixed(2)}`;
  taxEl.textContent         = `₹${tax.toFixed(2)}`;
  totalEl.textContent       = `₹${total.toFixed(2)}`;

  let discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    if (!discountRow) {
      discountRow = document.createElement('div');
      discountRow.id = 'discountRow';
      discountRow.className = 'summary-row discount-row';
      deliveryFeeEl.closest('.summary-row').insertAdjacentElement('beforebegin', discountRow);
    }
    discountRow.innerHTML = `<span>Discount:</span><span>-₹${discount.toFixed(2)}</span>`;
  } else if (discountRow) {
    discountRow.remove();
  }

  if (cart.length === 0) {
    checkoutBtn.classList.add('disabled');
    checkoutBtn.innerHTML = 'Cart is Empty';
  } else {
    checkoutBtn.classList.remove('disabled');
    checkoutBtn.innerHTML = `Proceed to Checkout <span class="btn-arrow">→</span>`;
  }
}

/* ─── Item Image Renderer ────────────────────────────────── */
function renderItemImage(item) {
  const rec = RECOMMENDED.find(r => r.id === item.id);
  const imgSrc = (rec && rec.image) ? rec.image : null;
  if (imgSrc) return `<img src="${imgSrc}" alt="${item.name}">`;
  return `<div class="item-img-placeholder"><span>🥒</span><span>Photo</span></div>`;
}

/* ─── Cart Render ────────────────────────────────────────── */
function renderCart() {
  updateCartCount();

  if (cart.length === 0) {
    cartItemsEl.style.display = 'none';
    emptyCartEl.style.display = 'block';
    clearCartBtn.style.visibility = 'hidden';
    updateSummary();
    renderRecommended();
    return;
  }

  emptyCartEl.style.display = 'none';
  cartItemsEl.style.display = 'block';
  clearCartBtn.style.visibility = 'visible';

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="item-image">${renderItemImage(item)}</div>
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <p class="item-category">${item.category || 'Pickle'} · ${item.weight || '250g'}</p>
        <p class="item-unit-price">₹${item.price.toFixed(2)} each</p>
        <div class="quantity-control">
          <button class="qty-btn minus-btn" data-id="${item.id}" aria-label="Decrease">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn plus-btn" data-id="${item.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="item-actions">
        <span class="item-total">₹${(item.price * item.qty).toFixed(2)}</span>
        <button class="remove-item-btn" data-id="${item.id}" aria-label="Remove item">Remove</button>
      </div>
    </div>
  `).join('');

  updateSummary();
  renderRecommended();

  cartItemsEl.querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), -1));
  });
  cartItemsEl.querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', () => changeQty(parseInt(btn.dataset.id), +1));
  });
  cartItemsEl.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => removeItem(parseInt(btn.dataset.id)));
  });
}

/* ─── Cart Mutations ─────────────────────────────────────── */
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeItem(id); return; }
  saveCart();
  renderCart();
}

function removeItem(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const row = cartItemsEl.querySelector(`[data-id="${id}"]`);
  if (row) {
    row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    row.style.opacity = '0';
    row.style.transform = 'translateX(20px)';
    setTimeout(() => {
      cart = cart.filter(i => i.id !== id);
      saveCart();
      renderCart();
    }, 220);
  } else {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }
  showToast(`Removed ${item.name}`);
}

function clearCart() {
  cart = [];
  saveCart();
  appliedCode = null;
  savePromo();
  if (promoInput) promoInput.value = '';
  if (discountInfoEl) discountInfoEl.style.display = 'none';
  renderCart();
  showToast('Cart cleared');
}

/* ─── Promo Codes ────────────────────────────────────────── */
function applyPromo() {
  const code = promoInput.value.trim().toUpperCase();
  if (!code) { showToast('Please enter a promo code', true); return; }
  if (PROMO_CODES[code]) {
    appliedCode = { code, ...PROMO_CODES[code] };
    savePromo();
    discountInfoEl.style.display = 'flex';
    discountTextEl.textContent = PROMO_CODES[code].label;
    promoInput.value = code;
    updateSummary();
    showToast('🎉 Promo code applied!');
  } else {
    showToast('Invalid promo code', true);
  }
}

/* ─── Recommended Products ───────────────────────────────── */
function renderRecommended() {
  const cartIds = cart.map(i => i.id);
  const recs = RECOMMENDED.filter(p => !cartIds.includes(p.id));
  if (recs.length === 0 || !recSection) {
    if (recSection) recSection.style.display = 'none';
    return;
  }
  recSection.style.display = 'block';
  recProductsEl.innerHTML = recs.map(p => `
    <div class="rec-card">
      <div class="rec-image">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
          : `<span style="font-size:28px;">📷</span>`
        }
      </div>
      <div class="rec-info">
        <p class="rec-name">${p.name}</p>
        <div class="rec-footer">
          <span class="rec-price">₹${p.price.toFixed(2)}</span>
          <button class="rec-add-btn" data-id="${p.id}">+ Add</button>
        </div>
      </div>
    </div>
  `).join('');

  recProductsEl.querySelectorAll('.rec-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const product = RECOMMENDED.find(r => r.id === id);
      if (!product) return;
      const existing = cart.find(i => i.id === id);
      if (existing) { existing.qty += 1; }
      else { cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 }); }
      saveCart();
      renderCart();
      showToast(`🥒 ${product.name} added to cart!`);
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

/* ─── Clear Cart Modal ───────────────────────────────────── */
clearCartBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  confirmModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});
cancelClearBtn.addEventListener('click', () => {
  confirmModal.classList.remove('active');
  document.body.style.overflow = '';
});
confirmClearBtn.addEventListener('click', () => {
  confirmModal.classList.remove('active');
  document.body.style.overflow = '';
  clearCart();
});
confirmModal.querySelector('.modal-overlay')?.addEventListener('click', () => {
  confirmModal.classList.remove('active');
  document.body.style.overflow = '';
});

/* ─── Promo Code Event ───────────────────────────────────── */
applyPromoBtn.addEventListener('click', applyPromo);
promoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyPromo(); });

/* ─── Restore promo ──────────────────────────────────────── */
function restorePromo() {
  if (!appliedCode) return;
  discountInfoEl.style.display = 'flex';
  discountTextEl.textContent = appliedCode.label;
  if (promoInput) promoInput.value = appliedCode.code;
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  createDrawer();
  createLoginPopup();
  renderCart();
  restorePromo();
  updateSummary();

  // Override checkout button click
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
});