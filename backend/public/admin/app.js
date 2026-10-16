// Superlight Admin Dashboard App

const API_BASE = '/api';
let authToken = localStorage.getItem('superlight_admin_token') || null;
let currentAdmin = null;
try {
  const cachedAdmin = localStorage.getItem('superlight_admin_user');
  if (cachedAdmin) currentAdmin = JSON.parse(cachedAdmin);
} catch (e) {}
let allCategories = [];
let allProducts = [];
let allBrands = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  setupEventListeners();

  if (authToken) {
    // Show dashboard immediately - no flash of login screen!
    showApp();
    // Validate session in background
    verifySession();
  } else {
    showLogin();
  }
});

function setupEventListeners() {
  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Tab navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Product Search & Filter
  const prodSearch = document.getElementById('productSearchInput');
  const prodFilter = document.getElementById('productCategoryFilter');
  if (prodSearch) {
    prodSearch.addEventListener('input', debounce(loadProducts, 300));
  }
  if (prodFilter) {
    prodFilter.addEventListener('change', loadProducts);
    setupModernSelect(prodFilter);
  }
  initAllModernSelects();

  // Product Modals
  document.getElementById('openAddProductModalBtn')?.addEventListener('click', () => openProductModal());
  document.getElementById('productForm')?.addEventListener('submit', handleSaveProduct);
  document.getElementById('prodFormMainCategory')?.addEventListener('change', handleProductMainCategoryChange);
  document.getElementById('prodImagesFileInput')?.addEventListener('change', handleProductImageFilesUpload);
  const prodModalEl = document.getElementById('productModal');
  if (prodModalEl) {
    prodModalEl.addEventListener('click', (e) => {
      if (e.target === prodModalEl) closeProductModal();
    });
  }

  // Category Modals
  document.getElementById('openAddCategoryModalBtn')?.addEventListener('click', () => openCategoryModal());
  document.getElementById('categoryForm')?.addEventListener('submit', handleSaveCategory);
  document.getElementById('addSubCatBtn')?.addEventListener('click', addModalSubcategory);
  document.getElementById('subCategoryForm')?.addEventListener('submit', handleSaveSubCategory);

  // Brand Modals & Form
  document.getElementById('openAddBrandModalBtn')?.addEventListener('click', () => openBrandModal());
  document.getElementById('brandForm')?.addEventListener('submit', handleSaveBrand);

  const brandSearch = document.getElementById('brandSearchInput');
  if (brandSearch) {
    brandSearch.addEventListener('input', debounce(filterBrands, 250));
  }

  const brandNameInput = document.getElementById('brandFormName');
  const brandSlugInput = document.getElementById('brandFormSlug');
  if (brandNameInput && brandSlugInput) {
    brandNameInput.addEventListener('input', () => {
      if (!document.getElementById('brandFormId').value) {
        brandSlugInput.value = slugify(brandNameInput.value);
      }
    });
  }

  const brandModal = document.getElementById('brandModal');
  if (brandModal) {
    brandModal.addEventListener('click', (e) => {
      if (e.target === brandModal) closeBrandModal();
    });
  }

  // Subcategories Popup Modal backdrop close
  const subcatModal = document.getElementById('subcategoriesPopupModal');
  if (subcatModal) {
    subcatModal.addEventListener('click', (e) => {
      if (e.target === subcatModal) closeSubcategoriesPopup();
    });
  }

  // Auto-slug generator for Category Form
  const catNameInput = document.getElementById('catFormName');
  const catSlugInput = document.getElementById('catFormSlug');
  if (catNameInput && catSlugInput) {
    catNameInput.addEventListener('input', () => {
      if (!document.getElementById('catFormId').value) {
        catSlugInput.value = slugify(catNameInput.value);
      }
    });
  }

  // Auto-slug generator & Enter key for Modal Subcategory inputs
  const subNameInput = document.getElementById('subCatInputName');
  const subSlugInput = document.getElementById('subCatInputSlug');
  if (subNameInput && subSlugInput) {
    subNameInput.addEventListener('input', () => {
      subSlugInput.value = slugify(subNameInput.value);
    });
    subNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addModalSubcategory();
      }
    });
    subSlugInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addModalSubcategory();
      }
    });
  }

  // Auto-slug generator for Single Subcategory Modal
  const singleSubName = document.getElementById('singleSubCatName');
  const singleSubSlug = document.getElementById('singleSubCatSlug');
  if (singleSubName && singleSubSlug) {
    singleSubName.addEventListener('input', () => {
      if (!document.getElementById('singleSubCatId').value) {
        singleSubSlug.value = slugify(singleSubName.value);
      }
    });
  }

  // Auto-slug generator for Subcategories Popup Modal
  const popupSubName = document.getElementById('popupSubcatName');
  const popupSubSlug = document.getElementById('popupSubcatSlug');
  if (popupSubName && popupSubSlug) {
    popupSubName.addEventListener('input', () => {
      popupSubSlug.value = slugify(popupSubName.value);
    });
  }
}

// Check stored session
async function verifySession() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      return;
    }
    const data = await res.json();
    if (data.success && data.user) {
      currentAdmin = data.user;
      localStorage.setItem('superlight_admin_user', JSON.stringify(currentAdmin));
      renderAdminProfile();
    } else {
      handleLogout();
    }
  } catch (err) {
    console.error('Session verify error:', err);
  }
}

// Login Handler
async function handleLogin(e) {
  e.preventDefault();
  loginAlert.style.display = 'none';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerText = 'Verifying...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success && data.token) {
      authToken = data.token;
      currentAdmin = data.user;
      localStorage.setItem('superlight_admin_token', authToken);
      localStorage.setItem('superlight_admin_user', JSON.stringify(currentAdmin));
      document.documentElement.classList.add('auth-verified');
      showToast(`Welcome back, ${currentAdmin.name}!`, 'success');
      showApp();
    } else {
      loginAlert.innerText = data.message || 'Invalid email or password.';
      loginAlert.style.display = 'block';
    }
  } catch (err) {
    loginAlert.innerText = 'Failed to connect to the backend server.';
    loginAlert.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Sign In to Dashboard</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
  }
}

function handleLogout() {
  authToken = null;
  currentAdmin = null;
  localStorage.removeItem('superlight_admin_token');
  localStorage.removeItem('superlight_admin_user');
  localStorage.removeItem('superlight_admin_tab');
  document.documentElement.classList.remove('auth-verified');
  const adminName = document.getElementById('adminName');
  const adminEmail = document.getElementById('adminEmail');
  const adminAvatar = document.getElementById('adminAvatar');
  if (adminName) adminName.innerText = '';
  if (adminEmail) adminEmail.innerText = '';
  if (adminAvatar) adminAvatar.innerText = '--';
  showLogin();
  showToast('Logged out successfully.', 'info');
}

function showLogin() {
  document.documentElement.classList.remove('auth-verified');
  loginScreen.style.display = 'flex';
  adminApp.style.display = 'none';
}

function renderAdminProfile() {
  if (currentAdmin) {
    const adminName = document.getElementById('adminName');
    const adminEmail = document.getElementById('adminEmail');
    const adminAvatar = document.getElementById('adminAvatar');
    if (adminName) adminName.innerText = currentAdmin.name || 'Admin';
    if (adminEmail) adminEmail.innerText = currentAdmin.email || '';
    if (adminAvatar) {
      const parts = (currentAdmin.name || 'Admin').trim().split(/\s+/);
      const initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
      adminAvatar.innerText = initials || 'A';
    }
  }
}

