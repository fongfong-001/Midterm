let currentTab = 'all';
let installedApps = JSON.parse(localStorage.getItem('installed_apps') || '[]');
let activeDownloads = {};
let authMode = 'login'; // 'login' or 'register'
let currentUser = localStorage.getItem('store_user') || null;

document.addEventListener('DOMContentLoaded', () => {
  loadStoreContent();
  updateLibraryBadge();
  updateUserUI();

  document.getElementById('search-input').addEventListener('input', (e) => {
    loadStoreContent(e.target.value);
  });
});

function updateUserUI() {
  const container = document.getElementById('user-section');
  if (currentUser) {
    container.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-300 font-bold">👤 ${currentUser}</span>
        <button onclick="logout()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700">Logout</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal('login')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30">
        Login / Register
      </button>
    `;
  }
}

function openAuthModal(mode) {
  authMode = mode;
  document.getElementById('auth-error').classList.add('hidden');
  document.getElementById('auth-title').textContent = mode === 'login' ? 'Login to Store' : 'Create Account';
  document.getElementById('auth-submit-btn').textContent = mode === 'login' ? 'Login' : 'Create Account';
  document.getElementById('auth-toggle-text').textContent = mode === 'login' ? "Don't have an account?" : "Already have an account?";
  document.getElementById('auth-toggle-btn').textContent = mode === 'login' ? 'Create Account' : 'Login';
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('auth-modal').classList.add('flex');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('auth-modal').classList.remove('flex');
}

function toggleAuthMode() {
  openAuthModal(authMode === 'login' ? 'register' : 'login');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('auth-username').value;
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Authentication failed';
      errorEl.classList.remove('hidden');
      return;
    }

    localStorage.setItem('store_token', data.token);
    localStorage.setItem('store_user', data.username);
    currentUser = data.username;
    updateUserUI();
    closeAuthModal();
  } catch (err) {
    errorEl.textContent = 'Failed to connect to server';
    errorEl.classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem('store_token');
  localStorage.removeItem('store_user');
  currentUser = null;
  updateUserUI();
}

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('text-slate-400', !isActive);
  });

  const titleMap = { all: 'Recommended Apps & Games', apps: 'Top Applications', games: 'Trending Games', library: 'Your Installed Library' };
  document.getElementById('section-title').textContent = titleMap[tab];

  const heroSection = document.getElementById('hero-section');
  const topChartsSection = document.getElementById('top-charts-section');

  if (tab === 'library') {
    if (heroSection) heroSection.style.display = 'none';
    if (topChartsSection) topChartsSection.style.display = 'none';
    renderLibrary();
  } else {
    if (heroSection) heroSection.style.display = 'block';
    if (topChartsSection) topChartsSection.style.display = 'block';
    loadStoreContent();
  }
}

async function loadStoreContent(searchQuery = '') {
  try {
    const url = `/api/apps?type=${currentTab}&search=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(url);
    const data = await res.json();
    renderGrid(data);
    renderTopCharts(data);
  } catch (err) {
    console.error("Failed to load store content", err);
  }
}

