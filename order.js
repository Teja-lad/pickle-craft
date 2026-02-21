/* ============================================================
   PICKLECRAFT — order.js  (Flask-connected version)
   Order form now POSTs to Flask at localhost:5000
   Only the submit section is changed — all other logic preserved
   ============================================================ */

const FLASK_URL = 'http://localhost:5000';

/* ─── Promo Codes ────────────────────────────────────────── */
const PROMO_CODES = {
  'PICKLE10':  { discount: 0.10, label: '10% off — PICKLE10' },
  'WELCOME15': { discount: 0.15, label: '15% off — WELCOME15' },
  'SAVE20':    { discount: 0.20, label: '20% off — SAVE20' },
  'CRAFT5':    { discount: 0.05, label: '5% off — CRAFT5' },
};

const PRODUCT_CATALOGUE = {
  1: { name: 'Classic Mango Pickle',      weight: '250g', image: "images/Mango-pickle.jpg" },
  2: { name: 'Garlic Chilli Pickle',      weight: '200g', image: "images/garlic-pickle.jpg" },
  3: { name: 'Lemon Ginger Pickle',       weight: '250g', image: "images/lemon-pickle.png" },
  4: { name: 'Mixed Vegetable Pickle',    weight: '300g', image: "images/mixed-vegetable-pickle.jpg" },
  5: { name: 'Prawn Balchão Pickle',      weight: '200g', image: "images/PrawnsPickle.jpg" },
  6: { name: 'Chicken Pickle (Dry)',      weight: '250g', image: "images/chicken-pickle.jpg" },
  7: { name: 'Green Chilli Pickle',       weight: '200g', image: "images/green chilli-pickle.jpg" },
  8: { name: 'Mutton Keema Pickle',       weight: '200g', image: "images/mutton-pickle.jpg" },
  9: { name: 'Amla (Gooseberry) Pickle',  weight: '250g', image: "images/amla-pickle.jpg" },
};

const DELIVERY_FEE     = 5.00;
const FREE_DELIVERY_AT = 50.00;
const TAX_RATE         = 0.05;

let cart        = JSON.parse(localStorage.getItem('picklecraft_cart'))  || [];
let appliedPromo= JSON.parse(localStorage.getItem('picklecraft_promo')) || null;

const header          = document.getElementById('header');
const hamburger       = document.getElementById('hamburger');
const cartCountEl     = document.getElementById('cartCount');
const orderForm       = document.getElementById('orderForm');
const successModal    = document.getElementById('successModal');
const orderIdEl       = document.getElementById('orderId');
const toastEl         = document.getElementById('toast');
const toastMsgEl      = document.getElementById('toastMessage');
const promoInput      = document.getElementById('promoCodeInput');
const applyPromoBtn   = document.getElementById('applyPromoBtn');
const promoSuccessEl  = document.getElementById('promoSuccess');
const promoLabelEl    = document.getElementById('promoLabel');
const promoRemoveBtn  = document.getElementById('promoRemove');

const summaryItemsEl  = document.getElementById('summaryItems');
const subtotalEl      = document.getElementById('summarySubtotal');
const discountRowEl   = document.getElementById('summaryDiscountRow');
const discountAmtEl   = document.getElementById('summaryDiscount');
const deliveryEl      = document.getElementById('summaryDelivery');
const taxEl           = document.getElementById('summaryTax');
const totalEl         = document.getElementById('summaryTotal');

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
    { href: 'order.html',    label: 'Order Now',icon: '🛍️', active: true },
    { href: 'contact.html',  label: 'Contact',  icon: '✉️' },
  ];
  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="logo"><span class="logo-icon">🥒</span><span class="logo-text">PickleCraft</span></div>
      <button class="drawer-close" id="drawerClose" aria-label="Close">✕</button>
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
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  if (cartCountEl) cartCountEl.textContent = total;
  const dc = document.getElementById('drawerCartCount');
  if (dc) dc.textContent = total;
}

