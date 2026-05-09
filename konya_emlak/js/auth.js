// ===== AUTH SAYFASI JS =====
let authSmsCode = null, authPhone = null;

function switchAuthTab(tab) {
  document.getElementById('atab-login').classList.toggle('on', tab === 'login');
  document.getElementById('atab-register').classList.toggle('on', tab === 'register');
  document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
  document.getElementById(tab === 'login' ? 'astep-login-tel' : 'astep-register-info').classList.add('on');
}

async function loginSend() {
  const tel = document.getElementById('login-tel').value.trim();
  if (!tel || tel.length < 10 || !tel.startsWith('0')) { showError('Geçerli bir telefon numarası girin (05xx ile başlamalı).', 'Geçersiz Numara'); return; }
  const phone = '+9' + tel.substring(1);
  const btn = document.getElementById('login-send-btn');
  btn.textContent = 'Kontrol ediliyor...'; btn.disabled = true;
  try {
    const r = await fetch(SB_URL + '/rest/v1/users?phone=eq.' + encodeURIComponent(phone) + '&select=id,first_name,phone', { headers: authHeaders() });
    const users = await r.json();
    if (!users.length) { showError('Bu telefon numarası kayıtlı değil. Lütfen önce hesap oluşturun.', 'Kayıt Bulunamadı'); btn.textContent = 'KOD GÖNDER'; btn.disabled = false; return; }
    authPhone = phone;
    authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
    showSMSCode(authSmsCode, tel);
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
    document.getElementById('astep-login-code').classList.add('on');
    document.getElementById('login-code-sub').textContent = tel + ' numarasına kod gönderildi.';
  } catch(e) { showError('Bağlantı hatası: ' + e.message, 'Hata'); }
  btn.textContent = 'KOD GÖNDER'; btn.disabled = false;
}

async function loginVerify() {
  const code = document.getElementById('login-code').value;
  if (!code || code !== authSmsCode) { showError('Girdiğiniz kod hatalı.', 'Hatalı Kod'); return; }
  try {
    const r = await fetch(SB_URL + '/rest/v1/users?phone=eq.' + encodeURIComponent(authPhone) + '&select=*', { headers: authHeaders() });
    const users = await r.json();
    if (!users.length) { showError('Kullanıcı bulunamadı.', 'Hata'); return; }
    const user = users[0];
    await fetch(SB_URL + '/rest/v1/users?id=eq.' + user.id, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ last_login: new Date().toISOString() }) });
    setToken(generateToken(user));
    updateNavForUser({ id: user.id, phone: user.phone, name: user.first_name });
    showSuccess('Hoş geldiniz, ' + user.first_name + '!', 'Giriş Başarılı');
    setTimeout(() => location.href = '/', 1200);
  } catch(e) { showError('Giriş hatası: ' + e.message, 'Hata'); }
}

function loginResend() {
  authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
  showSMSCode(authSmsCode, document.getElementById('login-tel').value);
}

async function registerSend() {
  const first = document.getElementById('reg-first').value.trim();
  const last = document.getElementById('reg-last').value.trim();
  const tel = document.getElementById('reg-tel').value.trim();
  if (!first || !last) { showError('Lütfen ad ve soyadınızı girin.', 'Eksik Alan'); return; }
  if (!tel || tel.length < 10 || !tel.startsWith('0')) { showError('Geçerli bir telefon numarası girin.', 'Geçersiz Numara'); return; }
  const phone = '+9' + tel.substring(1);
  const btn = document.querySelector('#astep-register-info .abtn');
  if (btn) { btn.textContent = 'Kontrol ediliyor...'; btn.disabled = true; }
  try {
    const r = await fetch(SB_URL + '/rest/v1/users?phone=eq.' + encodeURIComponent(phone) + '&select=id', { headers: authHeaders() });
    const existing = await r.json();
    if (existing.length) { showError('Bu telefon numarası zaten kayıtlı.', 'Numara Kayıtlı'); if (btn) { btn.textContent = 'KOD GÖNDER'; btn.disabled = false; } return; }
    authPhone = phone;
    authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
    showSMSCode(authSmsCode, tel);
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
    document.getElementById('astep-register-code').classList.add('on');
    document.getElementById('register-code-sub').textContent = tel + ' numarasına kod gönderildi.';
  } catch(e) { showError('Bağlantı hatası: ' + e.message, 'Hata'); }
  if (btn) { btn.textContent = 'KOD GÖNDER'; btn.disabled = false; }
}

async function registerVerify() {
  const code = document.getElementById('register-code').value;
  if (!code || code !== authSmsCode) { showError('Girdiğiniz kod hatalı.', 'Hatalı Kod'); return; }
  const first = document.getElementById('reg-first').value.trim();
  const last = document.getElementById('reg-last').value.trim();
  try {
    const r = await fetch(SB_URL + '/rest/v1/users', { method: 'POST', headers: { ...authHeaders(), 'Prefer': 'return=representation' }, body: JSON.stringify({ first_name: first, last_name: last, phone: authPhone, created_at: new Date().toISOString(), last_login: new Date().toISOString() }) });
    const data = await r.json();
    if (!r.ok) { showError('Kayıt hatası.', 'Hata'); return; }
    const user = Array.isArray(data) ? data[0] : data;
    setToken(generateToken(user));
    updateNavForUser({ id: user.id, phone: user.phone, name: user.first_name });
    showSuccess('Hesabınız oluşturuldu! Hoş geldiniz, ' + first + '!', 'Kayıt Başarılı');
    setTimeout(() => location.href = '/', 1200);
  } catch(e) { showError('Kayıt hatası: ' + e.message, 'Hata'); }
}

function registerResend() {
  authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
  showSMSCode(authSmsCode, document.getElementById('reg-tel').value);
}

function socialLogin(p) {
  if (p === 'email') { document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on')); document.getElementById('astep-login-email').classList.add('on'); return; }
  showPopup(p + ' entegrasyonu yakında aktif olacak.', 'Yakında', 'ℹ️', 'info');
}
function loginWithEmail() { showPopup('E-posta ile giriş yakında aktif olacak.', 'Yakında', 'ℹ️', 'info'); }