function showApp() {
  document.documentElement.classList.add('auth-verified');
  loginScreen.style.display = 'none';
  adminApp.style.display = 'flex';

  renderAdminProfile();

  // Load initial datasets
  loadCategories();
  loadBrands();
  loadDashboardStats();
  checkCloudinaryStatus();

  const savedTab = localStorage.getItem('superlight_admin_tab') || 'dashboard';
  switchTab(savedTab);
}

async function checkCloudinaryStatus() {
  const badge = document.getElementById('cloudinaryStatusBadge');
  const text = document.getElementById('cloudinaryBadgeText');
  const syncBtn = document.getElementById('syncCloudinaryBtn');
  if (!badge || !text) return;

  try {
    const res = await fetch(`${API_BASE}/cloudinary/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success && data.configured) {
      badge.className = 'storage-badge active';
      text.innerText = `☁️ Cloudinary: Active (${data.cloud_name})`;
      badge.title = `Cloudinary Storage is connected. Uploads are stored and served via Cloudinary CDN (${data.cloud_name}).`;
      if (syncBtn) {
        syncBtn.style.display = 'inline-flex';
        syncBtn.onclick = handleSyncCloudinary;
      }
    } else {
      badge.className = 'storage-badge pending';
      text.innerText = `☁️ Cloudinary: Keys Needed`;
      badge.title = 'Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env to activate Cloudinary CDN storage.';
      if (syncBtn) syncBtn.style.display = 'none';
    }
  } catch (e) {
    badge.style.display = 'none';
    if (syncBtn) syncBtn.style.display = 'none';
  }
}

async function handleSyncCloudinary() {
  const syncBtn = document.getElementById('syncCloudinaryBtn');
  if (!syncBtn) return;

  const confirmed = confirm('This will upload all local product & brand pictures to your Cloudinary storage and update database URLs to the Cloudinary CDN. Proceed?');
  if (!confirmed) return;

  const originalHtml = syncBtn.innerHTML;
  syncBtn.disabled = true;
  syncBtn.innerHTML = `<span>Syncing to Cloudinary...</span>`;
  showToast('Starting Cloudinary image sync...', 'info');

  try {
    const res = await fetch(`${API_BASE}/cloudinary/migrate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Sync complete! Uploaded ${data.filesMigrated || 0} images and updated ${data.productsMigrated || 0} products.`, 'success');
      loadProducts();
      loadBrands();
    } else {
      showToast(data.message || 'Sync failed.', 'error');
    }
  } catch (err) {
    showToast('Error syncing images to Cloudinary.', 'error');
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = originalHtml;
  }
}

// Switch navigation tabs
function switchTab(tabId) {
  const validTabs = ['dashboard', 'products', 'categories', 'brands', 'orders', 'inquiries'];
  if (!validTabs.includes(tabId)) tabId = 'dashboard';
  localStorage.setItem('superlight_admin_tab', tabId);

  // Clean URL to ensure no # hash appears in address bar
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // Update sidebar active
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
  });

  // Update pane
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const activePane = document.getElementById(`tab-${tabId}`);
  if (activePane) activePane.classList.add('active');

  // Update Page Title
  const titles = {
    dashboard: 'Dashboard Overview',
    products: 'Products Catalog',
    categories: 'Product Categories',
    brands: 'Brand Partners & Manufacturers',
    orders: 'Customer Orders',
    inquiries: 'Inquiries & Leads'
  };
  pageTitle.innerText = titles[tabId] || 'Dashboard';

  // Load data for selected tab
  if (tabId === 'dashboard') loadDashboardStats();
  if (tabId === 'products') loadProducts();
  if (tabId === 'categories') loadCategories();
  if (tabId === 'brands') loadBrands();
  if (tabId === 'orders') loadOrders();
  if (tabId === 'inquiries') loadInquiries();

  // Close mobile sidebar if open
  document.querySelector('.sidebar')?.classList.remove('open');
}

/* ==========================================================================
   TAB 1: DASHBOARD
   ========================================================================== */
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!data.success) return;

    const { stats } = data;
    document.getElementById('statTotalProducts').innerText = stats.totalProducts;
    document.getElementById('statTotalOrders').innerText = stats.totalOrders;
    document.getElementById('statTotalRevenue').innerText = `AED ${stats.totalRevenue.toLocaleString()}`;
    document.getElementById('statUnreadInquiries').innerText = stats.unreadInquiries;

    const unreadBadge = document.getElementById('unreadBadge');
    if (unreadBadge) {
      unreadBadge.innerText = stats.unreadInquiries;
      unreadBadge.style.display = stats.unreadInquiries > 0 ? 'inline-block' : 'none';
    }

    // Populate Recent Orders Table
    const ordersTbody = document.getElementById('dashboardOrdersTable');
    if (ordersTbody) {
      if (stats.recentOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No orders recorded yet.</td></tr>`;
      } else {
        ordersTbody.innerHTML = stats.recentOrders.map(ord => `
          <tr>
            <td><strong>${ord.order_number}</strong></td>
            <td>${escapeHtml(ord.customer_name || 'Customer')}</td>
            <td><strong>AED ${Number(ord.total_amount || 0).toFixed(2)}</strong></td>
            <td><span class="status-chip ${(ord.status || 'pending').toLowerCase()}">${ord.status || 'Pending'}</span></td>
            <td>${ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `).join('');
      }
    }

    // Category Breakdown list (Main categories only)
    const catList = document.getElementById('categoryBreakdownList');
    if (catList && stats.categoryBreakdown) {
      const mainCategories = stats.categoryBreakdown.filter(item => !item.parent_id);
      if (mainCategories.length === 0) {
        catList.innerHTML = `<div class="text-muted text-center" style="padding: 24px; font-size: 13px;">No categories created yet.</div>`;
      } else {
        catList.innerHTML = mainCategories.map(item => `
          <div class="category-breakdown-item">
            <span class="cat-name-wrap">${escapeHtml(item.name)}</span>
            <span class="cat-count-badge">${item.product_count} product${item.product_count === 1 ? '' : 's'}</span>
          </div>
        `).join('');
      }
    }

  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

/* ==========================================================================
   TAB 2: PRODUCTS
   ========================================================================== */
async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  const search = document.getElementById('productSearchInput')?.value.trim() || '';
  const catId = document.getElementById('productCategoryFilter')?.value || '';

  try {
    let url = `${API_BASE}/products?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (catId) url += `category_id=${catId}&`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      allProducts = data.products;
      if (allProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:32px;">No products found matching criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = allProducts.map(p => `
        <tr>
          <td style="text-align:center; vertical-align:middle;">
            <img src="${escapeHtml(p.image || '/prod_downlight_1791451418016.png')}" class="table-thumb" alt="${escapeHtml(p.name)}" onerror="this.onerror=null; this.src='/prod_downlight_1791451418016.png';" />
          </td>
          <td style="vertical-align:middle;">
            <div class="product-title-wrap">
              <div class="product-title-name">${escapeHtml(p.name)}</div>
              <div class="product-badges-row">
                ${p.is_featured ? '<span class="status-chip completed" style="font-size:10px; padding:2px 7px;">Featured</span>' : ''}
                ${p.is_bestseller ? '<span class="status-chip" style="font-size:10px; padding:2px 7px; background:#fff7ed; color:#ea580c; border:1px solid #fed7aa;">Best Seller</span>' : ''}
              </div>
            </div>
          </td>
          <td style="vertical-align:middle;">
            <span class="product-brand-chip">${escapeHtml(p.brand || '—')}</span>
          </td>
          <td style="vertical-align:middle;">
            <div class="product-cat-name">${escapeHtml(p.category_name || 'Uncategorized')}</div>
            ${p.subcategory_name ? `<div class="product-subcat-name">↳ ${escapeHtml(p.subcategory_name)}</div>` : ''}
          </td>
          <td style="vertical-align:middle;">
            <div class="product-price-cell">
              <div class="product-price-current">AED ${(typeof p.price === 'number' ? p.price : parseFloat(p.price || 0)).toFixed(2)}</div>
              ${p.old_price ? `<div class="product-price-old">AED ${parseFloat(p.old_price).toFixed(2)}</div>` : ''}
            </div>
          </td>
          <td style="text-align:right; vertical-align:middle; white-space:nowrap;">
            <button class="btn-icon" title="Edit Product" onclick="openProductModal(${p.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon delete" title="Delete Product" onclick="deleteProduct(${p.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading products:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#ef4444; padding:32px;">Failed to load products.</td></tr>`;
  }
}

// Global state for product modal images (up to 4 pictures)
let currentProductImages = [];

function renderProductImagesGrid() {
  const container = document.getElementById('prodImagesGrid');
  if (!container) return;

  let html = '';
  for (let i = 0; i < 4; i++) {
    const imgUrl = currentProductImages[i];
    if (imgUrl) {
      html += `
        <div class="prod-image-slot has-image">
          <img src="${escapeHtml(imgUrl)}" class="prod-image-slot-thumb" alt="Product image ${i+1}" onerror="this.onerror=null; this.src='/prod_downlight_1791451418016.png';" />
          <span class="prod-slot-badge ${i === 0 ? 'primary' : ''}">${i === 0 ? 'Cover Image' : `Photo ${i+1}`}</span>
          <button type="button" class="prod-slot-delete-btn" onclick="removeProductImage(${i})" title="Remove image">&times;</button>
        </div>
      `;
    } else {
      html += `
        <div class="prod-image-slot empty-slot" onclick="triggerProductImageUpload(${i})" title="Click to upload picture for Slot ${i+1}">
          <svg class="prod-slot-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span class="prod-slot-upload-text">+ Add Picture</span>
          <span style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">Slot ${i+1} of 4</span>
        </div>
      `;
    }
  }
  container.innerHTML = html;
}

window.triggerProductImageUpload = function(slotIndex) {
  const fileInput = document.getElementById('prodImagesFileInput');
  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
};

window.removeProductImage = function(index) {
  currentProductImages.splice(index, 1);
  renderProductImagesGrid();
};

async function handleProductImageFilesUpload(e) {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const availableSlots = 4 - currentProductImages.length;
  if (availableSlots <= 0) {
    showToast('Maximum 4 pictures allowed per product.', 'error');
    return;
  }

  const uploadFiles = files.slice(0, availableSlots);
  if (files.length > availableSlots) {
    showToast(`Only ${availableSlots} more image(s) can be added (max 4).`, 'info');
  }

  const formData = new FormData();
  uploadFiles.forEach(file => {
    formData.append('images', file);
  });

  const uploadBtn = document.getElementById('prodUploadTriggerBtn');
  if (uploadBtn) uploadBtn.disabled = true;

  try {
    showToast('Uploading picture(s)...', 'info');
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      const urls = data.urls || (data.imageUrl ? [data.imageUrl] : []);
      urls.forEach(u => {
        if (currentProductImages.length < 4) {
          currentProductImages.push(u);
        }
      });
      renderProductImagesGrid();
      showToast(`${urls.length} picture(s) uploaded successfully!`, 'success');
    } else {
      showToast(data.message || 'Image upload failed.', 'error');
    }
  } catch (err) {
    showToast('Error uploading images to server.', 'error');
  } finally {
    if (uploadBtn) uploadBtn.disabled = false;
    e.target.value = '';
  }
}

/* ==========================================================================
   MODERN CUSTOM DROPDOWN COMPONENT (All Admin Selects)
   ========================================================================== */

function setupModernSelect(selectEl) {
  if (!selectEl || selectEl.tagName !== 'SELECT') return null;

  // If already wrapped or existing, return and sync
  let wrapper = selectEl.nextElementSibling;
  if (wrapper && wrapper.classList.contains('modern-select-box')) {
    syncModernSelect(selectEl);
    return wrapper;
  }

  // Hide the native select visually while keeping it accessible in the DOM
  selectEl.classList.add('modern-select-native');
  selectEl.tabIndex = -1;
  // Remove native required attribute to prevent browser tooltip collision with custom select
  if (selectEl.hasAttribute('required')) {
    selectEl.setAttribute('data-was-required', 'true');
    selectEl.removeAttribute('required');
  }

  wrapper = document.createElement('div');
  wrapper.className = 'modern-select-box';
  wrapper.setAttribute('data-target-id', selectEl.id || '');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'modern-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.className = 'modern-select-label';

  const chevron = document.createElement('span');
  chevron.className = 'modern-select-chevron';
  chevron.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  trigger.appendChild(label);
  trigger.appendChild(chevron);

  const menu = document.createElement('div');
  menu.className = 'modern-select-menu';
  menu.setAttribute('role', 'listbox');

  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);

  // Place immediately after native select
  selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);

  // Toggle dropdown on trigger click
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectEl.disabled) return;

    const isOpen = wrapper.classList.contains('is-open');
    closeAllModernSelects();
    if (!isOpen) {
      wrapper.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  // Keep synced if native select changes programmatically
  selectEl.addEventListener('change', () => {
    syncModernSelect(selectEl);
  });

  syncModernSelect(selectEl);
  return wrapper;
}

function syncModernSelect(selectEl) {
  if (!selectEl) return;
  let wrapper = selectEl.nextElementSibling;
  if (!wrapper || !wrapper.classList.contains('modern-select-box')) {
    setupModernSelect(selectEl);
    return;
  }

  const trigger = wrapper.querySelector('.modern-select-trigger');
  const label = wrapper.querySelector('.modern-select-label');
  const menu = wrapper.querySelector('.modern-select-menu');
  if (!trigger || !label || !menu) return;

  // Handle disabled state
  if (selectEl.disabled) {
    wrapper.classList.add('is-disabled');
    trigger.disabled = true;
  } else {
    wrapper.classList.remove('is-disabled');
    trigger.disabled = false;
  }

  // Populate options from native select
  const options = Array.from(selectEl.options);
  const curVal = selectEl.value;
  const selectedOption = selectEl.selectedOptions[0] || options.find(o => o.value === curVal) || options[0];

  const labelText = selectedOption ? selectedOption.textContent.trim() : (selectEl.getAttribute('placeholder') || 'Select option');
  label.textContent = labelText;

  if (!selectedOption || !selectedOption.value) {
    label.classList.add('is-placeholder');
  } else {
    label.classList.remove('is-placeholder');
  }

  menu.innerHTML = '';
  options.forEach((opt, idx) => {
    const item = document.createElement('div');
    item.className = 'modern-select-item';
    item.setAttribute('role', 'option');
    item.setAttribute('data-value', opt.value);

    const isSelected = (opt.value === curVal) || (curVal === '' && idx === 0 && !opt.value);
    if (isSelected) {
      item.classList.add('is-selected');
      item.setAttribute('aria-selected', 'true');
    }

    const itemText = document.createElement('span');
    itemText.className = 'modern-select-item-text';
    itemText.textContent = opt.textContent;
    item.appendChild(itemText);

    if (opt.value) {
      const checkIcon = document.createElement('span');
      checkIcon.className = 'modern-select-check';
      checkIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      item.appendChild(checkIcon);
    }

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const prevVal = selectEl.value;
      selectEl.value = opt.value;
      wrapper.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');

      if (prevVal !== opt.value) {
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncModernSelect(selectEl);
    });

    menu.appendChild(item);
  });
}

function closeAllModernSelects() {
  document.querySelectorAll('.modern-select-box.is-open').forEach(box => {
    box.classList.remove('is-open');
    const trigger = box.querySelector('.modern-select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function initAllModernSelects() {
  document.querySelectorAll('select').forEach(setupModernSelect);
}

// Global click outside listener
document.addEventListener('click', (e) => {
  if (!e.target.closest('.modern-select-box')) {
    closeAllModernSelects();
  }
});

// Global Escape listener
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModernSelects();
  }
});

// Form reset listener
document.addEventListener('reset', (e) => {
  setTimeout(() => {
    if (e.target && e.target.querySelectorAll) {
      e.target.querySelectorAll('select').forEach(syncModernSelect);
    }
  }, 10);
});

function updateProductBrandDropdown(selectedBrandName = '') {
  const brandSelect = document.getElementById('prodFormBrand');
  if (!brandSelect) return;

  let optHtml = '<option value="">Select Brand</option>';
  allBrands.forEach(b => {
    const isSelected = selectedBrandName && (selectedBrandName.toLowerCase() === b.name.toLowerCase());
    optHtml += `<option value="${escapeHtml(b.name)}" ${isSelected ? 'selected' : ''}>${escapeHtml(b.name)}</option>`;
  });
  brandSelect.innerHTML = optHtml;
  syncModernSelect(brandSelect);
}

function updateProductCategoryDropdowns(selectedMainCatId = null, selectedSubCatId = null) {
  const mainCatSelect = document.getElementById('prodFormMainCategory');
  if (!mainCatSelect) return;

  // Main categories (where parent_id is null/empty)
  const mainCategories = allCategories.filter(c => !c.parent_id);
  let mainHtml = '<option value="">Select Main Category</option>';
  mainCategories.forEach(c => {
    const isSelected = selectedMainCatId && (parseInt(selectedMainCatId) === c.id);
    mainHtml += `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`;
  });
  mainCatSelect.innerHTML = mainHtml;
  syncModernSelect(mainCatSelect);

  // Populate subcategories for currently selected main category
  populateProductSubcategories(selectedMainCatId || mainCatSelect.value, selectedSubCatId);
}

function populateProductSubcategories(mainCatId, selectedSubCatId = null) {
  const subCatSelect = document.getElementById('prodFormSubCategory');
  if (!subCatSelect) return;

  if (!mainCatId) {
    subCatSelect.innerHTML = '<option value="">Select Sub Category (Optional)</option>';
    subCatSelect.disabled = true;
    syncModernSelect(subCatSelect);
    return;
  }

  const mainCat = allCategories.find(c => c.id === parseInt(mainCatId));
  const subcategories = mainCat?.subcategories || [];

  if (subcategories.length === 0) {
    subCatSelect.innerHTML = '<option value="">No subcategories available</option>';
    subCatSelect.disabled = true;
  } else {
    subCatSelect.disabled = false;
    let subHtml = '<option value="">Select Sub Category (Optional)</option>';
    subcategories.forEach(s => {
      const isSelected = selectedSubCatId && (parseInt(selectedSubCatId) === s.id);
      subHtml += `<option value="${s.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(s.name)}</option>`;
    });
    subCatSelect.innerHTML = subHtml;
  }
  syncModernSelect(subCatSelect);
}