function initDatePicker() {
  const input = document.getElementById('deliveryDate');
  if (!input) return;
  const today = new Date();
  let minDate = new Date(today);
  let added = 0;
  while (added < 3) {
    minDate.setDate(minDate.getDate() + 1);
    const day = minDate.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  const fmt = d => d.toISOString().split('T')[0];
  input.min = fmt(minDate);
  input.max = fmt(maxDate);
  input.value = fmt(minDate);
  const note = document.getElementById('dateNote');
  if (note) {
    input.addEventListener('change', () => {
      const selected = new Date(input.value + 'T12:00:00');
      note.textContent = `Estimated delivery: ${selected.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    });
    note.textContent = `Earliest delivery: ${minDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}`;
  }
}

function renderOrderItems() {
  const area = document.getElementById('cartItemsArea');
  if (!area) return;
  if (cart.length === 0) {
    area.innerHTML = `
      <div class="empty-order-notice">
        <div class="empty-icon">🛒</div>
        <h4>Your cart is empty</h4>
        <p>Add some pickles before placing an order.</p>
        <a href="products.html" class="browse-link">Browse Pickles</a>
      </div>`;
    const submitBtn = document.querySelector('.place-order-btn');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }
  area.innerHTML = `<div class="cart-items-list">${
    cart.map(item => {
      const meta = PRODUCT_CATALOGUE[item.id] || {};
      const imgHTML = meta.image
        ? `<img src="${meta.image}" alt="${item.name}">`
        : `<div class="img-fallback"><span>🥒</span><span>Photo</span></div>`;
      return `
        <div class="order-item">
          <div class="order-item-img">${imgHTML}</div>
          <div class="order-item-info">
            <p class="item-name">${item.name}</p>
            <p class="item-meta">${meta.weight || '250g'} · Qty: ${item.qty}</p>
          </div>
          <div class="order-item-price">
            <span class="item-line-price">₹${(item.price * item.qty).toFixed(2)}</span>
            <p class="item-qty-label">₹${item.price.toFixed(2)} each</p>
          </div>
        </div>`;
    }).join('')
  }</div>`;
}

function calcTotals() {
  const subtotal   = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount   = appliedPromo ? subtotal * appliedPromo.discount : 0;
  const afterDisc  = subtotal - discount;
  const delivery   = afterDisc === 0 ? 0 : (afterDisc >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE);
  const tax        = afterDisc * TAX_RATE;
  const total      = afterDisc + delivery + tax;
  return { subtotal, discount, delivery, tax, total };
}

function updateSummary() {
  const { subtotal, discount, delivery, tax, total } = calcTotals();
  if (summaryItemsEl) {
    if (cart.length === 0) {
      summaryItemsEl.innerHTML = '<p class="summary-empty">No items yet</p>';
    } else {
      summaryItemsEl.innerHTML = cart.map(item => {
        const meta = PRODUCT_CATALOGUE[item.id] || {};
        const imgHTML = meta.image ? `<img src="${meta.image}" alt="${item.name}">` : `🥒`;
        return `
          <div class="summary-item">
            <div class="summary-item-img">${imgHTML}</div>
            <div class="summary-item-details">
              <p class="summary-item-name">${item.name}</p>
              <p class="summary-item-qty">× ${item.qty}</p>
            </div>
            <span class="summary-item-price">₹${(item.price * item.qty).toFixed(2)}</span>
          </div>`;
      }).join('');
    }
  }
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  if (taxEl)      taxEl.textContent      = `₹${tax.toFixed(2)}`;
  if (deliveryEl) deliveryEl.textContent = delivery === 0 && subtotal > 0 ? 'Free 🎉' : `₹${delivery.toFixed(2)}`;
  if (totalEl)    totalEl.textContent    = `₹${total.toFixed(2)}`;
  if (discountRowEl) {
    discountRowEl.style.display = discount > 0 ? 'flex' : 'none';
    if (discountAmtEl) discountAmtEl.textContent = `-₹${discount.toFixed(2)}`;
  }
}

function applyPromo() {
  if (!promoInput) return;
  const code = promoInput.value.trim().toUpperCase();
  if (!code) { showToast('Enter a promo code first', true); return; }
  if (PROMO_CODES[code]) {
    appliedPromo = { code, ...PROMO_CODES[code] };
    localStorage.setItem('picklecraft_promo', JSON.stringify(appliedPromo));
    if (promoSuccessEl) promoSuccessEl.style.display = 'flex';
    if (promoLabelEl)   promoLabelEl.textContent = PROMO_CODES[code].label;
    promoInput.value = code;
    updateSummary();
    showToast('🎉 Promo code applied!');
  } else {
    showToast('Invalid promo code', true);
    promoInput.classList.add('error');
    setTimeout(() => promoInput.classList.remove('error'), 1500);
  }
}

function removePromo() {
  appliedPromo = null;
  localStorage.removeItem('picklecraft_promo');
  if (promoSuccessEl) promoSuccessEl.style.display = 'none';
  if (promoInput)     promoInput.value = '';
  updateSummary();
  showToast('Promo code removed');
}

function restorePromo() {
  if (!appliedPromo) return;
  if (promoInput)     promoInput.value = appliedPromo.code;
  if (promoSuccessEl) promoSuccessEl.style.display = 'flex';
  if (promoLabelEl)   promoLabelEl.textContent = appliedPromo.label;
}

function updateProgress(step) {
  document.querySelectorAll('.step').forEach((el, idx) => {
    const stepNum = idx + 1;
    el.classList.toggle('active',    stepNum === step);
    el.classList.toggle('completed', stepNum < step);
  });
}

function initProgressTracking() {
  const sections = [
    { id: 'sectionInfo', step: 1 },
    { id: 'sectionDelivery', step: 2 },
    { id: 'sectionPayment', step: 3 },
  ];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const found = sections.find(s => s.id === entry.target.id);
        if (found) updateProgress(found.step);
      }
    });
  }, { threshold: 0.4, rootMargin: '-68px 0px 0px 0px' });
  sections.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
}

const VALIDATORS = {
  fullName: v => v.trim().length >= 2   ? '' : 'Please enter your full name',
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email',
  phone:    v => /^[\d\s\+\-\(\)]{7,15}$/.test(v.trim()) ? '' : 'Enter a valid phone number',
  address:  v => v.trim().length >= 5   ? '' : 'Please enter your street address',
  city:     v => v.trim().length >= 2   ? '' : 'Enter your city',
  state:    v => v.trim().length >= 2   ? '' : 'Enter your state',
  pincode:  v => /^\d{6}$/.test(v.trim()) ? '' : 'Enter a valid 6-digit PIN code',
};

function validateField(input) {
  const validate = VALIDATORS[input.name];
  if (!validate) return true;
  const err = validate(input.value);
  const group = input.closest('.form-group');
  const existing = group?.querySelector('.field-error');
  if (existing) existing.remove();
  if (err) {
    input.classList.add('error');
    const span = document.createElement('span');
    span.className = 'field-error';
    span.textContent = err;
    group?.appendChild(span);
    return false;
  }
  input.classList.remove('error');
  return true;
}

function bindLiveValidation() {
  orderForm?.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(input);
    });
  });
}

function validateAll() {
  let valid = true;
  orderForm?.querySelectorAll('input, textarea').forEach(input => {
    if (!validateField(input)) valid = false;
  });
  return valid;
}

/* ─── Form Submit → Flask /api/order ─────────────────────── */
function initFormSubmit() {
  if (!orderForm) return;

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('Your cart is empty. Add items first.', true);
      return;
    }
    if (!validateAll()) {
      showToast('Please fix the errors above', true);
      const firstErr = orderForm.querySelector('.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const btn = orderForm.querySelector('.place-order-btn');
    const btnText = btn.querySelector('.btn-text');
    btn.classList.add('loading');
    btnText.textContent = 'Placing Order...';

    const { subtotal, discount, delivery, tax, total } = calcTotals();
    const selectedPayment = orderForm.querySelector('input[name="payment"]:checked')?.value || 'cod';

    const payload = {
      fullName:      document.getElementById('fullName')?.value.trim(),
      email:         document.getElementById('email')?.value.trim(),
      phone:         document.getElementById('phone')?.value.trim(),
      address:       document.getElementById('address')?.value.trim(),
      city:          document.getElementById('city')?.value.trim(),
      state:         document.getElementById('state')?.value.trim(),
      pincode:       document.getElementById('pincode')?.value.trim(),
      landmark:      document.getElementById('landmark')?.value.trim() || '',
      deliveryDate:  document.getElementById('deliveryDate')?.value || '',
      paymentMethod: selectedPayment,
      instructions:  document.getElementById('instructions')?.value.trim() || '',
      items:         cart,
      subtotal, discount, deliveryFee: delivery, tax, total,
      promoCode: appliedPromo?.code || '',
    };

    try {
      const res = await fetch(`${FLASK_URL}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.ok) {
        // Show modal with server-generated order ID
        if (orderIdEl) orderIdEl.textContent = result.data.orderId;

        // Clear cart & promo from localStorage
        localStorage.removeItem('picklecraft_cart');
        localStorage.removeItem('picklecraft_promo');
        cart = [];
        appliedPromo = null;

        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartCount();
      } else {
        showToast(result.message || 'Failed to place order', true);
      }
    } catch (err) {
      showToast('Could not connect to server. Is Flask running?', true);
    } finally {
      btn.classList.remove('loading');
      btnText.textContent = 'Place Order';
    }
  });
}

