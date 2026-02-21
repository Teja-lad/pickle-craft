/* ============================================================
   PICKLECRAFT — product.js
   Handles: sticky nav, mobile drawer, products render,
            filter, search, sort, add-to-cart, quick view
   ============================================================ */

/* ─── Products Data ─────────────────────────────────────────
   🖼️  TO ADD YOUR PHOTOS:
   Replace the `image` value in each product object.
   Use a relative path like "images/mango-pickle.jpg"
   Make sure your images folder is in the same directory.
   ─────────────────────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 1,
    name: "Classic Mango Pickle",
    category: "veg",
    price: 12.99,
    originalPrice: 15.99,
    weight: "250g",
    description: "Sun-dried raw mango pieces in a blend of aromatic spices and cold-pressed mustard oil. A family favourite since 1950.",
    tags: ["Tangy", "Spicy", "Traditional"],
    rating: 4.8,
    ratingCount: 248,
    badge: "bestseller",
    image:  "images/Mango-pickle.jpg" ,
    popular: 248
  },
  {
    id: 2,
    name: "Garlic Chilli Pickle",
    category: "veg",
    price: 11.49,
    originalPrice: null,
    weight: "200g",
    description: "Whole roasted garlic cloves with dried red chillies in vinegar brine. Bold, pungent and deeply satisfying.",
    tags: ["Pungent", "Hot", "Roasted"],
    rating: 4.6,
    ratingCount: 182,
    badge: "spicy",
    image:  "images/garlic-pickle.jpg" ,
    popular: 182
  },
  {
    id: 3,
    name: "Lemon Ginger Pickle",
    category: "veg",
    price: 10.99,
    originalPrice: null,
    weight: "250g",
    description: "Fresh lemon quarters with young ginger slices cured in rock salt and turmeric. Bright, zesty and digestive.",
    tags: ["Zesty", "Digestive", "Light"],
    rating: 4.7,
    ratingCount: 210,
    badge: "new",
    image: "images/lemon-pickle.png" ,
    popular: 210
  },
  {
    id: 4,
    name: "Mixed Vegetable Pickle",
    category: "veg",
    price: 13.49,
    originalPrice: 16.00,
    weight: "300g",
    description: "A colourful medley of carrot, turnip, cauliflower and green chilli in spiced mustard oil. Great with any meal.",
    tags: ["Colourful", "Mild", "Versatile"],
    rating: 4.5,
    ratingCount: 165,
    badge: null,
    image: "images/mixed-vegetable-pickle.jpg",    
    popular: 165
  },
  {
    id: 5,
    name: "Prawn Balchão Pickle",
    category: "non-veg",
    price: 17.99,
    originalPrice: 21.00,
    weight: "200g",
    description: "A fiery Goan-style pickle of small prawns in a tangy tomato-vinegar masala. Rich, bold and unforgettable.",
    tags: ["Goan", "Fiery", "Seafood"],
    rating: 4.9,
    ratingCount: 130,
    badge: "bestseller",
    image: "images/PrawnsPickle.jpg", 
  },
  {
    id: 6,
    name: "Chicken Pickle (Dry)",
    category: "non-veg",
    price: 18.99,
    originalPrice: null,
    weight: "250g",
    description: "Slow-cooked tender chicken pieces in a robust blend of whole spices and sesame oil. A beloved South Indian classic.",
    tags: ["South Indian", "Dry", "Hearty"],
    rating: 4.8,
    ratingCount: 195,
    badge: "new",
    image:  "images/chicken-pickle.jpg",
    popular: 195
  },
  {
    id: 7,
    name: "Green Chilli Pickle",
    category: "veg",
    price: 9.99,
    originalPrice: null,
    weight: "200g",
    description: "Whole green chillies stuffed with fennel and mustard seeds, preserved in mustard oil. A pickle lover's staple.",
    tags: ["Hot", "Stuffed", "Classic"],
    rating: 4.6,
    ratingCount: 145,
    badge: "spicy",
    image:  "images/green chilli-pickle.jpg",
    popular: 145
  },
  {
    id: 8,
    name: "Mutton Keema Pickle",
    category: "non-veg",
    price: 20.49,
    originalPrice: 24.00,
    weight: "200g",
    description: "Minced lamb cooked down with ginger, garlic and dried spices in a thick, intensely flavoured oil base.",
    tags: ["Rich", "Intense", "Minced"],
    rating: 4.7,
    ratingCount: 98,
    badge: null,
    image:  "images/mutton-pickle.jpg",
    popular: 98
  },
  {
    id: 9,
    name: "Amla (Gooseberry) Pickle",
    category: "veg",
    price: 11.99,
    originalPrice: null,
    weight: "250g",
    description: "Indian gooseberries preserved in sesame oil with turmeric and asafoetida. Tart, earthy and highly nutritious.",
    tags: ["Tart", "Nutritious", "Earthy"],
    rating: 4.4,
    ratingCount: 120,
    badge: "new",
    image: "images/amla-pickle.jpg",
    popular: 120
  }
];

/* ─── State ──────────────────────────────────────────────── */
let cart = JSON.parse(localStorage.getItem('picklecraft_cart')) || [];
let activeCategory = 'all';
let searchQuery = '';
let sortBy = 'default';