function handleProductMainCategoryChange() {
  const mainCatId = document.getElementById('prodFormMainCategory')?.value;
  populateProductSubcategories(mainCatId);
}

async function openProductModal(productId = null) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');
  if (!modal || !form) return;
  form.reset();
  currentProductImages = [];

  // Ensure fresh brands and categories
  if (allBrands.length === 0) await loadBrands();
  if (allCategories.length === 0) await loadCategories();

  if (productId) {
    title.innerText = 'Edit Product';
    const prod = allProducts.find(p => p.id === productId);
    if (prod) {
      document.getElementById('prodFormId').value = prod.id;
      document.getElementById('prodFormName').value = prod.name || '';
      
      updateProductBrandDropdown(prod.brand);
      updateProductCategoryDropdowns(prod.category_id, prod.subcategory_id);

      document.getElementById('prodFormPrice').value = prod.price !== undefined ? prod.price : '';
      document.getElementById('prodFormOldPrice').value = prod.old_price || '';
      document.getElementById('prodFormWarranty').value = prod.warranty || '';
      document.getElementById('prodFormWattage').value = prod.wattage || '';
      document.getElementById('prodFormModel').value = prod.model || '';
      document.getElementById('prodFormDesc').value = prod.description || '';
      document.getElementById('prodFormFeatured').checked = prod.is_featured === 1;
      document.getElementById('prodFormBestseller').checked = prod.is_bestseller === 1;

      if (Array.isArray(prod.images) && prod.images.length > 0) {
        currentProductImages = [...prod.images.slice(0, 4)];
      } else if (prod.image) {
        currentProductImages = [prod.image];
      }
    }
  } else {
    title.innerText = 'Add New Product';
    document.getElementById('prodFormId').value = '';
    updateProductBrandDropdown();
    updateProductCategoryDropdowns();
    document.getElementById('prodFormBestseller').checked = false;
    document.getElementById('prodFormFeatured').checked = false;
  }

  renderProductImagesGrid();
  modal.style.display = 'flex';
  document.getElementById('prodFormName')?.focus();
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.style.display = 'none';
  currentProductImages = [];
  closeAllModernSelects();
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodFormId').value;
  const name = document.getElementById('prodFormName').value.trim();
  const brand = document.getElementById('prodFormBrand').value.trim();
  const mainCatVal = document.getElementById('prodFormMainCategory').value;
  const subCatVal = document.getElementById('prodFormSubCategory').value;
  const priceVal = document.getElementById('prodFormPrice').value;
  const oldPriceVal = document.getElementById('prodFormOldPrice').value;
  const warranty = document.getElementById('prodFormWarranty').value.trim();
  const wattage = document.getElementById('prodFormWattage').value.trim();
  const model = document.getElementById('prodFormModel').value.trim();
  const description = document.getElementById('prodFormDesc').value.trim();
  const is_featured = document.getElementById('prodFormFeatured').checked ? 1 : 0;
  const is_bestseller = document.getElementById('prodFormBestseller').checked ? 1 : 0;

  if (!name) {
    showToast('Product name is required.', 'error');
    document.getElementById('prodFormName')?.focus();
    return;
  }
  if (!brand) {
    showToast('Please select a brand from the dropdown.', 'error');
    const brandTrigger = document.querySelector('[data-target-id="prodFormBrand"] .modern-select-trigger');
    if (brandTrigger) {
      brandTrigger.focus();
      brandTrigger.classList.add('is-invalid');
      setTimeout(() => brandTrigger.classList.remove('is-invalid'), 2500);
    }
    return;
  }
  if (!mainCatVal) {
    showToast('Please select a main category.', 'error');
    const catTrigger = document.querySelector('[data-target-id="prodFormMainCategory"] .modern-select-trigger');
    if (catTrigger) {
      catTrigger.focus();
      catTrigger.classList.add('is-invalid');
      setTimeout(() => catTrigger.classList.remove('is-invalid'), 2500);
    }
    return;
  }
  if (priceVal === '' || isNaN(parseFloat(priceVal))) {
    showToast('Please enter a valid price.', 'error');
    return;
  }

  // Set primary image
  const primaryImage = currentProductImages.length > 0 ? currentProductImages[0] : '/prod_downlight_1791451418016.png';

  const payload = {
    name,
    brand,
    category_id: parseInt(mainCatVal),
    subcategory_id: subCatVal ? parseInt(subCatVal) : null,
    price: parseFloat(priceVal),
    old_price: oldPriceVal ? parseFloat(oldPriceVal) : null,
    warranty,
    wattage,
    model,
    images: currentProductImages.length > 0 ? currentProductImages : [primaryImage],
    image: primaryImage,
    description,
    is_featured,
    is_bestseller
  };

  const saveBtn = document.getElementById('saveProductBtn');
  if (saveBtn) saveBtn.disabled = true;

  try {
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(id ? 'Product updated successfully.' : 'Product created successfully!', 'success');
      closeProductModal();
      loadProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Error saving product.', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend server.', 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function deleteProduct(id) {
  const prod = allProducts.find(p => p.id === id);
  const prodName = prod ? ` "${prod.name}"` : '';
  const confirmed = await showDeleteConfirm({
    title: 'Delete Product',
    message: `Are you sure you want to permanently delete${prodName}? This action cannot be undone.`,
    confirmText: 'Delete'
  });
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted.', 'success');
      loadProducts();
      loadDashboardStats();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error deleting product.', 'error');
  }
}

