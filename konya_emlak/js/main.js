
// ===== POPUP SİSTEMİ =====
function showPopup(msg, title='Bilgi', icon='ℹ️', type='info') {
  document.getElementById('popup-icon').textContent = icon;
  document.getElementById('popup-title').textContent = title;
  document.getElementById('popup-msg').textContent = msg;
  const btn = document.getElementById('popup-ok');
  btn.className = 'popup-btn' + (type==='danger' ? ' danger' : '');
  document.getElementById('popup-overlay').classList.add('open');
}
function showSuccess(msg, title='Başarılı') { showPopup(msg, title, '✅', 'success'); }
function showError(msg, title='Hata') { showPopup(msg, title, '❌', 'danger'); }
function showInfo(msg, title='Bilgi') { showPopup(msg, title, 'ℹ️', 'info'); }
function showSMSCode(code, tel) {
  document.getElementById('popup-icon').textContent = '📱';
  document.getElementById('popup-title').textContent = 'SMS Doğrulama Kodu';
  document.getElementById('popup-msg').textContent = tel + ' numarasına gönderilen kod: ' + code + '\n\n(Gerçek sistemde SMS ile iletilir)';
  document.getElementById('popup-ok').className = 'popup-btn';
  document.getElementById('popup-overlay').classList.add('open');
}
function closePopup() { document.getElementById('popup-overlay').classList.remove('open'); }
document.getElementById('popup-overlay').addEventListener('click', function(e) {
  if (e.target === this) closePopup();
});

const SU='https://bknfjyfuzbanhoomooth.supabase.co',SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbmZqeWZ1emJhbmhvb21vb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODczNDgsImV4cCI6MjA5MzE2MzM0OH0.7Tl3nWspqxDtnhIj2SZju_ObXtjkAsv_n-Joj7vwSx0';
let all=[],filtered=[],dMap=null,gImgs=[],gIdx=0;
const F={district:'',quarter:'',rooms:'',heating:'',features:[],min:null,max:null};

const fp=n=>new Intl.NumberFormat('tr-TR').format(n);
const gi=l=>Array.isArray(l.images)?l.images:(typeof l.images==='string'?JSON.parse(l.images||'[]'):[]);

async function load(){
  const btn=document.getElementById('sbtn');
  btn.textContent='Yükleniyor...';btn.disabled=true;
  document.getElementById('listv').innerHTML='<div class="loader"><div class="spin"></div><p>İlanlar getiriliyor...</p></div>';
  try{
    const r=await fetch(`${SU}/rest/v1/listings?select=*`,{headers:{'apikey':SK,'Authorization':`Bearer ${SK}`}});
    all=await r.json();
    buildD();buildQ();apply();populateValDistricts();
  }catch(e){document.getElementById('listv').innerHTML=`<div class="empty"><h3>Hata</h3><p>${e.message}</p></div>`;}
  btn.textContent='İlanları Getir';btn.disabled=false;
}

function buildD(){
  const ds=[...new Set(all.map(l=>l.district).filter(Boolean))].sort();
  const c=document.getElementById('dc');
  c.innerHTML='<button class="chip on" data-value="">Tümü</button>';
  ds.forEach(d=>{const b=document.createElement('button');b.className='chip';b.dataset.value=d;b.textContent=d;c.appendChild(b);});
  c.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.district=b.dataset.value;F.quarter='';buildQ();apply();}));
  if(document.getElementById('dc-m'))buildD_m();
}

function buildQ(){
  const src=F.district?all.filter(l=>l.district===F.district):all;
  const qs=[...new Set(src.map(l=>l.quarter).filter(Boolean))].sort();
  const c=document.getElementById('qc');
  c.innerHTML='<button class="chip on" data-value="">Tümü</button>';
  qs.forEach(q=>{const b=document.createElement('button');b.className='chip';b.dataset.value=q;b.textContent=q;c.appendChild(b);});
  c.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.quarter=b.dataset.value;apply();}));
  if(document.getElementById('qc-m'))buildQ_m();
}

function apply(){
  let d=[...all];
  if(F.district)d=d.filter(l=>l.district===F.district);
  if(F.quarter)d=d.filter(l=>l.quarter===F.quarter);
  if(F.rooms)d=d.filter(l=>l.rooms===F.rooms);
  if(F.heating)d=d.filter(l=>l.heating_type&&l.heating_type.toLowerCase().includes(F.heating.toLowerCase()));
  if(F.min)d=d.filter(l=>l.price>=F.min);
  if(F.max)d=d.filter(l=>l.price<=F.max);
  F.features.forEach(f=>{
    if(f==='balcony')d=d.filter(l=>l.balcony==='Var');
    else if(f==='elevator')d=d.filter(l=>l.elevator==='Var');
    else if(f==='parking')d=d.filter(l=>l.parking&&l.parking!=='Yok');
    else if(f==='inComplex')d=d.filter(l=>l.in_complex==='Evet');
    else d=d.filter(l=>Array.isArray(l.features)&&l.features.includes(f));
  });
  filtered=d;sortRender();
}

function sortRender(){
  const s=document.getElementById('sort').value;
  let d=[...filtered];
  if(s==='price_asc')d.sort((a,b)=>a.price-b.price);
  else if(s==='price_desc')d.sort((a,b)=>b.price-a.price);
  else if(s==='m2_asc')d.sort((a,b)=>(a.price/(a.net_size||1))-(b.price/(b.net_size||1)));
  else if(s==='m2_desc')d.sort((a,b)=>(b.price/(b.net_size||1))-(a.price/(a.net_size||1)));
  renderStats(d);
  if(document.getElementById('vm').classList.contains('on'))renderMap(d);
  else renderList(d);
}

