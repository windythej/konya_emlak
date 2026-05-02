
const SU = 'https://bknfjyfuzbanhoomooth.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbmZqeWZ1emJhbmhvb21vb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODczNDgsImV4cCI6MjA5MzE2MzM0OH0.7Tl3nWspqxDtnhIj2SZju_ObXtjkAsv_n-Joj7vwSx0';

// Adminler - buraya istediğin adminleri ekle
const ADMINS = {
  'admin': 'Admin2026!',
  'batuhan': 'Batuhan2026!'
};

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
    localStorage.setItem('admin_session', JSON.stringify({ user, time: Date.now() }));
    document.getElementById('admin-name-display').textContent = '👤 ' + user;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-page').style.display = 'block';
    err.style.display = 'none';
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
      document.getElementById('admin-name-display').textContent = '👤 ' + s.user;
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
async function loadAll() {
  await Promise.all([loadUsers(), loadSubs(), loadListings()]);
  renderDashboard();
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

  document.getElementById('stat-total-users').textContent = allUsers.length;
  document.getElementById('stat-active-subs').textContent = activeSubs.length;
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
    const isActive = s.status === 'active' && new Date(s.expires_at) > new Date();
    const statusBadge = isActive
      ? '<span class="badge active">Aktif</span>'
      : '<span class="badge expired">Sona Erdi</span>';
    return `<tr>
      <td>${user ? user.first_name + ' ' + user.last_name : '—'}</td>
      ${showActions ? `<td>${user ? user.phone : '—'}</td>` : ''}
      <td>${s.plan}</td>
      <td style="color:var(--gold);font-weight:600;">${fp(s.price)} ₺</td>
      <td>${fdate(s.started_at)}</td>
      <td>${fdate(s.expires_at)}</td>
      <td>${statusBadge}</td>
      ${showActions ? `<td><button onclick="cancelSub('${s.id}')" style="background:transparent;border:1px solid var(--err);border-radius:6px;color:var(--err);font-size:11px;padding:3px 8px;cursor:pointer;">İptal</button></td>` : ''}
    </tr>`;
  }).join('');
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
  document.getElementById('rev-chart').innerHTML = months.map(m => `
    <div class="chart-bar-item">
      <div class="chart-bar" style="height:${Math.max((m.rev/maxRev)*100, 4)}%" title="${fp(m.rev)} ₺"></div>
      <div class="chart-bar-label">${m.label}</div>
    </div>`).join('');

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
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  document.getElementById('sec-' + name).classList.add('on');
  event.currentTarget.classList.add('on');
  if (name === 'users') renderUsers();
  if (name === 'subscriptions') renderSubscriptions();
  if (name === 'revenue') renderRevenue();
  if (name === 'listings') renderListingsPage();
  if (window.innerWidth <= 600) document.getElementById('sidebar').classList.remove('open');
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

  if (!userId) { alert('Kullanıcı seçin.'); return; }
  if (!price || !start || !end) { alert('Tüm alanları doldurun.'); return; }

  const r = await fetch(`${SU}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify({ user_id: userId, plan, price, started_at: start, expires_at: end, status: 'active' })
  });

  if (r.ok) {
    closeModal();
    await loadSubs();
    renderDashboard();
    if (document.getElementById('sec-subscriptions').classList.contains('on')) renderSubscriptions();
    if (document.getElementById('sec-revenue').classList.contains('on')) renderRevenue();
  } else {
    alert('Hata: ' + await r.text());
  }
}

async function cancelSub(id) {
  if (!confirm('Bu aboneliği iptal etmek istediğinize emin misiniz?')) return;
  await fetch(`${SU}/rest/v1/subscriptions?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status: 'cancelled' })
  });
  await loadSubs();
  renderSubscriptions();
}

// MOBİL MENÜ
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Plan seçince bitiş tarihi otomatik hesapla
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sub-plan').addEventListener('change', function() {
    const start = document.getElementById('sub-start').value;
    if (!start) return;
    const d = new Date(start);
    if (this.value === 'Aylık') d.setMonth(d.getMonth() + 1);
    else if (this.value === '3 Aylık') d.setMonth(d.getMonth() + 3);
    else if (this.value === 'Yıllık') d.setFullYear(d.getFullYear() + 1);
    document.getElementById('sub-end').value = d.toISOString().split('T')[0];
  });
});