/* ==========================================================================
   TAB 3: CATEGORIES & SUBCATEGORIES MANAGEMENT
   ========================================================================== */

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

let modalSubcategories = [];

function renderModalSubcategories() {
  const container = document.getElementById('subCategoriesList');
  const countBadge = document.getElementById('subcatCountBadge');
  if (!container) return;

  if (countBadge) {
    countBadge.innerText = `${modalSubcategories.length} added`;
  }

  if (modalSubcategories.length === 0) {
    container.innerHTML = `<span class="subcat-empty-msg">No subcategories added yet. Use the fields above to add one by one.</span>`;
    return;
  }

  container.innerHTML = modalSubcategories.map((sub, index) => `
    <div class="subcat-chip">
      <span class="subcat-chip-name">${escapeHtml(sub.name)}</span>
      <span class="subcat-chip-slug">/${escapeHtml(sub.slug)}</span>
      <button type="button" class="subcat-chip-remove" onclick="removeModalSubcategory(${index})" title="Remove subcategory">&times;</button>
    </div>
  `).join('');
}

function addModalSubcategory() {
  const nameInput = document.getElementById('subCatInputName');
  const slugInput = document.getElementById('subCatInputSlug');
  if (!nameInput || !slugInput) return;

  const name = nameInput.value.trim();
  let slug = slugInput.value.trim();

  if (!name) {
    showToast('Please type a subcategory name.', 'error');
    nameInput.focus();
    return;
  }

  if (!slug) slug = slugify(name);

  // Check duplicate inside current modal list
  if (modalSubcategories.some(s => s.slug.toLowerCase() === slug.toLowerCase())) {
    showToast('A subcategory with this slug is already in the list.', 'error');
    return;
  }

  modalSubcategories.push({ name, slug });
  nameInput.value = '';
  slugInput.value = '';
  renderModalSubcategories();
  nameInput.focus();
}

