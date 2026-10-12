// Superlight Admin Dashboard App

const API_BASE = '/api';
let authToken = localStorage.getItem('superlight_admin_token') || null;
let currentAdmin = null;
let allCategories = [];
let allProducts = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');
const quickFillBtn = document.getElementById('quickFillBtn');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  if (authToken) {
    verifySession();
  } else {
    showLogin();
  }
});

function setupEventListeners() {
  // Quick fill demo credentials
  if (quickFillBtn) {
    quickFillBtn.addEventListener('click', () => {
      document.getElementById('loginEmail').value = 'admin@superlight.ae';
      document.getElementById('loginPassword').value = 'Admin@123';
      showToast('Credentials filled!', 'success');
    });
  }

  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Tab navigation
  navItems.forEach(item => {
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
  }

  // Product Modals
  document.getElementById('openAddProductModalBtn')?.addEventListener('click', () => openProductModal());
  document.getElementById('productForm')?.addEventListener('submit', handleSaveProduct);

  // Category Modals
  document.getElementById('openAddCategoryModalBtn')?.addEventListener('click', () => openCategoryModal());
  document.getElementById('categoryForm')?.addEventListener('submit', handleSaveCategory);

  // SQL Console Runner
  document.getElementById('runSqlBtn')?.addEventListener('click', executeCustomSQL);
}

// Check stored session
async function verifySession() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success && data.user) {
      currentAdmin = data.user;
      showApp();
    } else {
      handleLogout();
    }
  } catch (err) {
    console.error('Session verify error:', err);
    handleLogout();
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
  showLogin();
  showToast('Logged out successfully.', 'info');
}

function showLogin() {
  loginScreen.style.display = 'flex';
  adminApp.style.display = 'none';
}

function showApp() {
  loginScreen.style.display = 'none';
  adminApp.style.display = 'flex';

  if (currentAdmin) {
    document.getElementById('adminName').innerText = currentAdmin.name;
    document.getElementById('adminEmail').innerText = currentAdmin.email;
  }

  // Load initial datasets
  loadCategories();
  loadDashboardStats();
  switchTab('dashboard');
}