function renderStats(d){
  const s=document.getElementById('stats'),r=document.getElementById('rh');
  if(!d.length){s.style.display='none';r.style.display='none';return;}
  s.style.display='grid';r.style.display='flex';
  const avg=Math.round(d.reduce((x,l)=>x+l.price,0)/d.length);
  const wm=d.filter(l=>l.net_size>0);
  const am=wm.length?Math.round(wm.reduce((x,l)=>x+(l.price/l.net_size),0)/wm.length):0;
  document.getElementById('sc').textContent=d.length;
  document.getElementById('sa').textContent=fp(avg)+' ₺';
  document.getElementById('sm').textContent=fp(am)+' ₺';
  document.getElementById('rcnt').textContent=d.length;
}

function renderList(d){
  document.getElementById('mapv').style.display='none';
  const c=document.getElementById('listv');c.style.display='flex';
  if(!d.length){c.innerHTML='<div class="empty"><h3>İlan bulunamadı</h3><p>Farklı filtreler deneyin.</p></div>';return;}
  const avg=d.reduce((x,l)=>x+l.price,0)/d.length;
  c.innerHTML=d.map((l,i)=>{
    const imgs=gi(l),m2p=l.net_size>0?Math.round(l.price/l.net_size):null;
    const isLow=l.price<avg*.85,isHigh=l.price>avg*1.2;
    const hasEb=Array.isArray(l.features)&&l.features.includes('Ebeveyn Banyosu');
    return `<div class="card" style="animation-delay:${i*.04}s;" data-id="${l.id}">
      <div class="ci">
        <div class="cimg">
          ${imgs[0]?`<img src="${imgs[0]}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=noimg>🏠</div>'"><div class="icnt">📷 ${imgs.length}</div>`:'<div class="noimg">🏠</div>'}
        </div>
        <div class="cbody">
          <div>
            <div class="cloc"><div class="ldot"></div>${[l.quarter,l.district].filter(Boolean).join(' · ')}</div>
            <div class="cline"></div>
            <div class="ctitle">${l.title||'İlan'}</div>
            <div class="cmeta">
              ${l.rooms?`<span class="mt hl">🛏 ${l.rooms}</span>`:''}
              ${l.gross_size?`<span class="mt">⬛ ${l.gross_size}m²</span>`:''}
              ${l.net_size?`<span class="mt">⬜ ${l.net_size}m² net</span>`:''}
              ${l.heating_type?`<span class="mt">🔥 ${l.heating_type}</span>`:''}
              ${l.building_age?`<span class="mt">🏛 ${l.building_age}</span>`:''}
              ${l.floor?`<span class="mt">📐 ${l.floor}. kat</span>`:''}
            </div>
          </div>
          <div class="cfoot">
            <div class="pills">
              <span class="pl ${l.balcony==='Var'?'ok':'no'}">${l.balcony==='Var'?'✓':'✗'} Balkon</span>
              <span class="pl ${l.elevator==='Var'?'ok':'no'}">${l.elevator==='Var'?'✓':'✗'} Asansör</span>
              <span class="pl ${l.parking&&l.parking!=='Yok'?'ok':'no'}">${l.parking&&l.parking!=='Yok'?'✓':'✗'} Otopark</span>
              <span class="pl ${hasEb?'ok':'no'}">${hasEb?'✓':'✗'} Ebev. Banyo</span>
            </div>
            <div class="cpb">
              <div class="cp">${fp(l.price)} ₺</div>
              ${m2p?`<div class="cm2">${fp(m2p)} ₺/m²</div>`:''}
              ${isLow?'<span class="bdg low">Uygun Fiyat</span>':''}
              ${isHigh?'<span class="bdg high">Piyasa Üstü</span>':''}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  c.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click',()=>{const l=all.find(x=>x.id===card.dataset.id);if(l)openDrawer(l);});
  });
}

let leafMap=null;
function renderMap(d){
  const mv=document.getElementById('mapv');
  mv.style.display='block';document.getElementById('listv').style.display='none';
  const pts=d.filter(l=>l.latitude&&l.longitude);
  if(!leafMap){
    const ctr=pts.length?[pts[0].latitude,pts[0].longitude]:[37.87,32.49];
    leafMap=L.map('mapv').setView(ctr,12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(leafMap);
  }
  leafMap.eachLayer(l=>{if(l instanceof L.Marker)leafMap.removeLayer(l);});
  const avg=d.length?d.reduce((x,l)=>x+l.price,0)/d.length:0;
  pts.forEach(l=>{
    const isLow=l.price<avg*.85;
    const icon=L.divIcon({className:'',html:`<div style="background:${isLow?'#4CAF82':'#C9A84C'};width:11px;height:11px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`,iconSize:[15,15]});
    L.marker([l.latitude,l.longitude],{icon}).addTo(leafMap)
      .bindPopup(`<div style="font-family:'DM Sans',sans-serif;min-width:170px"><strong style="font-size:13px">${fp(l.price)} ₺</strong><br><span style="font-size:11px;color:#555">${l.rooms||''} · ${l.net_size||'?'}m² · ${l.quarter||''}</span></div>`)
      .on('click',()=>openDrawer(l));
  });
  if(pts.length){leafMap.fitBounds(L.latLngBounds(pts.map(l=>[l.latitude,l.longitude])),{padding:[30,30]});setTimeout(()=>leafMap.invalidateSize(),100);}
}