window.removeModalSubcategory = function(index) {
  modalSubcategories.splice(index, 1);
  renderModalSubcategories();
};

async function loadCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  const filterSelect = document.getElementById('productCategoryFilter');

  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (data.success) {
      allCategories = data.categories || [];

      // Update product filter dropdown (main categories only)
      if (filterSelect) {
        const curVal = filterSelect.value;
        let optionsHtml = '<option value="">All Categories</option>';
        allCategories.forEach(c => {
          optionsHtml += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
        });
        filterSelect.innerHTML = optionsHtml;
        filterSelect.value = curVal;
        syncModernSelect(filterSelect);
      }

      if (tbody) {
        if (allCategories.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 36px 16px;">No categories created yet. Click "Add New Category" above to create one.</td></tr>`;
          return;
        }

        tbody.innerHTML = allCategories.map(c => {
          const subs = c.subcategories || [];

          return `
            <tr>
              <td style="text-align: center; vertical-align: middle;">
                <span class="cat-id-badge">#${c.id}</span>
              </td>
              <td style="vertical-align: middle;">
                <div class="cat-title-cell">
                  <span class="cat-name-text">${escapeHtml(c.name)}</span>
                  ${c.description ? `<div class="cat-desc-text">${escapeHtml(c.description)}</div>` : ''}
                </div>
              </td>
              <td style="vertical-align: middle;">
                ${subs.length > 0 ? `
                  <button type="button" class="subcat-pill-btn" onclick="openSubcategoriesPopup(${c.id})" title="Click to view and manage ${subs.length} subcategories">
                    <span>${subs.length} subcategor${subs.length === 1 ? 'y' : 'ies'}</span>
                    <svg class="subcat-pill-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l9.2-9.2M17 17V7.8H7.8"/></svg>
                  </button>
                ` : `
                  <button type="button" class="subcat-pill-btn empty" onclick="openSubcategoriesPopup(${c.id})" title="Click to add subcategories to ${escapeHtml(c.name)}">
                    <span>+ Add subcategory</span>
                  </button>
                `}
              </td>
              <td style="vertical-align: middle;">
                <span class="cat-product-count">${c.total_products || c.product_count || 0} items</span>
              </td>
              <td style="text-align: right; vertical-align: middle; white-space: nowrap;">
                <div class="cat-actions-cell">
                  <button type="button" class="btn btn-sm btn-ghost cat-add-sub-btn" title="Manage subcategories for ${escapeHtml(c.name)}" onclick="openSubcategoriesPopup(${c.id})">
                    + Sub
                  </button>
                  <button type="button" class="btn-icon" title="Edit Category" onclick="openCategoryModal(${c.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button type="button" class="btn-icon delete" title="Delete Category" onclick="deleteCategory(${c.id}, '${escapeHtml(c.name)}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function openCategoryModal(categoryId = null) {
  const modal = document.getElementById('categoryModal');
  const form = document.getElementById('categoryForm');
  const title = document.getElementById('categoryModalTitle');
  const saveBtn = document.getElementById('saveCategoryBtn');
  if (!modal) return;
  form?.reset();

  if (categoryId) {
    const cat = allCategories.find(c => c.id === categoryId);
    if (!cat) return;

    if (title) title.innerText = `Edit Category: ${cat.name}`;
    if (saveBtn) saveBtn.innerText = 'Update Category';
    document.getElementById('catFormId').value = cat.id;
    document.getElementById('catFormName').value = cat.name;
    document.getElementById('catFormSlug').value = cat.slug;
    document.getElementById('catFormDesc').value = cat.description || '';

    modalSubcategories = (cat.subcategories || []).map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description || ''
    }));
  } else {
    if (title) title.innerText = 'Add New Category';
    if (saveBtn) saveBtn.innerText = 'Create Category';
    document.getElementById('catFormId').value = '';
    modalSubcategories = [];
  }

  renderModalSubcategories();
  modal.style.display = 'flex';
  document.getElementById('catFormName')?.focus();
}

function closeCategoryModal() {
  document.getElementById('categoryModal').style.display = 'none';
}

async function handleSaveCategory(e) {
  e.preventDefault();
  const id = document.getElementById('catFormId').value;
  const name = document.getElementById('catFormName').value.trim();
  const slug = document.getElementById('catFormSlug').value.trim();
  const description = document.getElementById('catFormDesc').value.trim();

  const payload = {
    name,
    slug,
    description,
    subcategories: modalSubcategories
  };

  try {
    const url = id ? `${API_BASE}/categories/${id}` : `${API_BASE}/categories`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Category updated successfully.' : 'Category created successfully.', 'success');
      closeCategoryModal();
      loadCategories();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Error saving category.', 'error');
    }
  } catch (err) {
    showToast('Failed to save category.', 'error');
  }
}

// Single Subcategory Modal handlers
window.openAddSubCategoryToParent = function(parentId, parentName) {
  document.getElementById('subCategoryForm')?.reset();
  document.getElementById('singleSubCatId').value = '';
  document.getElementById('singleSubCatParentId').value = parentId;
  document.getElementById('singleSubCatParentName').value = parentName;
  document.getElementById('subCategoryModalTitle').innerText = `Add Subcategory to "${parentName}"`;
  document.getElementById('saveSubCategoryBtn').innerText = 'Add Subcategory';
  document.getElementById('subCategoryModal').style.display = 'flex';
  document.getElementById('singleSubCatName')?.focus();
};

window.openEditSubCategory = function(subId) {
  let foundSub = null;
  let foundParent = null;

  for (const cat of allCategories) {
    if (cat.subcategories) {
      const sub = cat.subcategories.find(s => s.id === subId);
      if (sub) {
        foundSub = sub;
        foundParent = cat;
        break;
      }
    }
  }

  if (!foundSub) return;

  document.getElementById('singleSubCatId').value = foundSub.id;
  document.getElementById('singleSubCatParentId').value = foundParent.id;
  document.getElementById('singleSubCatParentName').value = foundParent.name;
  document.getElementById('singleSubCatName').value = foundSub.name;
  document.getElementById('singleSubCatSlug').value = foundSub.slug;
  document.getElementById('singleSubCatDesc').value = foundSub.description || '';
  document.getElementById('subCategoryModalTitle').innerText = `Edit Subcategory: ${foundSub.name}`;
  document.getElementById('saveSubCategoryBtn').innerText = 'Update Subcategory';
  document.getElementById('subCategoryModal').style.display = 'flex';
  document.getElementById('singleSubCatName')?.focus();
};

function closeSubCategoryModal() {
  document.getElementById('subCategoryModal').style.display = 'none';
}

async function handleSaveSubCategory(e) {
  e.preventDefault();
  const subId = document.getElementById('singleSubCatId').value;
  const parentId = document.getElementById('singleSubCatParentId').value;
  const name = document.getElementById('singleSubCatName').value.trim();
  const slug = document.getElementById('singleSubCatSlug').value.trim();
  const description = document.getElementById('singleSubCatDesc').value.trim();

  const payload = {
    name,
    slug,
    description,
    parent_id: parseInt(parentId)
  };

  try {
    const url = subId ? `${API_BASE}/categories/${subId}` : `${API_BASE}/categories`;
    const method = subId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(subId ? 'Subcategory updated successfully.' : 'Subcategory added successfully.', 'success');
      closeSubCategoryModal();
      await loadCategories();
      loadDashboardStats();
      if (currentPopupParentId) {
        renderPopupSubcategories(currentPopupParentId);
      }
    } else {
      showToast(data.message || 'Error saving subcategory.', 'error');
    }
  } catch (err) {
    showToast('Failed to save subcategory.', 'error');
  }
}

window.deleteSubCategory = async function(subId, subName) {
  const confirmed = await showDeleteConfirm({
    title: 'Delete Subcategory',
    message: `Are you sure you want to delete subcategory "${subName}"? Products in this subcategory will become uncategorized.`,
    confirmText: 'Delete'
  });
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/categories/${subId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Subcategory "${subName}" deleted.`, 'success');
      await loadCategories();
      loadProducts();
      loadDashboardStats();
      if (currentPopupParentId) {
        renderPopupSubcategories(currentPopupParentId);
      }
    } else {
      showToast(data.message || 'Failed to delete subcategory.', 'error');
    }
  } catch (err) {
    showToast('Failed to delete subcategory.', 'error');
  }
};

