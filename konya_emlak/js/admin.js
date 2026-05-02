
// POPUP SİSTEMİ
function showPopup(msg, title='Bilgi', icon='ℹ️', type='info', onConfirm=null) {
  // Mevcut popup varsa kaldır
  const existing = document.getElementById('admin-popup');
  if (existing) existing.remove();

  const colors = { info:'var(--gold)', danger:'var(--err)', success:'var(--ok)' };
  const btnColors = { info:'var(--gold)', danger:'var(--err)', success:'var(--ok)' };

  const div = document.createElement('div');
  div.id = 'admin-popup';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
  div.innerHTML = `
    <div style="background:var(--d2);border:1px solid var(--bd);border-radius:12px;padding:28px;width:min(400px,88vw);text-align:center;">
      <div style="font-size:36px;margin-bottom:12px;">${icon}</div>
      <div style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--tx);margin-bottom:8px;">${title}</div>
      <div style="font-size:13px;color:var(--txm);line-height:1.6;margin-bottom:20px;">${msg}</div>
      <div style="display:flex;gap:10px;justify-content:center;">
        ${onConfirm ? `<button onclick="document.getElementById('admin-popup').remove()" style="padding:10px 20px;background:transparent;border:1px solid var(--bd);border-radius:8px;color:var(--txm);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">İptal</button>` : ''}
        <button id="popup-confirm-btn" style="padding:10px 24px;background:${btnColors[type]};border:none;border-radius:8px;color:${type==='info'?'var(--dark)':'#fff'};font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">Tamam</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  document.getElementById('popup-confirm-btn').onclick = () => {
    div.remove();
    if (onConfirm) onConfirm();
  };
}
function showError(msg, title='Hata') { showPopup(msg, title, '❌', 'danger'); }
function showSuccess(msg, title='Başarılı') { showPopup(msg, title, '✅', 'success'); }
function showConfirm(msg, title, onConfirm) { showPopup(msg, title, '⚠️', 'danger', onConfirm); }

const SU = 'https://bknfjyfuzbanhoomooth.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbmZqeWZ1emJhbmhvb21vb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODczNDgsImV4cCI6MjA5MzE2MzM0OH0.7Tl3nWspqxDtnhIj2SZju_ObXtjkAsv_n-Joj7vwSx0';

// Adminler - buraya istediğin adminleri ekle
const ADMINS = {
  'ziya': 'gokalp',
  'ahmet': 'guler',
  'batuhan': 'Y1'
};

let currentAdmin = '';
const ADMIN_HEARTBEAT = {}; // son aktivite zamanları

function updateHeartbeat() {
  if (!currentAdmin) return;
  ADMIN_HEARTBEAT[currentAdmin] = Date.now();
  // Supabase'e heartbeat kaydet
  fetch(`${SU}/rest/v1/admins?username=eq.${currentAdmin}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ last_seen: new Date().toISOString() })
  }).catch(() => {});
}

function isAdminOnline(lastSeen) {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < 300000; // 5 dakika
}

async function logAction(action, details = '') {
  try {
    const r = await fetch(`${SU}/rest/v1/admin_logs`, {
      method: 'POST',
      headers: { ...headers(), 'Prefer': 'return=representation' },
      body: JSON.stringify({ admin_username: currentAdmin, action, details })
    });
    const newLog = await r.json();
    if (Array.isArray(newLog) && newLog[0]) {
      allLogs.unshift(newLog[0]);
      // Log sayfası açıksa anlık güncelle
      if (document.getElementById('sec-logs').classList.contains('on')) {
        renderLogs();
      }
    }
  } catch(e) { console.log('Log hatası:', e); }
}

let allUsers = [], allSubs = [], allListings = [];
const fp = n => new Intl.NumberFormat('tr-TR').format(n);
const fdate = d => d ? new Date(d).toLocaleDateString('tr-TR') : '—';
const fdatetime = d => d ? new Date(d).toLocaleString('tr-TR') : '—';