function renderGrid(apps) {
  const container = document.getElementById('app-grid');
  if (!container) return;

  if (apps.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-medium">No store items found matching your search.</div>`;
    return;
  }

  container.innerHTML = apps.map(app => {
    const isInstalled = installedApps.some(i => i.id === app.id);
    return `
      <div onclick="openModal('${app.id}')" class="bg-[#1e293b]/70 border border-slate-700/60 hover:border-indigo-500/80 rounded-2xl p-5 hover:shadow-xl transition duration-200 cursor-pointer flex flex-col justify-between group">
        <div>
          <div class="flex items-center gap-4 mb-3">
            <div class="text-4xl bg-slate-800 p-3 rounded-2xl border border-slate-700/50 group-hover:scale-105 transition transform">${app.icon}</div>
            <div>
              <h3 class="font-bold text-white group-hover:text-indigo-400 transition text-base leading-snug">${app.name}</h3>
              <p class="text-xs text-slate-400">${app.developer}</p>
            </div>
          </div>
          <p class="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">${app.description}</p>
        </div>
        <div class="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
          <span class="text-amber-400 font-bold flex items-center gap-1">★ ${app.rating}</span>
          <span class="px-2.5 py-1 rounded-lg ${isInstalled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'} font-semibold">
            ${isInstalled ? 'Installed' : app.size}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderTopCharts(apps) {
  const container = document.getElementById('top-charts-list');
  if (!container) return;

  container.innerHTML = apps.slice(0, 8).map((app, index) => {
    const isInstalled = installedApps.some(i => i.id === app.id);
    return `
      <div onclick="openModal('${app.id}')" class="flex items-center gap-4 p-3 bg-[#1e293b]/50 border border-slate-700/40 rounded-xl hover:bg-slate-800/80 transition cursor-pointer">
        <span class="text-lg font-black text-slate-500 w-6 text-center">${index + 1}</span>
        <div class="text-3xl bg-slate-800 p-2 rounded-xl">${app.icon}</div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-sm text-white truncate">${app.name}</h4>
          <p class="text-xs text-slate-400 truncate">${app.category} • ★ ${app.rating}</p>
        </div>
        <button class="text-xs font-bold px-3 py-1.5 rounded-lg ${isInstalled ? 'bg-slate-800 text-slate-400' : 'bg-indigo-600 text-white'} transition">
          ${isInstalled ? 'Installed' : 'Get'}
        </button>
      </div>
    `;
  }).join('');
}

async function openModal(appId) {
  try {
    const res = await fetch(`/api/apps/${appId}`);
    const app = await res.json();
    const isInstalled = installedApps.some(i => i.id === app.id);
    const isDownloading = activeDownloads[app.id];

    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
      <div class="relative h-44 -mx-6 -mt-6 mb-6 bg-cover bg-center flex items-end p-6" style="background-image: url('${app.banner}')">
        <div class="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-[#1e293b]/50 to-transparent"></div>
        <div class="relative z-10 flex items-center gap-4">
          <div class="text-5xl bg-slate-900/90 p-3 rounded-2xl border border-slate-700">${app.icon}</div>
          <div>
            <h2 class="text-2xl font-black text-white">${app.name}</h2>
            <p class="text-xs text-indigo-400 font-semibold">${app.developer}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 py-3 border-y border-slate-700/60 mb-5 text-center">
        <div>
          <span class="block text-xs text-slate-400">Rating</span>
          <span class="font-bold text-amber-400 text-sm">★ ${app.rating}</span>
        </div>
        <div>
          <span class="block text-xs text-slate-400">Downloads</span>
          <span class="font-bold text-white text-sm">${app.downloads}</span>
        </div>
        <div>
          <span class="block text-xs text-slate-400">Size</span>
          <span class="font-bold text-white text-sm">${app.size}</span>
        </div>
      </div>

      <p class="text-sm text-slate-300 leading-relaxed mb-6">${app.description}</p>

      <div id="action-area">
        ${isDownloading ? `
          <div class="w-full bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-indigo-400 font-semibold">Downloading...</span>
              <span id="download-percent" class="text-white font-bold">0%</span>
            </div>
            <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div id="download-bar" class="bg-indigo-500 h-full w-0 transition-all duration-200"></div>
            </div>
          </div>
        ` : isInstalled ? `
          <button onclick="uninstallApp('${app.id}')" class="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-sm transition">
            Uninstall ${app.name}
          </button>
        ` : `
          <button onclick="installApp('${app.id}')" id="install-btn" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-600/30">
            Install (${app.size})
          </button>
        `}
      </div>
    `;

    const modal = document.getElementById('app-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (err) {
    console.error('Error fetching detail:', err);
  }
}

function closeModal() {
  const modal = document.getElementById('app-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function installApp(appId) {
  activeDownloads[appId] = true;
  openModal(appId);

  let progress = 0;
  const interval = setInterval(async () => {
    progress += 20;
    const percentEl = document.getElementById('download-percent');
    const barEl = document.getElementById('download-bar');

    if (percentEl) percentEl.textContent = `${progress}%`;
    if (barEl) barEl.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      delete activeDownloads[appId];

      const res = await fetch(`/api/apps/${appId}`);
      const app = await res.json();
      installedApps.push(app);
      localStorage.setItem('installed_apps', JSON.stringify(installedApps));
      
      updateLibraryBadge();
      openModal(appId);
      if (currentTab === 'library') renderLibrary();
      else loadStoreContent();
    }
  }, 250);
}

function uninstallApp(appId) {
  installedApps = installedApps.filter(a => a.id !== appId);
  localStorage.setItem('installed_apps', JSON.stringify(installedApps));
  updateLibraryBadge();
  closeModal();
  if (currentTab === 'library') renderLibrary();
  else loadStoreContent();
}

function renderLibrary() {
  renderGrid(installedApps);
}

function updateLibraryBadge() {
  document.getElementById('installed-badge').textContent = installedApps.length;
}