/* ==========================================================================
   POPUP MODAL: SUBCATEGORIES MANAGEMENT
   ========================================================================== */
let currentPopupParentId = null;

window.openSubcategoriesPopup = function(catId) {
  currentPopupParentId = catId;
  const cat = allCategories.find(c => c.id === catId);
  if (!cat) return;

  const title = document.getElementById('subcatPopupTitle');
  if (title) title.innerText = `${cat.name}`;

  const parentIdInput = document.getElementById('popupParentId');
  if (parentIdInput) parentIdInput.value = cat.id;

  const nameInput = document.getElementById('popupSubcatName');
  const slugInput = document.getElementById('popupSubcatSlug');
  if (nameInput) nameInput.value = '';
  if (slugInput) slugInput.value = '';

  renderPopupSubcategories(catId);

  const modal = document.getElementById('subcategoriesPopupModal');
  if (modal) modal.style.display = 'flex';
  if (nameInput) nameInput.focus();
};

window.closeSubcategoriesPopup = function() {
  const modal = document.getElementById('subcategoriesPopupModal');
  if (modal) modal.style.display = 'none';
  currentPopupParentId = null;
};

window.renderPopupSubcategories = function(catId) {
  const cat = allCategories.find(c => c.id === catId);
  const container = document.getElementById('popupSubcategoriesList');
  const countSpan = document.getElementById('popupSubcatCount');
  if (!container) return;

  const subs = cat?.subcategories || [];
  if (countSpan) countSpan.innerText = subs.length;

  if (subs.length === 0) {
    container.innerHTML = `
      <div class="subcat-popup-empty">
        No subcategories created yet for "<strong>${escapeHtml(cat ? cat.name : 'this category')}</strong>".
        <div style="margin-top: 6px; font-size: 12px; color: var(--text-muted);">Use the quick form above to add your first subcategory.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = subs.map(s => `
    <div class="subcat-popup-item">
      <div class="subcat-popup-item-info">
        <span class="subcat-popup-item-name">${escapeHtml(s.name)}</span>
        <span class="subcat-popup-item-slug">/${escapeHtml(s.slug)}</span>
        <span class="subcat-popup-item-count">${s.product_count || 0} items</span>
      </div>
      <div class="subcat-popup-item-actions">
        <button type="button" class="btn-icon" title="Edit Subcategory" onclick="openEditSubCategoryFromPopup(${s.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button type="button" class="btn-icon delete" title="Delete Subcategory" onclick="deleteSubCategoryFromPopup(${s.id}, '${escapeHtml(s.name)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
};

window.handlePopupAddSubcategory = async function(e) {
  e.preventDefault();
  const parentId = parseInt(document.getElementById('popupParentId').value);
  const name = document.getElementById('popupSubcatName').value.trim();
  let slug = document.getElementById('popupSubcatSlug').value.trim();

  if (!name) {
    showToast('Please enter a subcategory name.', 'error');
    return;
  }

  if (!slug) slug = slugify(name);

  const addBtn = document.getElementById('popupAddSubcatBtn');
  if (addBtn) addBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name,
        slug,
        parent_id: parentId
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Subcategory "${name}" added successfully.`, 'success');
      document.getElementById('popupSubcatName').value = '';
      document.getElementById('popupSubcatSlug').value = '';
      await loadCategories();
      renderPopupSubcategories(parentId);
      document.getElementById('popupSubcatName')?.focus();
    } else {
      showToast(data.message || 'Error adding subcategory.', 'error');
    }
  } catch (err) {
    showToast('Failed to add subcategory.', 'error');
  } finally {
    if (addBtn) addBtn.disabled = false;
  }
};

window.openEditSubCategoryFromPopup = function(subId) {
  openEditSubCategory(subId);
};

window.deleteSubCategoryFromPopup = async function(subId, subName) {
  await deleteSubCategory(subId, subName);
};

window.deleteCategory = async function(id, catName) {
  const cat = allCategories.find(c => c.id === id);
  const subCount = cat?.subcategories?.length || 0;
  const confirmMsg = subCount > 0
    ? `Are you sure you want to delete category "${catName || 'this category'}" and all its ${subCount} subcategories? Any associated products will become uncategorized.`
    : `Are you sure you want to delete category "${catName || 'this category'}"? Any associated products will become uncategorized.`;

  const confirmed = await showDeleteConfirm({
    title: 'Delete Category',
    message: confirmMsg,
    confirmText: 'Delete'
  });
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Category deleted successfully.', 'success');
      loadCategories();
      loadProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Failed to delete category.', 'error');
    }
  } catch (err) {
    showToast('Failed to delete category.', 'error');
  }
};

/* ==========================================================================
   TAB 3.5: BRANDS MANAGEMENT
   ========================================================================== */

async function loadBrands() {
  const tbody = document.getElementById('brandsTableBody');
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 30px;"><div class="loading-spinner"></div> Loading brands...</td></tr>`;

    const res = await fetch(`${API_BASE}/brands`);
    const data = await res.json();

    if (data.success && Array.isArray(data.brands)) {
      allBrands = data.brands;
      renderBrands(allBrands);
      updateBrandDatalist();
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 30px;">No brands found. Click "Add Brand" to create one.</td></tr>`;
    }
  } catch (err) {
    console.error('Error loading brands:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger" style="padding: 30px;">Failed to load brands from server.</td></tr>`;
  }
}

function updateBrandDatalist() {
  const datalist = document.getElementById('brandOptions');
  if (datalist && allBrands.length > 0) {
    datalist.innerHTML = allBrands.map(b => `<option value="${escapeHtml(b.name)}">`).join('');
  }
}

function filterBrands() {
  const query = (document.getElementById('brandSearchInput')?.value || '').toLowerCase().trim();
  if (!query) {
    renderBrands(allBrands);
    return;
  }
  const filtered = allBrands.filter(b => 
    (b.name && b.name.toLowerCase().includes(query)) ||
    (b.slug && b.slug.toLowerCase().includes(query)) ||
    (b.description && b.description.toLowerCase().includes(query))
  );
  renderBrands(filtered);
}

function renderBrands(brandsList) {
  const tbody = document.getElementById('brandsTableBody');
  if (!tbody) return;

  if (!brandsList || brandsList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 40px 20px;">
          <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">No brands match your search</div>
          <div style="font-size: 13px;">Try another search term or click "Add Brand" above to register a new brand.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = brandsList.map(b => {
    const hasImage = b.image && b.image.trim();
    const websiteUrl = b.website && b.website.trim() ? b.website.trim() : null;

    return `
      <tr>
        <td>
          ${hasImage ? `
            <img src="${escapeHtml(b.image)}" alt="${escapeHtml(b.name)}" class="table-thumb" style="object-fit: contain; background: #ffffff; padding: 4px;" onerror="this.onerror=null; this.src='/Superlight-Logo-01.svg';" />
          ` : `
            <div class="table-thumb" style="display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: var(--brand); background: var(--brand-light);">
              ${(b.name || 'B').charAt(0).toUpperCase()}
            </div>
          `}
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">
            ${escapeHtml(b.name)}
          </div>
          ${b.description ? `
            <div class="text-muted" style="font-size: 12px; margin-top: 3px; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(b.description)}
            </div>
          ` : ''}
        </td>
        <td>
          <code>${escapeHtml(b.slug)}</code>
        </td>
        <td>
          ${websiteUrl ? `
            <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--brand); display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; text-decoration: none;">
              <span>Visit Site</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          ` : `
            <span class="text-muted" style="font-size: 12.5px;">—</span>
          `}
        </td>
        <td>
          <span style="font-weight: 700; color: var(--text-primary);">${b.product_count || 0} items</span>
        </td>
        <td>
          ${b.is_featured ? `
            <span class="status-chip completed" style="font-size: 10.5px;">Featured</span>
          ` : `
            <span class="status-chip pending" style="font-size: 10.5px; background: #f1f5f9; color: #64748b; border-color: #e2e8f0;">Standard</span>
          `}
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-icon" title="Edit Brand" onclick="openBrandModal(${b.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="btn-icon delete" title="Delete Brand" onclick="deleteBrand(${b.id}, '${escapeHtml(b.name)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openBrandModal = function(brandId = null) {
  const modal = document.getElementById('brandModal');
  const form = document.getElementById('brandForm');
  const title = document.getElementById('brandModalTitle');
  const saveBtn = document.getElementById('saveBrandBtn');
  if (!modal) return;

  form?.reset();
  document.getElementById('brandFormId').value = '';

  if (brandId) {
    const brand = allBrands.find(b => b.id === brandId);
    if (!brand) return;

    if (title) title.innerText = `Edit Brand: ${brand.name}`;
    if (saveBtn) saveBtn.innerText = 'Update Brand';

    document.getElementById('brandFormId').value = brand.id;
    document.getElementById('brandFormName').value = brand.name || '';
    document.getElementById('brandFormSlug').value = brand.slug || '';
    document.getElementById('brandFormImage').value = brand.image || '';
    document.getElementById('brandFormWebsite').value = brand.website || '';
    document.getElementById('brandFormDesc').value = brand.description || '';
    document.getElementById('brandFormFeatured').checked = !!brand.is_featured;
  } else {
    if (title) title.innerText = 'Add New Brand';
    if (saveBtn) saveBtn.innerText = 'Create Brand';
  }

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('brandFormName')?.focus(), 80);
};

window.closeBrandModal = function() {
  const modal = document.getElementById('brandModal');
  if (modal) modal.style.display = 'none';
};

window.handleSaveBrand = async function(e) {
  if (e && e.preventDefault) e.preventDefault();

  const id = document.getElementById('brandFormId')?.value;
  const name = document.getElementById('brandFormName')?.value.trim();
  const slug = document.getElementById('brandFormSlug')?.value.trim();
  const image = document.getElementById('brandFormImage')?.value.trim();
  const website = document.getElementById('brandFormWebsite')?.value.trim();
  const description = document.getElementById('brandFormDesc')?.value.trim();
  const is_featured = document.getElementById('brandFormFeatured')?.checked ? 1 : 0;

  if (!name) {
    showToast('Brand name is required.', 'error');
    return;
  }

  const payload = {
    name,
    slug: slug || slugify(name),
    image,
    website,
    description,
    is_featured
  };

  const saveBtn = document.getElementById('saveBrandBtn');
  const originalText = saveBtn ? saveBtn.innerText : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';
  }

  try {
    const url = id ? `${API_BASE}/brands/${id}` : `${API_BASE}/brands`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Brand updated successfully.' : 'Brand created successfully.', 'success');
      closeBrandModal();
      loadBrands();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Error saving brand.', 'error');
    }
  } catch (err) {
    showToast('Failed to save brand to backend.', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = originalText;
    }
  }
};

window.deleteBrand = async function(id, name) {
  const confirmed = await showDeleteConfirm({
    title: 'Delete Brand',
    message: `Are you sure you want to permanently delete the brand "${name}"?`,
    confirmText: 'Delete'
  });
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/brands/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Brand "${name}" deleted.`, 'success');
      loadBrands();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Error deleting brand.', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend.', 'error');
  }
};

window.handleBrandImageUpload = async function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    showToast('Uploading brand logo...', 'info');
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.url) {
      document.getElementById('brandFormImage').value = data.url;
      showToast('Logo uploaded successfully!', 'success');
    } else {
      showToast(data.message || 'Upload failed.', 'error');
    }
  } catch (err) {
    showToast('Error uploading image to server.', 'error');
  }
};