function headers() {
  return { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json' };
}

// LOGIN
function adminLogin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const err = document.getElementById('login-err');

  if (ADMINS[user] && ADMINS[user] === pass) {
    currentAdmin = user;
    localStorage.setItem('admin_session', JSON.stringify({ user, time: Date.now() }));
    document.getElementById('admin-name-display').textContent = '👤 ' + user;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-page').style.display = 'block';
    err.style.display = 'none';
    logAction('Giriş yapıldı', user + ' admin paneline giriş yaptı');
    updateHeartbeat(); // Hemen güncelle
    setInterval(updateHeartbeat, 60000);
    loadAll();
  } else {
    err.style.display = 'block';
  }
}

function adminLogout() {
  localStorage.removeItem('admin_session');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-page').style.display = 'none';
}

// Sayfa açılınca session kontrol
window.addEventListener('DOMContentLoaded', () => {
  const session = localStorage.getItem('admin_session');
  if (session) {
    const s = JSON.parse(session);
    if (Date.now() - s.time < 86400000 && ADMINS[s.user]) {
      currentAdmin = s.user;
      document.getElementById('admin-name-display').textContent = '👤 ' + s.user;
      updateHeartbeat();
      setInterval(updateHeartbeat, 60000);
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('admin-page').style.display = 'block';
      loadAll();
    }
  }
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  // Enter ile login
  document.getElementById('admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
  // Bugünü default yap
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sub-start').value = today;
});

// VERİ YÜKLEMELERİ
let allLogs = [];

async function loadAll() {
  await Promise.all([loadUsers(), loadSubs(), loadListings(), loadLogs()]);
  renderDashboard();
}

async function loadLogs() {
  const r = await fetch(`${SU}/rest/v1/admin_logs?select=*&order=created_at.desc&limit=200`, { headers: headers() });
  allLogs = await r.json();
}

async function loadUsers() {
  const r = await fetch(`${SU}/rest/v1/users?select=*&order=created_at.desc`, { headers: headers() });
  allUsers = await r.json();
}

async function loadSubs() {
  const r = await fetch(`${SU}/rest/v1/subscriptions?select=*&order=created_at.desc`, { headers: headers() });
  allSubs = await r.json();
}

async function loadListings() {
  const r = await fetch(`${SU}/rest/v1/listings?select=id,title,district,quarter,rooms,net_size,price&order=created_at.desc`, { headers: headers() });
  allListings = await r.json();
}

// DASHBOARD
function renderDashboard() {
  // Stats
  const activeSubs = allSubs.filter(s => s.status === 'active' && new Date(s.expires_at) > new Date());
  const totalRev = allSubs.reduce((sum, s) => sum + (s.price || 0), 0);
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const newUsers = allUsers.filter(u => new Date(u.created_at) >= thisMonth).length;

  const thisMonthSubs = allSubs.filter(s => new Date(s.created_at) >= monthStart).length;
  document.getElementById('stat-total-users').textContent = allUsers.length;
  document.getElementById('stat-active-subs').textContent = activeSubs.length;
  const subChangeEl = document.getElementById('stat-new-subs');
  if (subChangeEl) subChangeEl.textContent = thisMonthSubs > 0 ? '+' + thisMonthSubs + ' bu ay' : '';
  document.getElementById('stat-total-rev').textContent = fp(totalRev) + ' ₺';
  document.getElementById('stat-listings').textContent = allListings.length;
  document.getElementById('stat-new-users').textContent = newUsers > 0 ? `+${newUsers} bu ay` : '';

  // Son kullanıcılar
  const recentUsers = allUsers.slice(0, 5);
  document.getElementById('dash-recent-users').innerHTML = recentUsers.length
    ? recentUsers.map(u => `<tr>
        <td>${u.first_name} ${u.last_name}</td>
        <td>${u.phone}</td>
        <td>${fdate(u.created_at)}</td>
        <td>${fdatetime(u.last_login)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4"><div class="empty-state"><p>Henüz kullanıcı yok</p></div></td></tr>';

  // Son loglar - dashboard'da göster
  const recentLogs = allLogs.slice(0, 3);
  
  // Son abonelikler
  renderSubsTable('dash-recent-subs', allSubs.slice(0, 5), false);
}

// KULLANICILAR SAYFASI
function renderUsers() {
  document.getElementById('users-count').textContent = `${allUsers.length} Kullanıcı`;
  renderUsersTable(allUsers);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Kullanıcı bulunamadı</p></div></td></tr>'; return; }
  tbody.innerHTML = users.map(u => {
    const userSubs = allSubs.filter(s => s.user_id === u.id);
    const activeSub = userSubs.find(s => s.status === 'active' && new Date(s.expires_at) > new Date());
    return `<tr>
      <td>${u.first_name}</td>
      <td>${u.last_name}</td>
      <td>${u.phone}</td>
      <td>${fdate(u.created_at)}</td>
      <td>${fdatetime(u.last_login)}</td>
      <td>${activeSub ? `<span class="badge active">${activeSub.plan}</span>` : '<span class="badge expired">Yok</span>'}</td>
    </tr>`;
  }).join('');
}

function filterUsers(q) {
  const filtered = allUsers.filter(u =>
    (u.first_name + ' ' + u.last_name + ' ' + u.phone).toLowerCase().includes(q.toLowerCase())
  );
  renderUsersTable(filtered);
}

// ABONELİKLER SAYFASI
function renderSubscriptions() {
  document.getElementById('subs-count').textContent = `${allSubs.length} Abonelik`;
  renderSubsTable('subs-table', allSubs, true);
}

function renderSubsTable(tbodyId, subs, showActions) {
  const tbody = document.getElementById(tbodyId);
  if (!subs.length) { tbody.innerHTML = `<tr><td colspan="${showActions?8:6}"><div class="empty-state"><p>Abonelik bulunamadı</p></div></td></tr>`; return; }
  tbody.innerHTML = subs.map(s => {
    const user = allUsers.find(u => u.id === s.user_id);
    const now = new Date();
    const isActive = s.status === 'active' && new Date(s.expires_at) > now;
    const isCancelled = s.status === 'cancelled';
    const isExpired = !isActive && !isCancelled;
    const statusBadge = isActive
      ? '<span class="badge active">Aktif</span>'
      : isCancelled
        ? '<span class="badge" style="background:rgba(201,168,76,.1);color:var(--gold);border:1px solid rgba(201,168,76,.3);">İptal Edildi</span>'
        : '<span class="badge expired">Sona Erdi</span>';
    return `<tr>
      <td>${user ? user.first_name + ' ' + user.last_name : '—'}</td>
      ${showActions ? `<td>${user ? user.phone : '—'}</td>` : ''}
      <td>${s.plan}</td>
      <td style="color:var(--gold);font-weight:600;">${fp(s.price)} ₺</td>
      <td>${fdate(s.started_at)}</td>
      <td>${fdate(s.expires_at)}</td>
      <td>${statusBadge}</td>
      ${showActions ? `<td>${isActive ? `<button onclick="cancelSub('${s.id}')" style="background:transparent;border:1px solid var(--err);border-radius:6px;color:var(--err);font-size:11px;padding:3px 8px;cursor:pointer;">İptal</button>` : '—'}</td>` : ''}
    </tr>`;
  }).join('');
}

// ADMİN AKTİFLİK
async function renderAdmins() {
  try {
    const r = await fetch(`${SU}/rest/v1/admins?select=username,last_seen`, { headers: headers() });
    const admins = await r.json();
    const tbody = document.getElementById('admins-table');
    if (!tbody) return;
    const adminList = ['ziya', 'ahmet', 'batuhan'];
    tbody.innerHTML = adminList.map(name => {
      const adminData = admins.find(a => a.username === name);
      const online = adminData && isAdminOnline(adminData.last_seen);
      const lastSeen = adminData?.last_seen ? fdatetime(adminData.last_seen) : 'Hiç giriş yapılmadı';
      return `<tr>
        <td style="color:var(--gold);font-weight:600;">${name}</td>
        <td>Tam Yetki</td>
        <td>
          <span class="badge ${online ? 'active' : 'expired'}">${online ? '● Çevrimiçi' : '● Çevrimdışı'}</span>
          <div style="font-size:10px;color:var(--txm);margin-top:3px;">Son: ${lastSeen}</div>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { console.log('Admin aktiflik hatası:', e); }
}

// LOGLAR
async function renderLogs(filter = '') {
  // Her açılışta değil, sadece direkt çağrılınca yükle
  const logs = filter ? allLogs.filter(l => l.admin_username === filter) : allLogs;
  document.getElementById('logs-count').textContent = `${logs.length} İşlem`;
  const tbody = document.getElementById('logs-table');
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>Henüz işlem yok</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(l => `<tr>
    <td style="color:var(--gold);font-weight:600;">${l.admin_username}</td>
    <td>${l.action}</td>
    <td style="color:var(--txm);font-size:12px;">${l.details || '—'}</td>
    <td style="color:var(--txm);font-size:12px;">${fdatetime(l.created_at)}</td>
  </tr>`).join('');
}

function filterLogs(admin) {
  renderLogs(admin);
}

// GELİR RAPORU
function renderRevenue() {
  const totalRev = allSubs.reduce((s, sub) => s + (sub.price || 0), 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRev = allSubs.filter(s => new Date(s.created_at) >= monthStart).reduce((sum, s) => sum + (s.price || 0), 0);
  const activeRev = allSubs.filter(s => s.status === 'active' && new Date(s.expires_at) > now).reduce((sum, s) => sum + (s.price || 0), 0);

  document.getElementById('rev-total').textContent = fp(totalRev) + ' ₺';
  document.getElementById('rev-monthly').textContent = fp(monthlyRev) + ' ₺';
  document.getElementById('rev-active-val').textContent = fp(activeRev) + ' ₺';

  // Aylık chart - son 6 ay
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('tr-TR', { month: 'short' });
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const rev = allSubs.filter(s => { const c = new Date(s.created_at); return c >= start && c <= end; }).reduce((sum, s) => sum + (s.price || 0), 0);
    months.push({ label, rev });
  }
  const maxRev = Math.max(...months.map(m => m.rev), 1);
  const chartH = 100;
  document.getElementById('rev-chart').innerHTML = months.map(m => {
    const h = Math.max(Math.round((m.rev/maxRev)*chartH), 4);
    return '<div class="chart-bar-item">' +
      '<div style="width:100%;background:rgba(201,168,76,.15);border-radius:4px 4px 0 0;height:' + h + 'px;cursor:pointer;position:relative;" ' +
      'onmouseover="this.style.background=\'var(--gold)\'" onmouseout="this.style.background=\'rgba(201,168,76,.15)\'" title="' + fp(m.rev) + ' ₺">' +
      (m.rev > 0 ? '<div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:9px;color:var(--gold);white-space:nowrap;">' + fp(m.rev) + '₺</div>' : '') +
      '</div>' +
      '<div style="font-size:10px;color:var(--txm);margin-top:6px;text-align:center;">' + m.label + '</div>' +
      '</div>';
  }).join('');

  // Plan bazlı
  const plans = {};
  allSubs.forEach(s => {
    if (!plans[s.plan]) plans[s.plan] = { count: 0, total: 0 };
    plans[s.plan].count++;
    plans[s.plan].total += s.price || 0;
  });
  document.getElementById('rev-plans').innerHTML = Object.entries(plans).length
    ? Object.entries(plans).map(([plan, data]) => `<tr>
        <td>${plan}</td>
        <td>${data.count}</td>
        <td style="color:var(--gold);font-weight:600;">${fp(data.total)} ₺</td>
        <td>${fp(Math.round(data.total / data.count))} ₺</td>
      </tr>`).join('')
    : '<tr><td colspan="4"><div class="empty-state"><p>Henüz abonelik yok</p></div></td></tr>';
}

// İLANLAR
function renderListingsPage() {
  document.getElementById('listings-count').textContent = `${allListings.length} İlan`;
  renderListingsTable(allListings);
}

function renderListingsTable(listings) {
  const tbody = document.getElementById('listings-table');
  if (!listings.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>İlan bulunamadı</p></div></td></tr>'; return; }
  tbody.innerHTML = listings.slice(0, 100).map(l => `<tr>
    <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.title || '—'}</td>
    <td>${l.district || '—'}</td>
    <td>${l.quarter || '—'}</td>
    <td>${l.rooms || '—'}</td>
    <td>${l.net_size ? l.net_size + 'm²' : '—'}</td>
    <td style="color:var(--gold);font-weight:600;">${l.price ? fp(l.price) + ' ₺' : '—'}</td>
  </tr>`).join('');
}

function filterListings(q) {
  const filtered = allListings.filter(l =>
    (l.title + ' ' + l.district + ' ' + l.quarter).toLowerCase().includes(q.toLowerCase())
  );
  renderListingsTable(filtered);
}

// SECTION GEÇİŞİ
async function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  document.getElementById('sec-' + name).classList.add('on');
  event.currentTarget.classList.add('on');
  if (name === 'users') renderUsers();
  if (name === 'subscriptions') renderSubscriptions();
  if (name === 'revenue') renderRevenue();
  if (name === 'listings') renderListingsPage();
  if (name === 'admins') renderAdmins();
  if (name === 'logs') {
    await loadLogs(); // Sayfaya geçince taze veri çek
    renderLogs();
  }
  if (window.innerWidth <= 600) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  }
}

// ABONELİK EKLE
function openAddSub() {
  document.getElementById('add-sub-modal').classList.add('open');
  document.getElementById('sub-user-search').value = '';
  document.getElementById('sub-user-results').innerHTML = '';
  document.getElementById('sub-user-id').value = '';
  document.getElementById('sub-user-selected').textContent = '';
  document.getElementById('sub-price').value = '';
}

function closeModal() {
  document.getElementById('add-sub-modal').classList.remove('open');
}

function searchUserForSub(q) {
  if (q.length < 3) { document.getElementById('sub-user-results').innerHTML = ''; return; }
  const results = allUsers.filter(u => u.phone.includes(q) || (u.first_name + ' ' + u.last_name).toLowerCase().includes(q.toLowerCase()));
  document.getElementById('sub-user-results').innerHTML = results.slice(0, 5).map(u =>
    `<div onclick="selectUser('${u.id}','${u.first_name} ${u.last_name}','${u.phone}')"
      style="padding:8px 10px;background:var(--d3);border-radius:6px;margin-bottom:4px;cursor:pointer;font-size:12px;color:var(--tx);">
      ${u.first_name} ${u.last_name} — ${u.phone}
    </div>`).join('');
}

function selectUser(id, name, phone) {
  document.getElementById('sub-user-id').value = id;
  document.getElementById('sub-user-selected').textContent = '✓ ' + name + ' (' + phone + ')';
  document.getElementById('sub-user-results').innerHTML = '';
  document.getElementById('sub-user-search').value = '';
}

async function saveSub() {
  const userId = document.getElementById('sub-user-id').value;
  const plan = document.getElementById('sub-plan').value;
  const price = parseFloat(document.getElementById('sub-price').value);
  const start = document.getElementById('sub-start').value;
  const end = document.getElementById('sub-end').value;

  if (!userId) { showError('Lütfen kullanıcı seçin.', 'Eksik Alan'); return; }
  if (!price || !start || !end) { showError('Lütfen tüm alanları doldurun.', 'Eksik Alan'); return; }

  // Aynı kullanıcıda aktif abonelik var mı kontrol et
  const existingActive = allSubs.find(s => s.user_id === userId && s.status === 'active' && new Date(s.expires_at) > new Date());
  if (existingActive) {
    const expUser = allUsers.find(u => u.id === userId);
    const remainDays = Math.ceil((new Date(existingActive.expires_at) - new Date()) / 86400000);
    showError(
      (expUser ? expUser.first_name + ' ' + expUser.last_name : 'Bu kullanıcı') + ' adlı kullanıcının ' + remainDays + ' gün süresi kalan aktif bir aboneliği bulunuyor. Mevcut abonelik bitmeden yeni abonelik eklenemez.',
      'Aktif Abonelik Mevcut'
    );
    return;
  }

  const r = await fetch(`${SU}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify({ user_id: userId, plan, price, started_at: start, expires_at: end, status: 'active' })
  });

  if (r.ok) {
    const user = allUsers.find(u => u.id === userId);
    logAction('Abonelik eklendi', `${user ? user.first_name + ' ' + user.last_name : userId} - ${plan} - ${fp(price)} ₺`);
    closeModal();
    await loadSubs();
    renderDashboard();
    if (document.getElementById('sec-subscriptions').classList.contains('on')) renderSubscriptions();
    if (document.getElementById('sec-revenue').classList.contains('on')) renderRevenue();
  } else {
    showError('Kayıt sırasında hata oluştu.', 'Hata');
  }
}

async function cancelSub(id) {
  showConfirm('Bu aboneliği iptal etmek istediğinize emin misiniz?', 'Abonelik İptal', async () => {
    await fetch(`${SU}/rest/v1/subscriptions?id=eq.${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: 'cancelled' })
    });
    const cancelledSub = allSubs.find(s => s.id === id);
  const cancelledUser = cancelledSub ? allUsers.find(u => u.id === cancelledSub.user_id) : null;
  const cancelName = cancelledUser ? cancelledUser.first_name + ' ' + cancelledUser.last_name : 'Bilinmiyor';
  logAction('Abonelik iptal edildi', cancelName + ' adlı kullanıcının aboneliği iptal edildi');
    await loadSubs();
    renderSubscriptions();
    showSuccess('Abonelik iptal edildi.', 'İptal Edildi');
  });
}