function openDrawer(l){
  gImgs=gi(l);gIdx=0;renderGal();
  document.getElementById('dloc').innerHTML=`<div class="ldot"></div>${[l.quarter,l.district,l.city].filter(Boolean).join(' · ')}`;
  document.getElementById('dtitle').textContent=l.title||'İlan';
  document.getElementById('dpr').textContent=fp(l.price)+' ₺';
  const m2p=l.net_size>0?Math.round(l.price/l.net_size):null;
  document.getElementById('dm2p').textContent=m2p?`${fp(m2p)} ₺/m²`:'';
  document.getElementById('dgrid').innerHTML=[
    ['Oda Sayısı',l.rooms],['Brüt m²',l.gross_size?l.gross_size+'m²':'—'],
    ['Net m²',l.net_size?l.net_size+'m²':'—'],['Isıtma',l.heating_type||'—'],
    ['Bina Yaşı',l.building_age||'—'],['Bulunduğu Kat',l.floor?l.floor+'. kat':'—'],
    ['Toplam Kat',l.total_floors||'—'],['Banyo',l.bathroom_count||'—'],
    ['Kullanım',l.usage_status||'—'],['Tapu',l.deed_status||'—'],
    ['Kimden',l.listing_from||'—'],['Kredi',l.loan_eligible||'—']
  ].map(([k,v])=>`<div class="di"><div class="dil">${k}</div><div class="div">${v||'—'}</div></div>`).join('');
  const fl=Array.isArray(l.features)?l.features:[];
  const kf=['Ebeveyn Banyosu','Jakuzi','Duşakabin','Ankastre Fırın','Gömme Dolap','Parke Zemin','24 Saat Güvenlik','Isı Yalıtımı','Kamera Sistemi','Görüntülü Diyafon'];
  document.getElementById('dfeats').innerHTML=[
    ...kf.map(f=>`<span class="df ${fl.includes(f)?'ok':''}">${fl.includes(f)?'✓ ':''} ${f}</span>`),
    ...[['Balkon',l.balcony==='Var'],['Asansör',l.elevator==='Var'],['Otopark',l.parking&&l.parking!=='Yok'],['Site İçi',l.in_complex==='Evet']]
      .map(([n,v])=>`<span class="df ${v?'ok':''}">${v?'✓ ':''} ${n}</span>`)
  ].join('');
  document.getElementById('dsel').innerHTML=`${l.storeLogoUrl?`<img class="sav" src="${l.storeLogoUrl}" alt="" onerror="this.style.display='none'">`:''}<div><div class="sname">${l.storeName||l.sellerName||'Satıcı'}</div><div class="sdet">${l.listing_from||''}</div></div>`;
  document.getElementById('dmap').innerHTML='';
  if(l.latitude&&l.longitude){
    setTimeout(()=>{
      if(dMap){dMap.remove();dMap=null;}
      dMap=L.map('dmap').setView([l.latitude,l.longitude],15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:''}).addTo(dMap);
      L.marker([l.latitude,l.longitude]).addTo(dMap);
      dMap.invalidateSize();
    },350);
  }
  document.getElementById('dcta').innerHTML=`${l.url?`<a class="ctap" href="${l.url}" target="_blank">Sahibinden'de Gör →</a>`:''}<button class="ctas" onclick="closeDrawer()">Kapat</button>`;
  document.getElementById('ov').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').scrollTop=0;
}

function renderGal(){
  const g=document.getElementById('dgal'),t=document.getElementById('dthumbs');
  if(!gImgs.length){g.innerHTML='<div class="nogal">🏠</div>';t.innerHTML='';return;}
  g.innerHTML=`<img class="gmain" id="gmain" src="${gImgs[gIdx]}" alt=""><button class="gprev" onclick="galN(-1)">‹</button><button class="gnext" onclick="galN(1)">›</button><div class="gctr" id="gctr">${gIdx+1} / ${gImgs.length}</div>`;
  t.innerHTML=gImgs.slice(0,12).map((img,i)=>`<img class="thumb ${i===gIdx?'on':''}" src="${img}" onclick="galTo(${i})" alt="" onerror="this.style.display='none'">`).join('');
}
function galN(dir){gIdx=(gIdx+dir+gImgs.length)%gImgs.length;updGal();}
function galTo(i){gIdx=i;updGal();}
function updGal(){
  const m=document.getElementById('gmain'),c=document.getElementById('gctr');
  if(m)m.src=gImgs[gIdx];if(c)c.textContent=`${gIdx+1} / ${gImgs.length}`;
  document.querySelectorAll('.thumb').forEach((t,i)=>t.classList.toggle('on',i===gIdx));
}
function closeDrawer(){
  document.getElementById('ov').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  if(dMap){dMap.remove();dMap=null;}
}

// ===== AUTH SİSTEMİ =====
let currentUser = null;
let authSmsCode = null;
let authPhone = null;

// Token yönetimi
function generateToken(user) {
  const payload = { id: user.id, phone: user.phone, name: user.first_name, exp: Date.now() + 86400000 };
  return btoa(JSON.stringify(payload));
}
function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) { localStorage.removeItem('emlak_token'); return null; }
    return payload;
  } catch { return null; }
}
function getToken() { return localStorage.getItem('emlak_token'); }
function setToken(token) { localStorage.setItem('emlak_token', token); }
function removeToken() { localStorage.removeItem('emlak_token'); }