/* ==========================================================================
   TAB 4: ORDERS
   ========================================================================== */
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      if (data.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No orders found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.orders.map(o => `
        <tr>
          <td>
            <strong>${o.order_number}</strong>
            ${o.order_source === 'WhatsApp' ? '<div style="margin-top:4px;"><span style="display:inline-block; font-size:10.5px; font-weight:600; padding:2px 6px; border-radius:4px; background:#dcfce7; color:#15803d;">WhatsApp</span></div>' : ''}
          </td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${escapeHtml(o.customer_name)}</div>
          </td>
          <td>
            <div>${escapeHtml(o.customer_email || '')}</div>
            <div class="text-muted" style="font-size:12px;">📞 ${escapeHtml(o.customer_phone || '')}</div>
            ${o.delivery_location ? `<div style="font-size:11.5px; color:#e6005c; margin-top:2px;">📍 ${escapeHtml(o.delivery_location)}</div>` : ''}
            ${o.notes ? `<div style="font-size:11px; color:#6b7280; font-style:italic; margin-top:2px;">📝 ${escapeHtml(o.notes)}</div>` : ''}
          </td>
          <td>
            <span style="font-size:12px; line-height: 1.4;">
              ${o.items.map(it => `• <strong>${it.qty || it.quantity || 1}x</strong> ${escapeHtml(it.name)}`).join('<br>')}
            </span>
          </td>
          <td><strong>AED ${Number(o.total_amount).toFixed(2)}</strong></td>
          <td>
            <select class="filter-select" style="padding:4px 8px; font-size:12px;" onchange="updateOrderStatus(${o.id}, this.value)">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>${new Date(o.created_at).toLocaleDateString()}</td>
          <td>
            <span class="status-chip ${o.status.toLowerCase()}">${o.status}</span>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order updated to ${newStatus}.`, 'success');
      loadOrders();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to update order status.', 'error');
  }
}