/* ─── DOM Refs ───────────────────────────────────────────── */
const header       = document.getElementById('header');
const hamburger    = document.getElementById('hamburger');
const cartCountEl  = document.getElementById('cartCount');
const productsGrid = document.getElementById('productsGrid');
const noResults    = document.getElementById('noResults');
const searchInput  = document.getElementById('searchInput');
const sortSelect   = document.getElementById('sortSelect');
const filterBtns   = document.querySelectorAll('.filter-btn');
const modal        = document.getElementById('quickViewModal');
const modalClose   = document.getElementById('modalClose');
const modalBody    = document.getElementById('modalBody');
const toastEl      = document.getElementById('toast');
const toastMsg     = document.getElementById('toastMessage');

/* ─── Sticky Nav: add shadow on scroll ───────────────────── */
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

/* ─── Mobile Drawer Setup ────────────────────────────────── */
function createDrawer() {
  // Build overlay
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawerOverlay';

  // Build drawer
  const drawer = document.createElement('nav');
  drawer.className = 'nav-drawer';
  drawer.id = 'navDrawer';

  const pages = [
    { href: 'index.html',    label: 'Home',     icon: '🏠' },
    { href: '#about',        label: 'About Us', icon: '📖' },
    { href: 'products.html', label: 'Pickles',  icon: '🥒', active: true },
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
        <span style="margin-left:auto; background:var(--green-600); color:#fff;
          font-size:11px; padding:2px 8px; border-radius:10px;" id="drawerCartCount">0</span>
      </a>
      <a href="login.html" class="drawer-nav-link">
        <span>👤</span> Login / Register
      </a>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  // Toggle drawer
  hamburger.addEventListener('click', () => toggleDrawer(true));
  document.getElementById('drawerClose').addEventListener('click', () => toggleDrawer(false));
  overlay.addEventListener('click', () => toggleDrawer(false));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleDrawer(false);
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

/* ─── Cart Helpers ───────────────────────────────────────── */
function saveCart() {
  localStorage.setItem('picklecraft_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = total;
  const drawerCount = document.getElementById('drawerCartCount');
  if (drawerCount) drawerCount.textContent = total;
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, name: product.name, price: product.price, qty: 1 });
  }
  saveCart();
  updateCartCount();
  showToast(`🥒 ${product.name} added to cart!`);
}