/* ─── Build form & summary HTML (same as original) ───────── */
function buildOrderForm() {
  if (!orderForm) return;
  orderForm.innerHTML = `
    <div class="form-card" id="sectionInfo">
      <div class="form-card-header"><div class="form-card-icon">👤</div><div><h3>Personal Information</h3><p>We'll use this to confirm your order</p></div></div>
      <div class="form-card-body">
        <div class="form-group"><label for="fullName">Full Name *</label><input type="text" id="fullName" name="fullName" required placeholder="Your full name" autocomplete="name"></div>
        <div class="form-row">
          <div class="form-group"><label for="email">Email *</label><input type="email" id="email" name="email" required placeholder="you@example.com" autocomplete="email"></div>
          <div class="form-group"><label for="phone">Phone *</label><input type="tel" id="phone" name="phone" required placeholder="+91 12345 67890" autocomplete="tel"></div>
        </div>
      </div>
    </div>
    <div class="form-card" id="sectionDelivery">
      <div class="form-card-header"><div class="form-card-icon">📍</div><div><h3>Delivery Address</h3><p>Where should we deliver?</p></div></div>
      <div class="form-card-body">
        <div class="form-group"><label for="address">Street Address *</label><textarea id="address" name="address" rows="2" required placeholder="House / flat no., street name"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label for="city">City *</label><input type="text" id="city" name="city" required placeholder="City"></div>
          <div class="form-group"><label for="state">State *</label><input type="text" id="state" name="state" required placeholder="State"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="pincode">PIN Code *</label><input type="text" id="pincode" name="pincode" required placeholder="6-digit PIN" maxlength="6" inputmode="numeric"></div>
          <div class="form-group"><label for="landmark">Landmark</label><input type="text" id="landmark" name="landmark" placeholder="Near… (optional)"></div>
        </div>
        <div class="form-group" style="margin-top:4px;">
          <label for="deliveryDate">Preferred Delivery Date</label>
          <div class="date-picker-wrapper"><input type="date" id="deliveryDate" name="deliveryDate"></div>
          <div class="delivery-note"><span>📦</span><span id="dateNote">We'll confirm availability by email.</span></div>
        </div>
      </div>
    </div>
    <div class="form-card" id="sectionProducts">
      <div class="form-card-header"><div class="form-card-icon">🥒</div><div><h3>Your Order</h3><p>Items pulled from your cart</p></div></div>
      <div class="form-card-body" style="padding-bottom:20px;">
        <div id="cartItemsArea"></div>
        <p style="margin-top:16px;font-size:12px;color:var(--brown-300);">Want to change items? <a href="cart.html" style="color:var(--green-600);font-weight:600;">Edit your cart →</a></p>
      </div>
    </div>
    <div class="form-card" id="sectionPayment">
      <div class="form-card-header"><div class="form-card-icon">💳</div><div><h3>Payment Method</h3><p>Choose how you'd like to pay</p></div></div>
      <div class="form-card-body">
        <div class="payment-options">
          <label class="payment-option"><input type="radio" name="payment" value="cod" checked><div class="payment-card"><span class="payment-icon">💵</span><div><strong>Cash on Delivery</strong><p>Pay when you receive</p></div></div></label>
          <label class="payment-option"><input type="radio" name="payment" value="upi"><div class="payment-card"><span class="payment-icon">📱</span><div><strong>UPI</strong><p>GPay · PhonePe · Paytm</p></div></div></label>
          <label class="payment-option"><input type="radio" name="payment" value="card"><div class="payment-card"><span class="payment-icon">💳</span><div><strong>Card Payment</strong><p>Credit / Debit</p></div></div></label>
          <label class="payment-option"><input type="radio" name="payment" value="netbanking"><div class="payment-card"><span class="payment-icon">🏦</span><div><strong>Net Banking</strong><p>All major banks</p></div></div></label>
        </div>
      </div>
    </div>
    <div class="form-card">
      <div class="form-card-header"><div class="form-card-icon">📝</div><div><h3>Special Instructions</h3><p>Optional delivery notes</p></div></div>
      <div class="form-card-body"><div class="form-group instructions-field"><textarea id="instructions" name="instructions" rows="3" placeholder="E.g. Leave at door, call before delivery…"></textarea></div></div>
    </div>
    <button type="submit" class="place-order-btn"><span class="btn-text">Place Order</span><span class="btn-icon">→</span></button>
  `;
}