// MOBİL MENÜ
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

// Global fonksiyonları window'a ata (HTML onclick için)
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.openAddSub = openAddSub;
window.closeModal = closeModal;
window.saveSub = saveSub;
window.cancelSub = cancelSub;
window.searchUserForSub = searchUserForSub;
window.selectUser = selectUser;
window.filterUsers = filterUsers;
window.filterListings = filterListings;
window.filterLogs = filterLogs;

// Plan seçince bitiş tarihi otomatik hesapla
function updateSubEndDate() {
  const plan = document.getElementById('sub-plan').value;
  const start = document.getElementById('sub-start').value;
  if (!start) return;
  const d = new Date(start);
  if (plan === 'Aylık') d.setMonth(d.getMonth() + 1);
  else if (plan === '3 Aylık') d.setMonth(d.getMonth() + 3);
  else if (plan === 'Yıllık') d.setFullYear(d.getFullYear() + 1);
  else return; // Özel - dokunma
  document.getElementById('sub-end').value = d.toISOString().split('T')[0];
  updateDayCount();
}

function updateDayCount() {
  const start = document.getElementById('sub-start').value;
  const end = document.getElementById('sub-end').value;
  const el = document.getElementById('sub-day-count');
  if (!el) return;
  if (start && end) {
    const diff = Math.round((new Date(end) - new Date(start)) / 86400000);
    el.textContent = diff > 0 ? `${diff} gün` : '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sub-plan').addEventListener('change', updateSubEndDate);
  document.getElementById('sub-start').addEventListener('change', () => {
    updateSubEndDate();
  });
  document.getElementById('sub-end').addEventListener('change', () => {
    // Bitiş tarihi elle değiştirilince özele geç
    const plan = document.getElementById('sub-plan').value;
    if (plan !== 'Özel') {
      document.getElementById('sub-plan').value = 'Özel';
    }
    updateDayCount();
  });
});