/* ==========================================================================
   TAB 5: INQUIRIES
   ========================================================================== */
let allInquiries = [];

async function loadInquiries() {
  const tbody = document.getElementById('inquiriesTableBody');
  try {
    const res = await fetch(`${API_BASE}/inquiries`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      allInquiries = data.inquiries;
      if (allInquiries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No customer inquiries found.</td></tr>`;
        return;
      }

      tbody.innerHTML = allInquiries.map(inq => `
        <tr>
          <td>#${inq.id}</td>
          <td><strong>${escapeHtml(inq.name)}</strong></td>
          <td>
            <div>${escapeHtml(inq.email)}</div>
            <div class="text-muted" style="font-size:11px;">${escapeHtml(inq.phone || '')}</div>
          </td>
          <td><strong>${escapeHtml(inq.subject || 'General Inquiry')}</strong></td>
          <td><span class="status-chip ${inq.status.toLowerCase()}">${inq.status}</span></td>
          <td>${new Date(inq.created_at).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="viewInquiry(${inq.id})">Read</button>
            <button class="btn-icon delete" title="Delete" onclick="deleteInquiry(${inq.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading inquiries:', err);
  }
}

function viewInquiry(inquiryId) {
  const inq = allInquiries.find(i => i.id === inquiryId);
  if (!inq) return;

  document.getElementById('inqModalSubject').innerText = inq.subject || 'Customer Inquiry';
  document.getElementById('inqModalSender').innerText = inq.name;
  document.getElementById('inqModalEmail').innerText = inq.email;
  document.getElementById('inqModalPhone').innerText = inq.phone || 'N/A';
  document.getElementById('inqModalContent').innerText = inq.message;

  const repliedBtn = document.getElementById('inqMarkRepliedBtn');
  repliedBtn.onclick = async () => {
    await fetch(`${API_BASE}/inquiries/${inq.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: 'Replied' })
    });
    showToast('Inquiry marked as replied.', 'success');
    closeInquiryModal();
    loadInquiries();
    loadDashboardStats();
  };

  document.getElementById('inquiryModal').style.display = 'flex';
}

function closeInquiryModal() {
  document.getElementById('inquiryModal').style.display = 'none';
}

async function deleteInquiry(id) {
  const confirmed = await showDeleteConfirm({
    title: 'Delete Inquiry',
    message: 'Are you sure you want to permanently delete this customer inquiry? This action cannot be undone.',
    confirmText: 'Delete'
  });
  if (!confirmed) return;
  try {
    const res = await fetch(`${API_BASE}/inquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Inquiry deleted.', 'success');
      loadInquiries();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to delete inquiry.', 'error');
  }
}

/* ==========================================================================
   CONFIRM DELETE DIALOG HELPER
   ========================================================================== */
window.showDeleteConfirm = function({
  title = 'Are you sure?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel'
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmDeleteModal');
    const titleEl = document.getElementById('confirmDeleteTitle');
    const msgEl = document.getElementById('confirmDeleteMessage');
    const confirmBtn = document.getElementById('confirmDeleteConfirmBtn');
    const cancelBtn = document.getElementById('confirmDeleteCancelBtn');
    const btnTextEl = document.getElementById('confirmDeleteBtnText');

    if (!modal || !confirmBtn || !cancelBtn) {
      return resolve(window.confirm(message));
    }

    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;
    if (btnTextEl) btnTextEl.innerText = confirmText;
    if (cancelBtn) cancelBtn.innerText = cancelText;

    modal.style.display = 'flex';

    let isDone = false;

    function cleanup() {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
    }

    function onConfirm(e) {
      if (e) e.preventDefault();
      if (isDone) return;
      isDone = true;
      cleanup();
      resolve(true);
    }

    function onCancel(e) {
      if (e) e.preventDefault();
      if (isDone) return;
      isDone = true;
      cleanup();
      resolve(false);
    }

    function onBackdrop(e) {
      if (e.target === modal) {
        onCancel(e);
      }
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        onCancel(e);
      } else if (e.key === 'Enter') {
        onConfirm(e);
      }
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    setTimeout(() => {
      cancelBtn.focus();
    }, 50);
  });
};

/* ==========================================================================
   HELPERS & TOASTS
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