/* ─── Toast ──────────────────────────────────────────────── */
let toastTimer;
function showToast(message) {
  toastMsg.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ─── Star Rating Renderer ───────────────────────────────── */
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ─── Product Card Renderer ──────────────────────────────── */
function renderProductCard(product) {
  const badgeHTML = product.badge ? `
    <span class="product-badge badge-${product.badge}">
      ${product.badge === 'bestseller' ? 'Bestseller' : product.badge === 'new' ? 'New' : '🌶 Spicy'}
    </span>
  ` : '';

  const imageHTML = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
    : `
      <div class="image-placeholder">
        <div class="upload-icon-box">📷</div>
        <span>Your Photo Here</span>
      </div>
    `;

  const originalPriceHTML = product.originalPrice
    ? `<span class="price-original">₹${product.originalPrice.toFixed(2)}</span>`
    : '';

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-wrapper">
        ${imageHTML}
        ${badgeHTML}
        <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
      </div>
      <div class="product-info">
        <span class="product-category ${product.category === 'non-veg' ? 'non-veg' : ''}">
          ${product.category === 'veg' ? '🥬 Veg' : '🍖 Non-Veg'}
        </span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <span class="product-weight">${product.weight}</span>
        <div class="product-rating">
          <span class="stars" title="${product.rating} out of 5">${renderStars(product.rating)}</span>
          <span class="rating-count">(${product.ratingCount})</span>
        </div>
        <div class="product-footer">
          <div>
            <span class="product-price">₹${product.price.toFixed(2)}</span>
            ${originalPriceHTML}
          </div>
          <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `;
}

/* ─── Filter + Sort + Render Pipeline ───────────────────── */
function getFilteredProducts() {
  let result = [...PRODUCTS];

  // Category filter
  if (activeCategory !== 'all') {
    result = result.filter(p => p.category === activeCategory);
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort
  switch (sortBy) {
    case 'price-low':  result.sort((a, b) => a.price - b.price); break;
    case 'price-high': result.sort((a, b) => b.price - a.price); break;
    case 'name':       result.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'popular':    result.sort((a, b) => b.popular - a.popular); break;
    default: break; // Keep original order
  }

  return result;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  // Update results count (insert before grid if not already there)
  let countEl = document.querySelector('.results-count');
  if (!countEl) {
    countEl = document.createElement('p');
    countEl.className = 'results-count';
    productsGrid.parentNode.insertBefore(countEl, productsGrid);
  }
  countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${PRODUCTS.length}</strong> pickles`;

  if (filtered.length === 0) {
    productsGrid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';
  productsGrid.innerHTML = filtered.map(renderProductCard).join('');

  // Add entrance animation stagger
  const cards = productsGrid.querySelectorAll('.product-card');
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = `opacity 0.3s ease ${i * 0.04}s, transform 0.3s ease ${i * 0.04}s`;
    requestAnimationFrame(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  });

  // Bind "Add to Cart" buttons
  productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      addToCart(id);
      e.currentTarget.textContent = '✓ Added';
      e.currentTarget.classList.add('added');
      setTimeout(() => {
        e.currentTarget.textContent = 'Add to Cart';
        e.currentTarget.classList.remove('added');
      }, 1500);
    });
  });

  // Bind "Quick View" buttons
  productsGrid.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.dataset.id);
      openQuickView(id);
    });
  });
}

/* ─── Quick View Modal ───────────────────────────────────── */
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const imageHTML = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
    : `
      <div class="image-placeholder" style="width:100%;height:100%;">
        <div class="upload-icon-box" style="width:64px;height:64px;font-size:28px;">📷</div>
        <span>Your Photo Here</span>
      </div>
    `;

  const tagsHTML = product.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');
  const originalHTML = product.originalPrice
    ? `<span class="price-original" style="font-size:14px;">₹${product.originalPrice.toFixed(2)}</span>`
    : '';

  modalBody.innerHTML = `
    <div class="modal-image">${imageHTML}</div>
    <div class="modal-details">
      <span class="modal-category">${product.category === 'veg' ? '🥬 Vegetarian' : '🍖 Non-Vegetarian'}</span>
      <h2 class="modal-name">${product.name}</h2>
      <div style="display:flex;align-items:baseline;gap:8px;">
        <span class="modal-price">₹${product.price.toFixed(2)}</span>
        ${originalHTML}
      </div>
      <p class="modal-desc">${product.description}</p>
      <p style="font-size:12px;color:var(--brown-300);">Weight: ${product.weight}</p>
      <div class="product-rating">
        <span class="stars">${renderStars(product.rating)}</span>
        <span class="rating-count">${product.rating} (${product.ratingCount} reviews)</span>
      </div>
      <div class="modal-tags">${tagsHTML}</div>
      <button class="modal-add-btn" data-id="${product.id}">Add to Cart</button>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Bind modal add-to-cart
  modalBody.querySelector('.modal-add-btn').addEventListener('click', (e) => {
    const id = parseInt(e.currentTarget.dataset.id);
    addToCart(id);
    closeModal();
  });
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/* ─── Event Listeners ────────────────────────────────────── */
// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    renderProducts();
  });
});

// Search (with 300ms debounce)
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = searchInput.value;
    renderProducts();
  }, 300);
});

// Sort
sortSelect.addEventListener('change', () => {
  sortBy = sortSelect.value;
  renderProducts();
});

// Modal close
modalClose.addEventListener('click', closeModal);
document.getElementById('modalOverlay')?.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ─── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  createDrawer();
  updateCartCount();
  renderProducts();

});