function buildSummaryPanel() {
  const panel = document.querySelector('.order-summary');
  if (!panel) return;
  panel.innerHTML = `
    <h2 class="summary-title">Order Summary</h2>
    <div class="summary-items" id="summaryItems"><p class="summary-empty">No items yet</p></div>
    <div class="summary-divider"></div>
    <div class="summary-row"><span>Subtotal</span><span id="summarySubtotal">₹0.00</span></div>
    <div class="summary-row" id="summaryDiscountRow" style="display:none;"><span>Discount</span><span id="summaryDiscount" style="color:var(--green-600);font-weight:600;">-₹0.00</span></div>
    <div class="summary-row"><span>Delivery</span><span id="summaryDelivery">₹${DELIVERY_FEE.toFixed(2)}</span></div>
    <div class="summary-row"><span>Tax (5%)</span><span id="summaryTax">₹0.00</span></div>
    <div class="summary-divider"></div>
    <div class="summary-row total"><span>Total</span><span id="summaryTotal">₹${DELIVERY_FEE.toFixed(2)}</span></div>
    <div class="promo-section">
      <p class="promo-label">🏷️ Promo Code</p>
      <div class="promo-row">
        <input type="text" id="promoCodeInput" placeholder="e.g. PICKLE10" style="text-transform:uppercase;" autocomplete="off">
        <button type="button" id="applyPromoBtn" class="apply-promo-btn">Apply</button>
      </div>
      <div class="promo-success" id="promoSuccess" style="display:none;">
        <span>✅</span><span id="promoLabel"></span>
        <button type="button" id="promoRemove" class="promo-remove">Remove</button>
      </div>
    </div>
    <div class="delivery-info-list">
      <div class="info-row"><span>🚚</span><span>Free delivery on orders over <strong>₹50</strong></span></div>
      <div class="info-row"><span>⏱️</span><span>Delivered in <strong>3–5 business days</strong></span></div>
    </div>
    <div class="security-row"><span>🔒</span><div><strong>Secure Checkout</strong><p>Your data is always protected</p></div></div>
  `;
  bindPromoEvents();
}