// Auth header - token varsa ekle
function authHeaders() {
  return { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json' };
}

// Giriş kontrolü - sayfa açılınca
function checkAuth() {
  const token = getToken();
  if (token) {
    const user = parseToken(token);
    if (user) {
      currentUser = user;
      onLoginSuccess(user);
      return;
    }
  }
  document.getElementById('auth-overlay').style.display = 'flex';
}

function onLoginSuccess(user) {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('site-content').style.display = 'block';
  document.getElementById('user-bar').style.display = 'flex';
  document.getElementById('user-name-display').textContent = user.name;
  currentUser = user;
}

function switchAuthTab(tab) {
  document.getElementById('atab-login').classList.toggle('on', tab === 'login');
  document.getElementById('atab-register').classList.toggle('on', tab === 'register');
  document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
  if (tab === 'login') document.getElementById('astep-login-tel').classList.add('on');
  else document.getElementById('astep-register-info').classList.add('on');
}

// GİRİŞ
async function loginSend() {
  const tel = document.getElementById('login-tel').value.trim();
  if (!tel || tel.length < 10 || !tel.startsWith('0')) {
    showError('Geçerli bir telefon numarası girin (05xx ile başlamalı).', 'Geçersiz Numara'); return;
  }
  const phone = '+9' + tel.substring(1);
  const btn = document.getElementById('login-send-btn');
  btn.textContent = 'Kontrol ediliyor...'; btn.disabled = true;

  try {
    // Kullanıcı var mı kontrol et
    const res = await fetch(`${SU}/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=id,first_name,phone`, {
      headers: authHeaders()
    });
    const users = await res.json();
    if (!users.length) {
      showError('Bu telefon numarası kayıtlı değil. Lütfen önce hesap oluşturun.', 'Kayıt Bulunamadı');
      btn.textContent = 'KOD GÖNDER'; btn.disabled = false; return;
    }
    authPhone = phone;
    authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
    showSMSCode(authSmsCode, tel);
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
    document.getElementById('astep-login-code').classList.add('on');
    document.getElementById('login-code-sub').textContent = tel + ' numarasına kod gönderildi.';
  } catch(e) {
    showError('Bağlantı hatası: ' + e.message, 'Hata');
  }
  btn.textContent = 'KOD GÖNDER'; btn.disabled = false;
}

async function loginVerify() {
  const code = document.getElementById('login-code').value;
  if (!code || code.length < 4) { showError('Lütfen doğrulama kodunu girin.', 'Eksik Kod'); return; }
  if (code !== authSmsCode) { showError('Girdiğiniz kod hatalı. Tekrar deneyin.', 'Hatalı Kod'); return; }

  try {
    const res = await fetch(`${SU}/rest/v1/users?phone=eq.${encodeURIComponent(authPhone)}&select=*`, {
      headers: authHeaders()
    });
    const users = await res.json();
    if (!users.length) { showError('Kullanıcı bulunamadı.', 'Hata'); return; }
    const user = users[0];

    // Son giriş güncelle
    await fetch(`${SU}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ last_login: new Date().toISOString() })
    });

    const token = generateToken(user);
    setToken(token);
    onLoginSuccess({ id: user.id, phone: user.phone, name: user.first_name });
    showSuccess('Hoş geldiniz, ' + user.first_name + '!', 'Giriş Başarılı');
  } catch(e) {
    showError('Giriş hatası: ' + e.message, 'Hata');
  }
}

function loginResend() {
  authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
  showSMSCode(authSmsCode, document.getElementById('login-tel').value);
}

// KAYIT
async function registerSend() {
  const first = document.getElementById('reg-first').value.trim();
  const last = document.getElementById('reg-last').value.trim();
  const tel = document.getElementById('reg-tel').value.trim();

  if (!first) { showError('Lütfen adınızı girin.', 'Eksik Alan'); return; }
  if (!last) { showError('Lütfen soyadınızı girin.', 'Eksik Alan'); return; }
  if (!tel || tel.length < 10 || !tel.startsWith('0')) {
    showError('Geçerli bir telefon numarası girin.', 'Geçersiz Numara'); return;
  }

  const phone = '+9' + tel.substring(1);
  const btn = document.querySelector('#astep-register-info .abtn');
  btn.textContent = 'Kontrol ediliyor...'; btn.disabled = true;

  try {
    // Numara kayıtlı mı?
    const res = await fetch(`${SU}/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&select=id`, {
      headers: authHeaders()
    });
    const existing = await res.json();
    if (existing.length) {
      showError('Bu telefon numarası zaten kayıtlı. Giriş yapmayı deneyin.', 'Numara Kayıtlı');
      btn.textContent = 'KOD GÖNDER'; btn.disabled = false; return;
    }

    authPhone = phone;
    authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
    showSMSCode(authSmsCode, tel);
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
    document.getElementById('astep-register-code').classList.add('on');
    document.getElementById('register-code-sub').textContent = tel + ' numarasına kod gönderildi.';
  } catch(e) {
    showError('Bağlantı hatası: ' + e.message, 'Hata');
  }
  btn.textContent = 'KOD GÖNDER'; btn.disabled = false;
}

async function registerVerify() {
  const code = document.getElementById('register-code').value;
  if (!code || code.length < 4) { showError('Lütfen doğrulama kodunu girin.', 'Eksik Kod'); return; }
  if (code !== authSmsCode) { showError('Girdiğiniz kod hatalı. Tekrar deneyin.', 'Hatalı Kod'); return; }

  const first = document.getElementById('reg-first').value.trim();
  const last = document.getElementById('reg-last').value.trim();

  try {
    const res = await fetch(`${SU}/rest/v1/users`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify({ first_name: first, last_name: last, phone: authPhone, created_at: new Date().toISOString(), last_login: new Date().toISOString() })
    });
    const data = await res.json();
    if (!res.ok) { showError('Kayıt hatası: ' + JSON.stringify(data), 'Hata'); return; }
    const user = Array.isArray(data) ? data[0] : data;
    const token = generateToken(user);
    setToken(token);
    onLoginSuccess({ id: user.id, phone: user.phone, name: user.first_name });
    showSuccess('Hesabınız oluşturuldu! Hoş geldiniz, ' + first + '!', 'Kayıt Başarılı');
  } catch(e) {
    showError('Kayıt hatası: ' + e.message, 'Hata');
  }
}

function registerResend() {
  authSmsCode = String(Math.floor(1000 + Math.random() * 9000));
  showSMSCode(authSmsCode, document.getElementById('reg-tel').value);
}

function logout() {
  removeToken();
  currentUser = null;
  document.getElementById('site-content').style.display = 'none';
  document.getElementById('user-bar').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'flex';
  document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
  document.getElementById('astep-login-tel').classList.add('on');
  document.getElementById('login-tel').value = '';
  document.getElementById('login-code').value = '';
  showInfo('Çıkış yapıldı. Görüşmek üzere!', 'Çıkış');
}

// Sayfa açılınca auth kontrol
window.addEventListener('DOMContentLoaded', checkAuth);

// ===== DEĞERLEME SİSTEMİ =====

// Konya mahalle veritabanı
const KONYA_MAHALLELER = {
  'Selçuklu': ['Yazır Mh.','Sancak Mh.','Şeker Mh.','Beyhekim Mh.','Binkonutlar Mh.','Dumlupınar Mh.','Musalla Bağları Mh.','Bosna Mh.','Aydınlıkevler Mh.','Işıklar Mh.','Gödene Mh.','Nalçacı Mh.','Adakale Mh.','Dikilitaş Mh.','Horozluhan Mh.','Selçuklu Mh.'],
  'Meram': ['Yaka Mh.','Yeni Meram Mh.','Meram Dere Mh.','Karahüyük Mh.','Çarıklar Mh.','Aksinne Mh.','Feritköy Mh.','Hoca Cihan Mh.','Harmancık Mh.','Ladik Mh.','Sille Mh.','Kayacık Mh.'],
  'Karatay': ['Emirgazi Mh.','Fetih Cd.','Akabe Mh.','Şehit Mehmetçik Mh.','Büyük Kayacık Mh.','Gazi Mh.','Hacı Musa Mh.','İsmet Paşa Mh.','Karakurt Mh.','Sarıyakup Mh.'],
  'Akşehir': ['Cumhuriyet Mh.','Atatürk Mh.','Durak Mh.','Kılıçarslan Mh.','Tekke Mh.'],
  'Beyşehir': ['Hükümet Mh.','Çarşı Mh.','Yenikent Mh.','Dedegül Mh.'],
  'Ereğli': ['Cumhuriyet Mh.','Yenidoğan Mh.','Bahçelievler Mh.','Karapınar Mh.','Fevzi Çakmak Mh.'],
  'Seydişehir': ['Cumhuriyet Mh.','Atatürk Mh.','Yeni Mh.','Sanayi Mh.'],
};

function populateValDistricts() {
  const ds = [...new Set(all.map(l => l.district).filter(Boolean))].sort();
  const sel = document.getElementById('v-district');
  const cur = sel.value;
  sel.innerHTML = '<option value="">İlçe seçin...</option>';
  // Önce veritabanındaki ilçeler
  ds.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; sel.appendChild(o); });
  // Eksik ilçeleri de ekle
  const extra = ['Akşehir','Beyşehir','Cihanbeyli','Çumra','Ereğli','Ilgın','Kadınhanı','Kulu','Sarayönü','Seydişehir','Yunak','Ahırlı','Akören','Altınekin','Bozkır','Derbent','Derebucak','Doğanhisar','Emirgazi','Güneysınır','Hadim','Halkapınar','Hüyük','Taşkent','Tuzlukçu','Yalıhüyük','Çeltik'];
  extra.forEach(d => {
    if (!ds.includes(d)) { const o = document.createElement('option'); o.value = d; o.textContent = d; sel.appendChild(o); }
  });
  if (cur) sel.value = cur;
}

function populateValQuarters(district) {
  const sel = document.getElementById('v-quarter');
  // Önce gerçek veriden mahalleler
  const fromDB = [...new Set(all.filter(l => l.district === district).map(l => l.quarter).filter(Boolean))].sort();
  // Sonra sabit listeden
  const fromList = KONYA_MAHALLELER[district] || [];
  const combined = [...new Set([...fromDB, ...fromList])].sort();
  sel.innerHTML = '<option value="">Mahalle seçin (isteğe bağlı)</option>';
  combined.forEach(q => { const o = document.createElement('option'); o.value = q; o.textContent = q; sel.appendChild(o); });
}

document.getElementById('v-district').addEventListener('change', function() {
  populateValQuarters(this.value);
});

// Adım geçişi
function vstepNext(step) {
  // Validasyon
  if (step === 2) {
    if (!document.getElementById('v-district').value) { showError('Lütfen ilçe seçin.', 'Eksik Alan'); return; return; }
  }
  if (step === 3) {
    const rooms = document.querySelector('#v-rooms-chips .vchip.on');
    const m2 = document.getElementById('v-m2').value;
    if (!rooms) { showError('Lütfen oda sayısı seçin.', 'Eksik Alan'); return; return; }
    if (!m2 || m2 < 20) { showError('Lütfen geçerli bir m² değeri girin (min 20).', 'Eksik Alan'); return; return; }
  }
  if (step === 4) {
    calcVal();
    if (!calcResult) {
      document.querySelectorAll('.vstep').forEach(s => s.style.display = 'none');
      document.getElementById('v-empty').style.display = 'block';
      return;
    }
  }
  document.querySelectorAll('.vstep').forEach(s => s.style.display = 'none');
  const el = document.getElementById('vstep-' + step);
  if (el) el.style.display = 'block';
}

// Chip seçimi
document.getElementById('v-rooms-chips').addEventListener('click', e => {
  if (!e.target.matches('.vchip')) return;
  document.querySelectorAll('#v-rooms-chips .vchip').forEach(x => x.classList.remove('on'));
  e.target.classList.add('on');
});
document.getElementById('v-heat-chips').addEventListener('click', e => {
  if (!e.target.matches('.vchip')) return;
  document.querySelectorAll('#v-heat-chips .vchip').forEach(x => x.classList.remove('on'));
  e.target.classList.add('on');
});
document.querySelectorAll('.vtog').forEach(t => t.addEventListener('click', () => {
  t.classList.toggle('on');
  t.querySelector('.vtdot').style.cssText = t.classList.contains('on') ? '' : '';
}));

// Değerleme hesapla
let calcResult = null;
function calcVal() {
  const district = document.getElementById('v-district').value;
  const quarter = document.getElementById('v-quarter').value;
  const rooms = document.querySelector('#v-rooms-chips .vchip.on')?.dataset.value;
  const m2 = parseFloat(document.getElementById('v-m2').value);
  const age = parseFloat(document.getElementById('v-age').value) || 0;
  const selFeats = [...document.querySelectorAll('.vtog.on')].map(t => t.dataset.feat);

  // Filtrele — geniş → dar
  let pool = [...all].filter(l => l.district === district && l.rooms === rooms && l.net_size > 0);
  let byQ = quarter ? pool.filter(l => l.quarter === quarter) : [];
  let usedPool = byQ.length >= 3 ? byQ : pool;
  let scopeLabel = byQ.length >= 3 ? quarter : district + ' geneli';

  if (usedPool.length === 0) { calcResult = null; return; }

  const m2Prices = usedPool.map(l => l.price / l.net_size);
  const avgM2 = m2Prices.reduce((a,b) => a+b, 0) / m2Prices.length;
  const avgTotal = usedPool.reduce((a,l) => a+l.price, 0) / usedPool.length;

  // Bina yaşı katsayısı
  let ageFactor = age <= 2 ? 1.08 : age <= 5 ? 1.04 : age <= 10 ? 1.00 : age <= 20 ? 0.95 : age <= 30 ? 0.88 : 0.80;

  // Özellik bonusu
  let bonus = 1;
  if (selFeats.includes('Ebeveyn Banyosu')) bonus += 0.02;
  if (selFeats.includes('elevator')) bonus += 0.015;
  if (selFeats.includes('parking')) bonus += 0.02;
  if (selFeats.includes('inComplex')) bonus += 0.025;
  if (selFeats.includes('balcony')) bonus += 0.01;
  if (selFeats.includes('Jakuzi')) bonus += 0.015;
  if (selFeats.includes('24 Saat Güvenlik')) bonus += 0.01;

  const estimated = Math.round(avgM2 * m2 * ageFactor * bonus);
  const real = Math.round(estimated * 0.92); // %8 pazarlık payı
  const low = Math.round(estimated * 0.90);
  const high = Math.round(estimated * 1.10);

  calcResult = { usedPool, avgTotal, avgM2, estimated, real, low, high, scopeLabel, rooms, m2, age };
}

// SMS SİSTEMİ
let smsCode = null;
function smsSend() {
  const tel = document.getElementById('v-tel').value.replace(/\s/g,'');
  if (tel.length < 10 || !tel.startsWith('0')) { showError('Lütfen geçerli bir telefon numarası girin.', 'Geçersiz Numara'); return; return; }

  // Gerçek SMS olmadığı için 4 haneli kod simüle ediyoruz
  smsCode = String(Math.floor(1000 + Math.random() * 9000));
  console.log('SMS Kodu (test):', smsCode, '| Tel:', tel);

  // Prodüksiyon için buraya gerçek SMS API (Twilio, Netgsm vs) entegre edilecek
  showSMSCode(smsCode, document.getElementById('v-tel').value);

  document.getElementById('sms-tel-step').style.display = 'none';
  document.getElementById('sms-code-step').style.display = 'block';
}

function smsVerify() {
  const entered = document.getElementById('v-code').value;
  if (!entered || entered.length < 4) { showError('Lütfen doğrulama kodunu girin.', 'Eksik Kod'); return; return; }
  if (entered !== smsCode) { showError('Girdiğiniz kod hatalı. Lütfen tekrar deneyin.', 'Hatalı Kod'); return; return; }

  // Doğrulama başarılı — sonucu göster
  document.getElementById('vstep-4').style.display = 'none';
  showValResult();
}

function smsResend() {
  document.getElementById('sms-tel-step').style.display = 'block';
  document.getElementById('sms-code-step').style.display = 'none';
  document.getElementById('v-code').value = '';
}

async function showValResult() {
  if (!calcResult) {
    document.getElementById('v-empty').style.display = 'block';
    return;
  }
  const r = calcResult;
  document.getElementById('vr-count').textContent = r.usedPool.length + ' ilan';
  document.getElementById('vr-avg').textContent = fp(Math.round(r.avgTotal)) + ' ₺';
  document.getElementById('vr-m2').textContent = fp(Math.round(r.avgM2)) + ' ₺/m²';
  document.getElementById('vr-est').textContent = fp(r.estimated) + ' ₺';
  document.getElementById('vr-real').textContent = fp(r.real) + ' ₺';
  document.getElementById('vr-note').textContent = r.scopeLabel + ' · ' + r.rooms + ' · ' + r.m2 + 'm²' + (r.age ? ' · ' + r.age + ' yaş' : '');
  document.getElementById('vr-range').textContent = 'Fiyat aralığı: ' + fp(r.low) + ' ₺ — ' + fp(r.high) + ' ₺';

  // Benzer ilanlar tablosu
  const similar = r.usedPool.slice(0, 5);
  document.getElementById('vr-similar').innerHTML = similar.map(l => `
    <tr>
      <td>${l.quarter || l.district || '—'}</td>
      <td>${l.net_size || '—'} m²</td>
      <td>${l.building_age || '—'}</td>
      <td style="color:var(--gold);font-weight:600;">${fp(l.price)} ₺</td>
    </tr>
  `).join('');

  document.getElementById('v-result').style.display = 'block';
  document.getElementById('v-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // AI Analizi
  await generateAIAnalysis(r);
}

function generateAIAnalysis(r) {
  const aiBox = document.getElementById('vr-ai');
  const aiText = document.getElementById('vr-ai-text');
  aiBox.style.display = 'block';
  aiText.innerHTML = '<span class="ai-loading">▋ Analiz hazırlanıyor...</span>';

  // Bölge değerlendirmesi
  const m2Formatted = fp(Math.round(r.avgM2));
  const estFormatted = fp(r.estimated);
  const lowFormatted = fp(r.low);
  const highFormatted = fp(r.high);
  const realFormatted = fp(r.real);

  // Bina yaşı yorumu
  let yasYorum = '';
  const age = parseFloat(document.getElementById('v-age').value) || 0;
  if (age <= 2) yasYorum = 'Sıfır veya çok yeni yapı olması mülkün hem oturuma hazır hem de yatırım değerini güçlü kılmaktadır.';
  else if (age <= 5) yasYorum = 'Yeni yapı olması mülkün bakım maliyetlerini düşük tutmakta ve alıcılar için cazip bir seçenek oluşturmaktadır.';
  else if (age <= 10) yasYorum = 'Bina yaşının makul seviyede olması, mülkün hem kullanım kalitesini hem de piyasa değerini olumlu yönde korumaktadır.';
  else if (age <= 20) yasYorum = 'Binanın orta yaşlı olması fiyatı bölge ortalamasının hafif altında tutmakta, bu durum alıcılar için avantajlı bir fırsat sunmaktadır.';
  else yasYorum = 'Bina yaşının yüksek olması fiyatı bölge ortalamasının altında tutmaktadır. Renovasyon potansiyeli taşıyan mülkler yatırımcılar için fırsat oluşturabilir.';

  // İlan sayısı yorumu
  let veriYorum = r.usedPool.length >= 10
    ? `${r.usedPool.length} benzer ilan incelenerek`
    : `Bölgedeki mevcut ${r.usedPool.length} benzer ilan baz alınarak`;

  const analiz = `${r.scopeLabel} bölgesindeki güncel piyasa verileri ve benzer ilanlar incelendiğinde, ${r.m2} m² büyüklüğündeki ${r.rooms} tipi konutunuz için belirlenen ${m2Formatted} TL/m² ortalama birim fiyat, bölge rayiçlerine uygun ve makul bir seviyededir. ${yasYorum} ${veriYorum} hesaplanan tahmini piyasa değeri ${estFormatted} TL olup, ${lowFormatted} TL ile ${highFormatted} TL aralığındaki fiyatlandırma bölgenin mevcut koşullarına göre gerçekçi bir piyasa beklentisidir.

**Satıcı için öneri:** İç kondisyon ve bina bakımı iyiyse ${fp(Math.round(r.estimated * 1.05))} TL bandından pazarlığa başlanması, alıcıya makul bir indirim payı bırakırken hedef satış fiyatına ulaşmayı kolaylaştıracaktır.

**Alıcı için öneri:** Bölgedeki arz koşulları göz önüne alındığında ${realFormatted} TL altındaki tekliflerin fırsat olarak değerlendirilmesi ve ${fp(Math.round(r.estimated * 0.95))} TL civarında pazarlık başlatılması tavsiye edilir.`;

  // Typewriter efekti
  setTimeout(() => {
    aiText.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      aiText.textContent += analiz[i];
      i++;
      if (i >= analiz.length) clearInterval(interval);
    }, 12);
  }, 800);
}

function valReset() {
  document.getElementById('v-result').style.display = 'none';
  document.getElementById('v-empty').style.display = 'none';
  document.getElementById('sms-tel-step').style.display = 'block';
  document.getElementById('sms-code-step').style.display = 'none';
  document.getElementById('v-tel').value = '';
  document.getElementById('v-code').value = '';
  calcResult = null; smsCode = null;
  document.querySelectorAll('.vstep').forEach(s => s.style.display = 'none');
  document.getElementById('vstep-1').style.display = 'block';
}

// DEĞERLEME İÇİN AYRI VERİ YÜKLEME
async function loadForVal() {
  const btn = document.querySelector('#vstep-1 .vstep-next');
  if (btn) { btn.textContent = 'Veri yükleniyor...'; btn.disabled = true; }
  try {
    const r = await fetch(SU+'/rest/v1/listings?select=*', { headers:{'apikey':SK,'Authorization':'Bearer '+SK} });
    all = await r.json();
    populateValDistricts();
  } catch(e) { showError('Veri yüklenemedi: ' + e.message, 'Bağlantı Hatası'); }
  if (btn) { btn.textContent = 'Devam →'; btn.disabled = false; }
}

// TAB EVENTLERİ
function switchTab(tab) {
  const isVal = tab === 'val';
  document.getElementById('tab-list').classList.toggle('on', !isVal);
  document.getElementById('tab-val').classList.toggle('on', isVal);
  document.getElementById('page-val').style.display = isVal ? 'block' : 'none';
  document.getElementById('main-wrap').style.display = isVal ? 'none' : 'block';
  const ms = document.getElementById('mob-search');
  if(ms) ms.style.display = isVal ? 'none' : 'block';
}
document.getElementById('tab-list').addEventListener('click', () => switchTab('list'));
document.getElementById('tab-val').addEventListener('click', () => {
  switchTab('val');
  if (all.length === 0) loadForVal();
  else populateValDistricts();
});

// DESKTOP EVENTS
document.getElementById('ov').addEventListener('click',closeDrawer);
document.getElementById('dclose').addEventListener('click',closeDrawer);
document.getElementById('sbtn').addEventListener('click',()=>{F.min=parseInt(document.getElementById('mnp').value)||null;F.max=parseInt(document.getElementById('mxp').value)||null;load();});
document.getElementById('sort').addEventListener('change',()=>{if(all.length)sortRender();});
document.getElementById('rc').addEventListener('click',e=>{if(!e.target.matches('.chip'))return;document.getElementById('rc').querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');F.rooms=e.target.dataset.value;if(all.length)apply();});
document.getElementById('hc').addEventListener('click',e=>{if(!e.target.matches('.chip'))return;document.getElementById('hc').querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');F.heating=e.target.dataset.value;if(all.length)apply();});
document.querySelectorAll('#dc .chip, #qc .chip').forEach(b=>{}); // handled by buildD/buildQ
document.querySelectorAll('.panel .tog').forEach(t=>t.addEventListener('click',()=>{t.classList.toggle('on');const f=t.dataset.feat;if(F.features.includes(f))F.features=F.features.filter(x=>x!==f);else F.features.push(f);if(all.length)apply();}));
document.getElementById('vl').addEventListener('click',()=>{document.getElementById('vl').classList.add('on');document.getElementById('vm').classList.remove('on');document.getElementById('mapv').style.display='none';document.getElementById('listv').style.display='flex';});
document.getElementById('vm').addEventListener('click',()=>{document.getElementById('vm').classList.add('on');document.getElementById('vl').classList.remove('on');if(filtered.length)renderMap(filtered);});

// MOBILE FILTER SHEET
function openFsheet(){document.getElementById('fsheet').classList.add('open');document.body.style.overflow='hidden';}
function closeFsheet(){document.getElementById('fsheet').classList.remove('open');document.body.style.overflow='';}
document.getElementById('mob-filter-btn').addEventListener('click',openFsheet);
document.getElementById('mnb-filter').addEventListener('click',openFsheet);
document.getElementById('fsheet-close').addEventListener('click',closeFsheet);
document.getElementById('fsheet-ov').addEventListener('click',closeFsheet);

// Sync mobile chip groups with F state
function syncMobChips(cid, field, val){
  document.querySelectorAll('#'+cid+' .chip').forEach(x=>x.classList.remove('on'));
  const found=document.querySelector('#'+cid+' .chip[data-value="'+val+'"]');
  if(found)found.classList.add('on');
}
document.getElementById('rc-m').addEventListener('click',e=>{
  if(!e.target.matches('.chip'))return;
  document.getElementById('rc-m').querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));
  e.target.classList.add('on');F.rooms=e.target.dataset.value;
  syncMobChips('rc',null,F.rooms);
});
document.getElementById('hc-m').addEventListener('click',e=>{
  if(!e.target.matches('.chip'))return;
  document.getElementById('hc-m').querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));
  e.target.classList.add('on');F.heating=e.target.dataset.value;
  syncMobChips('hc',null,F.heating);
});
document.querySelectorAll('#togs-m .tog').forEach(t=>t.addEventListener('click',()=>{
  t.classList.toggle('on');
  const f=t.dataset.feat;
  if(F.features.includes(f))F.features=F.features.filter(x=>x!==f);else F.features.push(f);
  // sync desktop
  document.querySelector('.panel .tog[data-feat="'+f+'"]')?.classList.toggle('on',F.features.includes(f));
  updateMobFilterCount();
}));

function updateMobFilterCount(){
  const cnt=[F.district,F.quarter,F.rooms,F.heating].filter(Boolean).length + F.features.length;
  const el=document.getElementById('mob-filter-count');
  el.textContent=cnt?cnt+' filtre aktif':'';
}

document.getElementById('fsheet-apply').addEventListener('click',()=>{
  F.min=parseInt(document.getElementById('mnp-m').value)||null;
  F.max=parseInt(document.getElementById('mxp-m').value)||null;
  closeFsheet();
  load();
  updateMobFilterCount();
});
document.getElementById('mob-go-btn').addEventListener('click',()=>{
  F.min=parseInt(document.getElementById('mnp-m').value)||null;
  F.max=parseInt(document.getElementById('mxp-m').value)||null;
  load();
});

// MOBILE NAV BAR
document.getElementById('mnb-list').addEventListener('click',()=>{
  ['mnb-list','mnb-map','mnb-filter'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.getElementById('mnb-list').classList.add('on');
  document.getElementById('vl').click();
});
document.getElementById('mnb-map').addEventListener('click',()=>{
  ['mnb-list','mnb-map','mnb-filter'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.getElementById('mnb-map').classList.add('on');
  document.getElementById('vm').click();
});

// Mobile district & quarter chips
function buildD_m(){
  const ds=[...new Set(all.map(l=>l.district).filter(Boolean))].sort();
  const cm=document.getElementById('dc-m');
  cm.innerHTML='<button class="chip on" data-value="">Tümü</button>';
  ds.forEach(d=>{const b=document.createElement('button');b.className='chip';b.dataset.value=d;b.textContent=d;cm.appendChild(b);});
  cm.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{cm.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.district=b.dataset.value;F.quarter='';buildQ_m();updateMobFilterCount();}));
}
function buildQ_m(){
  const src=F.district?all.filter(l=>l.district===F.district):all;
  const qs=[...new Set(src.map(l=>l.quarter).filter(Boolean))].sort();
  const cm=document.getElementById('qc-m');
  cm.innerHTML='<button class="chip on" data-value="">Tümü</button>';
  qs.forEach(q=>{const b=document.createElement('button');b.className='chip';b.dataset.value=q;b.textContent=q;cm.appendChild(b);});
  cm.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{cm.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.quarter=b.dataset.value;updateMobFilterCount();}));
}

// SWIPE TO CLOSE DRAWER on mobile
(function(){
  let sy=0;
  document.getElementById('drawer').addEventListener('touchstart',e=>{sy=e.touches[0].clientY;},{passive:true});
  document.getElementById('drawer').addEventListener('touchend',e=>{
    const dy=e.changedTouches[0].clientY-sy;
    if(dy>80&&document.getElementById('drawer').scrollTop<=0)closeDrawer();
  },{passive:true});
})();