// Switch navigation tabs
function switchTab(tabId) {
  // Update sidebar active
  navItems.forEach(item => {
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
    orders: 'Customer Orders',
    inquiries: 'Inquiries & Leads',
    database: 'SQL Database Console'
  };
  pageTitle.innerText = titles[tabId] || 'Dashboard';

  // Load data for selected tab
  if (tabId === 'dashboard') loadDashboardStats();
  if (tabId === 'products') loadProducts();
  if (tabId === 'categories') loadCategories();
  if (tabId === 'orders') loadOrders();
  if (tabId === 'inquiries') loadInquiries();
  if (tabId === 'database') loadSqlTables();

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
            <td>${escapeHtml(ord.customer_name)}</td>
            <td><strong>AED ${ord.total_amount.toFixed(2)}</strong></td>
            <td><span class="status-chip ${ord.status.toLowerCase()}">${ord.status}</span></td>
            <td>${new Date(ord.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    }

    // Category Breakdown list
    const catList = document.getElementById('categoryBreakdownList');
    if (catList && stats.categoryBreakdown) {
      catList.innerHTML = stats.categoryBreakdown.map(item => `
        <div class="category-breakdown-item">
          <span class="cat-name-wrap">${escapeHtml(item.name)}</span>
          <span class="cat-count-badge">${item.product_count} products</span>
        </div>
      `).join('');
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
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No products found matching criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = allProducts.map(p => `
        <tr>
          <td><img src="${p.image}" class="table-thumb" alt="${escapeHtml(p.name)}" onerror="this.src='/favicon.svg'" /></td>
          <td>
            <strong>${escapeHtml(p.name)}</strong>
            ${p.is_featured ? '<span class="status-chip completed" style="margin-left:6px; font-size:10px;">Featured</span>' : ''}
          </td>
          <td><span class="status-chip" style="background:#f1f5f9; color:#475569;">${escapeHtml(p.brand)}</span></td>
          <td>${escapeHtml(p.category_name || 'Uncategorized')}</td>
          <td>
            <strong>AED ${p.price.toFixed(2)}</strong>
            ${p.old_price ? `<span class="text-muted" style="text-decoration:line-through; font-size:11px; margin-left:4px;">AED ${p.old_price.toFixed(2)}</span>` : ''}
          </td>
          <td>
            <span style="font-weight:600; color:${p.stock <= 20 ? '#ef4444' : '#10b981'};">
              ${p.stock} in stock
            </span>
          </td>
          <td>
            <button class="btn-icon" title="Edit" onclick="openProductModal(${p.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon delete" title="Delete" onclick="deleteProduct(${p.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading products:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:#ef4444;">Failed to load products.</td></tr>`;
  }
}

function openProductModal(productId = null) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');
  form.reset();

  // Populate category select options
  const catSelect = document.getElementById('prodFormCategory');
  catSelect.innerHTML = allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (productId) {
    title.innerText = 'Edit Product';
    const prod = allProducts.find(p => p.id === productId);
    if (prod) {
      document.getElementById('prodFormId').value = prod.id;
      document.getElementById('prodFormName').value = prod.name;
      document.getElementById('prodFormBrand').value = prod.brand;
      document.getElementById('prodFormCategory').value = prod.category_id || '';
      document.getElementById('prodFormPrice').value = prod.price;
      document.getElementById('prodFormOldPrice').value = prod.old_price || '';
      document.getElementById('prodFormImage').value = prod.image;
      document.getElementById('prodFormStock').value = prod.stock;
      document.getElementById('prodFormDesc').value = prod.description || '';
      document.getElementById('prodFormFeatured').checked = prod.is_featured === 1;
    }
  } else {
    title.innerText = 'Add New Product';
    document.getElementById('prodFormId').value = '';
    document.getElementById('prodFormImage').value = '/prod_downlight_1791451418016.png';
  }

  modal.style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodFormId').value;
  const payload = {
    name: document.getElementById('prodFormName').value.trim(),
    brand: document.getElementById('prodFormBrand').value.trim(),
    category_id: parseInt(document.getElementById('prodFormCategory').value),
    price: parseFloat(document.getElementById('prodFormPrice').value),
    old_price: document.getElementById('prodFormOldPrice').value ? parseFloat(document.getElementById('prodFormOldPrice').value) : null,
    image: document.getElementById('prodFormImage').value.trim() || '/prod_downlight_1791451418016.png',
    stock: parseInt(document.getElementById('prodFormStock').value) || 0,
    description: document.getElementById('prodFormDesc').value.trim(),
    is_featured: document.getElementById('prodFormFeatured').checked ? 1 : 0
  };

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
      showToast(id ? 'Product updated successfully.' : 'Product created successfully.', 'success');
      closeProductModal();
      loadProducts();
      loadDashboardStats();
    } else {
      showToast(data.message || 'Error saving product.', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend server.', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to permanently delete this product?')) return;

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
   TAB 3: CATEGORIES
   ========================================================================== */
async function loadCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  const filterSelect = document.getElementById('productCategoryFilter');

  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (data.success) {
      allCategories = data.categories;

      // Update product filter dropdown
      if (filterSelect) {
        const curVal = filterSelect.value;
        filterSelect.innerHTML = `<option value="">All Categories</option>` + 
          allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        filterSelect.value = curVal;
      }

      if (tbody) {
        tbody.innerHTML = allCategories.map(c => `
          <tr>
            <td>#${c.id}</td>
            <td><strong>${escapeHtml(c.name)}</strong></td>
            <td><code>/${escapeHtml(c.slug)}</code></td>
            <td><span class="cat-count-badge">${c.product_count} items</span></td>
            <td class="text-muted">${escapeHtml(c.description || '—')}</td>
            <td>
              <button class="btn-icon delete" title="Delete" onclick="deleteCategory(${c.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function openCategoryModal() {
  document.getElementById('categoryForm')?.reset();
  document.getElementById('categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
  document.getElementById('categoryModal').style.display = 'none';
}

async function handleSaveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('catFormName').value.trim();
  const slug = document.getElementById('catFormSlug').value.trim();
  const description = document.getElementById('catFormDesc').value.trim();

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name, slug, description })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Category created successfully.', 'success');
      closeCategoryModal();
      loadCategories();
      loadDashboardStats();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to create category.', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category? Any associated products will become uncategorized.')) return;
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Category deleted.', 'success');
      loadCategories();
      loadProducts();
      loadDashboardStats();
    }
  } catch (err) {
    showToast('Failed to delete category.', 'error');
  }
}

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
          <td><strong>${o.order_number}</strong></td>
          <td>${escapeHtml(o.customer_name)}</td>
          <td>
            <div>${escapeHtml(o.customer_email)}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHtml(o.customer_phone || '')}</div>
          </td>
          <td>
            <span style="font-size:12px;">
              ${o.items.map(it => `${it.qty}x ${escapeHtml(it.name)}`).join('<br>')}
            </span>
          </td>
          <td><strong>AED ${o.total_amount.toFixed(2)}</strong></td>
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
  if (!confirm('Delete this inquiry?')) return;
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
   TAB 6: SQL DATABASE CONSOLE
   ========================================================================== */
async function loadSqlTables() {
  const list = document.getElementById('dbTablesList');
  try {
    const res = await fetch(`${API_BASE}/database/tables`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success && data.tables) {
      list.innerHTML = Object.entries(data.tables).map(([name, info]) => `
        <div class="db-table-item" onclick="runPresetSQL('SELECT * FROM ${name} LIMIT 10')">
          <div>
            <span class="db-table-name">${name}</span>
            <div class="text-muted" style="font-size:11px;">${info.columns.length} columns</div>
          </div>
          <span class="cat-count-badge">${info.count} rows</span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading SQL tables:', err);
  }
}

window.runPresetSQL = function(sql) {
  document.getElementById('sqlInput').value = sql;
  executeCustomSQL();
};

async function executeCustomSQL() {
  const sql = document.getElementById('sqlInput').value.trim();
  const resultsWrap = document.getElementById('sqlResultsWrap');

  if (!sql) {
    showToast('Please type a SELECT query.', 'error');
    return;
  }

  resultsWrap.innerHTML = `<div class="text-center text-muted" style="padding:20px;">Executing SQL...</div>`;

  try {
    const res = await fetch(`${API_BASE}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ sql })
    });
    const data = await res.json();

    if (data.success) {
      if (data.rows.length === 0) {
        resultsWrap.innerHTML = `<div class="text-center text-muted" style="padding:20px;">Query succeeded: 0 rows returned.</div>`;
        return;
      }

      const columns = Object.keys(data.rows[0]);
      resultsWrap.innerHTML = `
        <div style="margin-bottom:8px; font-size:12px; font-weight:600; color:#10b981;">
          ✓ Found ${data.count} records
        </div>
        <table class="data-table">
          <thead>
            <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.rows.map(row => `
              <tr>
                ${columns.map(c => `<td>${escapeHtml(String(row[c] ?? 'NULL'))}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      resultsWrap.innerHTML = `<div class="alert error">${escapeHtml(data.message)}</div>`;
    }
  } catch (err) {
    resultsWrap.innerHTML = `<div class="alert error">Failed to execute SQL query.</div>`;
  }
}

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
