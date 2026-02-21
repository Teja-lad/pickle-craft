/* ============================================================
   PICKLECRAFT — index.js
   Home Page: sticky nav · mobile drawer · scroll animations
              cart count · CTA counter animation
   ============================================================ */

/* ─── DOM Refs ───────────────────────────────────────────── */
const header      = document.getElementById('header');
const hamburger   = document.getElementById('hamburger');
const cartCountEl = document.getElementById('cartCount');
const toastEl     = document.getElementById('toast');
const toastMsgEl  = document.getElementById('toastMessage');

/* ─── Sticky Nav: shadow on scroll ──────────────────────── */
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
    { href: 'index.html',    label: 'Home',     icon: '🏠', active: true },
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
        <a href="${p.href}" class="drawer-nav-link ${p.active ? 'active' : ''}">
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
      <a href="login.html" class="drawer-nav-link">
        <span>👤</span> Login / Register
      </a>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  hamburger.addEventListener('click', () => toggleDrawer(true));
  document.getElementById('drawerClose').addEventListener('click', () => toggleDrawer(false));
  overlay.addEventListener('click', () => toggleDrawer(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleDrawer(false);
  });

  // Smooth close on internal anchor links
  drawer.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => toggleDrawer(false));
  });
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
  const drawerCount = document.getElementById('drawerCartCount');
  if (drawerCount) drawerCount.textContent = total;
}

/* ─── Scroll-triggered Reveal Animations ────────────────── */
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.feature-card, .stat, .about-image, .cta-section, .about-text'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger sibling cards
        const siblings = [...entry.target.parentNode.children].filter(
          el => el.classList.contains(entry.target.className.split(' ')[0])
        );
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
}

/* ─── Animated Counter (stats) ──────────────────────────── */
function animateCounter(el, target, suffix = '') {
  const duration  = 1800;
  const start     = performance.now();
  const isDecimal = target % 1 !== 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = isDecimal
      ? (eased * target).toFixed(1)
      : Math.floor(eased * target);

    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const stats = document.querySelectorAll('.stat-number');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el   = entry.target;
        const text = el.textContent;
        // Parse out the number and suffix from e.g. "75+", "50k+", "15+"
        const num    = parseFloat(text.replace(/[^0-9.]/g, ''));
        const suffix = text.replace(/[0-9.]/g, '');
        animateCounter(el, num, suffix);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => counterObserver.observe(el));
}

/* ─── Hero: enhance with richer structure ───────────────── */
function enhanceHero() {
  // Wrap bare text spans in .hero-title into proper spans if not already done
  const title = document.querySelector('.hero-title');
  if (title) {
    // Add italic styling to "Tradition" if not already tagged
    title.innerHTML = title.innerHTML.replace(
      'Tradition', '<em>Tradition</em>'
    );
  }

  // Add eyebrow above hero content if not in HTML
  const heroContent = document.querySelector('.hero-content');
  if (heroContent && !document.querySelector('.hero-eyebrow')) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'hero-eyebrow reveal-text';
    eyebrow.innerHTML = '✦ &nbsp; Since 1950';
    heroContent.prepend(eyebrow);
  }

  // Replace placeholder text in hero image area
  const heroImage = document.querySelector('.hero-image');
  if (heroImage && !heroImage.querySelector('.hero-image-placeholder')) {
    heroImage.innerHTML = `
      <div>
      <img src="images/photo1.png" class="hero-img">
      </div>
      <div class="floating-badge badge-left">
        <span>🌿</span>
        <div>
          <strong style="font-size:13px;display:block;">100% Natural</strong>
          <span style="font-size:11px;color:var(--brown-300);">No preservatives</span>
        </div>
      </div>
      <div class="floating-badge badge-right">
        <span>⭐</span>
        <div>
          <strong style="font-size:13px;display:block;">4.9 / 5 Stars</strong>
          <span style="font-size:11px;color:var(--brown-300);">50k+ reviews</span>
        </div>
      </div>
    `;
  }
}

/* ─── About Section: add image frame if not present ─────── */
function enhanceAbout() {
  const aboutImage = document.querySelector('.about-image');
  if (aboutImage && !aboutImage.querySelector('.image-frame')) {
    aboutImage.innerHTML = `
      <div class="image-frame">
      <img src="images/about1.jpg" class="about1-img">
        </div>
        <div class="about-badge">
          <div class="badge-year">1950</div>
          <div class="badge-label">Est. Year</div>
        </div>
      </div>
    `;
  }
}

/* ─── CTA section: inject tag line ──────────────────────── */
function enhanceCTA() {
  const cta = document.querySelector('.cta-section .container');
  if (cta && !document.querySelector('.cta-tag')) {
    const tag = document.createElement('div');
    tag.className = 'cta-tag';
    tag.textContent = '🎁 First Order Offer';
    cta.prepend(tag);
  }
}

/* ─── Toast ──────────────────────────────────────────────── */
let toastTimer;
function showToast(message) {
  if (!toastEl) return;
  toastMsgEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  createDrawer();
  updateCartCount();
  enhanceHero();
  enhanceAbout();
  enhanceCTA();
  initScrollReveal();
  initCounters();
});