function buildSuccessModal() {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  const existing = modal.querySelector('.modal-content');
  if (existing) {
    existing.innerHTML = `
      <div class="modal-success-icon">✅</div>
      <h2>Order Placed!</h2>
      <p>Thank you! We'll send a confirmation to your email shortly.</p>
      <div class="order-id-box"><p>Order ID</p><strong id="orderId">—</strong></div>
      <div class="modal-actions">
        <button class="modal-btn-primary" onclick="window.location.href='index.html'">Back to Home</button>
        <button class="modal-btn-secondary" onclick="window.location.href='products.html'">Shop More</button>
      </div>`;
  }
}

function buildProgressBar() {
  const section = document.querySelector('.order-section');
  if (!section) return;
  const bar = document.createElement('div');
  bar.className = 'order-progress';
  bar.innerHTML = `
    <div class="progress-steps">
      <div class="step active" data-step="1"><div class="step-bubble">1</div><span class="step-label">Your Info</span></div>
      <div class="step" data-step="2"><div class="step-bubble">2</div><span class="step-label">Delivery</span></div>
      <div class="step" data-step="3"><div class="step-bubble">3</div><span class="step-label">Payment</span></div>
    </div>`;
  section.insertAdjacentElement('beforebegin', bar);
}

function bindPromoEvents() {
  const applyBtn  = document.getElementById('applyPromoBtn');
  const removeBtn = document.getElementById('promoRemove');
  const codeInput = document.getElementById('promoCodeInput');
  if (applyBtn)  applyBtn.addEventListener('click',  applyPromo);
  if (removeBtn) removeBtn.addEventListener('click',  removePromo);
  if (codeInput) codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } });
}

let toastTimer;
function showToast(message, isError = false) {
  const t  = document.getElementById('toast');
  const tm = document.getElementById('toastMessage');
  if (!t || !tm) return;
  tm.textContent = message;
  t.classList.remove('toast-error');
  if (isError) t.classList.add('toast-error');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  createDrawer();
  updateCartCount();
  buildProgressBar();
  buildSummaryPanel();
  buildSuccessModal();
  buildOrderForm();
  renderOrderItems();
  updateSummary();
  initDatePicker();
  initProgressTracking();
  bindLiveValidation();
  initFormSubmit();
  restorePromo();
  updateSummary();
  document.getElementById('pincode')?.addEventListener('input', updateSummary);
});