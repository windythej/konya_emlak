
// Dil geçişi: TR→orijinal TR sayfa, EN→/en/ karşılığı
(function(){
  const EN_MAP = {
    '/': '/en/',
    '/hakkimizda': '/en/about',
    '/fiyatlar': '/en/pricing',
    '/giris': '/en/login',
    '/odeme': '/en/payment',
    '/danisman': '/en/advisors',
    '/degerleme': '/en/valuation',
    '/karsilastirma': '/en/comparison',
    '/analiz': '/en/analytics',
  };
  const TR_MAP = {};
  Object.keys(EN_MAP).forEach(k => { TR_MAP[EN_MAP[k]] = k; });

  window._switchLang = function(lang) {
    const path = location.pathname.replace(/\/+$/,'') || '/';
    if (lang === 'en') {
      if (path.startsWith('/en')) return; // zaten EN
      const enPath = EN_MAP[path];
      if (enPath) { location.href = enPath; return; }
      location.href = '/en/';
    } else {
      if (!path.startsWith('/en')) return; // zaten TR, hiçbir şey yapma
      const trPath = TR_MAP[path];
      if (trPath) { location.href = trPath; return; }
      location.href = '/';
    }
  };

  window.setLang = function(lang) {
    localStorage.setItem('lang', lang);
    const m = document.getElementById('lang-menu');
    if (m) m.style.display = 'none';
    const lt = document.getElementById('lang-txt');
    if (lt) lt.textContent = lang === 'en' ? '🇬🇧 EN' : '🇹🇷 TR';
    window._switchLang(lang);
  };
})();


// ── ORTAK JS ──
window.addEventListener('scroll',()=>document.getElementById('main-nav').classList.toggle('scrolled',window.scrollY>40));

// Mob menü
function toggleMob(){const s=document.getElementById('mob-sheet');s&&s.classList.contains('on')?closeMob():openMob();}
function openMob(){
  const s=document.getElementById('mob-sheet'),ov=document.getElementById('mob-ov'),btn=document.getElementById('nav-ham'),cl=document.querySelector('.mob-close');
  if(!s)return;s.classList.add('on');if(ov)ov.classList.add('on');if(btn)btn.classList.add('is-open');
  if(cl){cl.style.opacity='1';cl.style.pointerEvents='auto';}
  const sy=window.scrollY;document.body.dataset.scrollY=sy;
  document.body.style.overflow='hidden';document.body.style.position='fixed';
  document.body.style.width='100%';document.body.style.top='-'+sy+'px';
}
function closeMob(){
  const s=document.getElementById('mob-sheet'),ov=document.getElementById('mob-ov'),btn=document.getElementById('nav-ham'),cl=document.querySelector('.mob-close');
  if(!s)return;s.classList.remove('on');if(ov)ov.classList.remove('on');if(btn)btn.classList.remove('is-open');
  if(cl){cl.style.opacity='0';cl.style.pointerEvents='none';}
  const sy=parseInt(document.body.dataset.scrollY||0);
  document.body.style.overflow='';document.body.style.position='';
  document.body.style.width='';document.body.style.top='';
  window.scrollTo(0,sy);
}

// Popup
function showPopup(msg,title='Bilgi',icon='ℹ️',type='info'){
  document.getElementById('popup-icon').textContent=icon;
  document.getElementById('popup-title').textContent=title;
  document.getElementById('popup-msg').textContent=msg;
  const btn=document.getElementById('popup-ok');
  btn.className='popup-btn'+(type==='danger'?' danger':'');
  document.getElementById('popup-overlay').classList.add('open');
}
function showSuccess(msg,t){showPopup(msg,t||'Başarılı','✅','success');}
function showError(msg,t){showPopup(msg,t||'Hata','❌','danger');}
function showInfo(msg,t){showPopup(msg,t||'Bilgi','ℹ️','info');}
function closePopup(){document.getElementById('popup-overlay').classList.remove('open');}
document.addEventListener('DOMContentLoaded',()=>{
  const po=document.getElementById('popup-overlay');
  if(po)po.addEventListener('click',e=>{if(e.target===po)closePopup();});
});

// Dil
let currentLang=localStorage.getItem('lang')||'tr';
function toggleLangMenu(){
  const m=document.getElementById('lang-menu');if(!m)return;
  const open=m.style.display==='block';m.style.display=open?'none':'block';
  if(!open)setTimeout(()=>{document.addEventListener('click',function cl(e){if(!e.target.closest('#lang-btn')&&!e.target.closest('#lang-menu')){m.style.display='none';document.removeEventListener('click',cl);}});},50);
}
function setLang(lang){
  currentLang=lang;localStorage.setItem('lang',lang);
  const m=document.getElementById('lang-menu');if(m)m.style.display='none';
  const lt=document.getElementById('lang-txt');if(lt)lt.textContent=lang==='en'?'🇬🇧 EN':'🇹🇷 TR';
  if(typeof applyLang==='function')applyLang();
}

// Auth
const SB_URL='https://bknfjyfuzbanhoomooth.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbmZqeWZ1emJhbmhvb21vb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODczNDgsImV4cCI6MjA5MzE2MzM0OH0.7Tl3nWspqxDtnhIj2SZju_ObXtjkAsv_n-Joj7vwSx0';
let currentUser=null;
function getToken(){return localStorage.getItem('emlak_token');}
function setToken(t){localStorage.setItem('emlak_token',t);}
function removeToken(){localStorage.removeItem('emlak_token');}
function parseToken(t){try{const p=JSON.parse(atob(t));return p.exp<Date.now()?(removeToken(),null):p;}catch{return null;}}
function generateToken(u){return btoa(JSON.stringify({id:u.id,phone:u.phone,name:u.first_name,exp:Date.now()+86400000}));}
function authHeaders(){return{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'};}
function checkAuth(){
  const t=getToken();if(!t)return;
  const u=parseToken(t);if(!u)return;
  currentUser=u;updateNavForUser(u);
}
function updateNavForUser(user){
  const loginBtn=document.getElementById('nav-login-btn');
  const navUser=document.getElementById('nav-user');
  const mobLogin=document.getElementById('mob-login-btn');
  const mobUserSec=document.getElementById('mob-user-sec');
  if(user){
    if(loginBtn)loginBtn.style.display='none';
    if(navUser)navUser.style.display='flex';
    const init=(user.name||user.phone||'K').substring(0,1).toUpperCase();
    const navAv=document.getElementById('nav-av');if(navAv)navAv.textContent=init;
    const navUn=document.getElementById('nav-uname');if(navUn)navUn.textContent=user.name||user.phone||'—';
    if(mobLogin)mobLogin.style.display='none';
    if(mobUserSec){mobUserSec.style.display='block';const mn=document.getElementById('mob-uname');if(mn)mn.textContent=user.name||'—';}
  } else {
    if(loginBtn)loginBtn.style.display='block';
    if(navUser)navUser.style.display='none';
    if(mobLogin)mobLogin.style.display='flex';
    if(mobUserSec)mobUserSec.style.display='none';
  }
}
function logout(){removeToken();currentUser=null;updateNavForUser(null);showInfo('Çıkış yapıldı.','Çıkış');}
function showSMSCode(code,tel){showPopup(tel+' numarasına gönderilen kod: '+code+'\n(Gerçek sistemde SMS ile iletilir)','SMS Kodu','📱','info');}
document.addEventListener('DOMContentLoaded',checkAuth);

// Destek botu
function openSupport(){
  const m=document.getElementById('support-modal');
  if(m){m.style.display='flex';const f=document.getElementById('support-fab');if(f)f.style.display='none';}
  document.getElementById('support-input')?.focus();
}
function closeSupport(){
  const m=document.getElementById('support-modal');
  if(m)m.style.display='none';
  const f=document.getElementById('support-fab');if(f)f.style.display='flex';
}
async function sendSupport(){
  const input=document.getElementById('support-input');
  const msgs=document.getElementById('support-messages');
  if(!input||!msgs||!input.value.trim())return;
  const txt=input.value.trim();input.value='';
  const ub=document.createElement('div');
  ub.style.cssText='background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.2);border-radius:12px 12px 2px 12px;padding:10px 14px;font-size:13px;color:var(--tx);max-width:85%;align-self:flex-end;line-height:1.6;';
  ub.textContent=txt;msgs.appendChild(ub);
  const typing=document.createElement('div');
  typing.style.cssText='background:var(--d3);border-radius:12px 12px 12px 2px;padding:10px 14px;font-size:13px;color:var(--txm);';
  typing.textContent='...';msgs.appendChild(typing);msgs.scrollTop=msgs.scrollHeight;
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:txt,lang:currentLang})});
    const d=await r.json();
    typing.textContent=d.reply||d.error||'Yanıt alınamadı.';typing.style.color='var(--tx)';
  }catch(e){typing.textContent='Bağlantı hatası.';}
  msgs.scrollTop=msgs.scrollHeight;
}

// Reveal observer
const rvObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('vis');e.target.classList.remove('rv-hidden');}
    else if(!e.target.closest('.hero')){e.target.classList.remove('vis');e.target.classList.add('rv-hidden');}
  });
},{threshold:0.08,rootMargin:'0px 0px -20px 0px'});
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.rv').forEach(el=>rvObs.observe(el));
  // Dil
  const saved=localStorage.getItem('lang')||'tr';
  const lt=document.getElementById('lang-txt');if(lt)lt.textContent=saved==='en'?'🇬🇧 EN':'🇹🇷 TR';
});


// Sayfa yüklendiğinde loader'ı kapat
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const ldr = document.getElementById('page-loader');
    if (ldr) ldr.classList.add('hide');
  }, 250);
});
window.addEventListener('load', () => {
  const ldr = document.getElementById('page-loader');
  if (ldr) ldr.classList.add('hide');
});


// ── ORTAK YARDIMCI FONKSİYONLAR ──
function closeLoginReq() {
  const ov = document.getElementById('login-req-overlay');
  if (ov) ov.style.display = 'none';
}

function goBack() {
  if (history.length > 1) history.back();
  else location.href = '/';
}

function handleSub(name, price, period) {
  if (!currentUser) {
    const ov = document.getElementById('login-req-overlay');
    if (ov) ov.style.display = 'flex';
    return;
  }
  localStorage.setItem('selPlan', JSON.stringify({ name, price, period }));
  location.href = '/odeme';
}

function processPayment() {
  showPopup('Ödeme sistemi yakında aktif olacak. Demo mod.', 'Ödeme', '💳', 'info');
}

function showStep(id) {
  document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

// Ödeme sayfası — plan bilgisini yükle
document.addEventListener('DOMContentLoaded', () => {
  const ps = document.getElementById('ps-plan-nm');
  if (!ps) return;
  const plan = JSON.parse(localStorage.getItem('selPlan') || '{}');
  if (plan.name) {
    ps.textContent = plan.name;
    const pr = document.getElementById('ps-price');
    if (pr) pr.innerHTML = '<span>₺</span>' + plan.price;
    const pe = document.getElementById('ps-period');
    if (pe) pe.textContent = plan.period + ' · Otomatik yenileme';
    const bc = document.getElementById('pay-bc');
    if (bc) bc.textContent = plan.name;
  }
});


// ── Devamını oku (hakkımızda vb.) ──
function toggleReadMore(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.toggle('open');
  btn.textContent = isOpen ? 'Kapat ↑' : 'Devamını oku ↓';
}

// ── Sayaç animasyonu ──
function animateCounter(el) {
  const target = parseInt(el.dataset.target) || 0;
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Counter observer — viewport'a girince başla
document.addEventListener('DOMContentLoaded', () => {
  const counterEls = document.querySelectorAll('.counter-anim');
  if (!counterEls.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  counterEls.forEach(el => obs.observe(el));
});

// ── NAV AKTİF LİNK (mobil + desktop) ──
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('.nav-lnk[href]').forEach(lnk => {
    const lPath = (lnk.getAttribute('href') || '').replace(/\/+$/, '') || '/';
    if (lPath === path) lnk.classList.add('act');
    else lnk.classList.remove('act');
  });
});

// ── HAMBURGEr Z-INDEX güvencesi ──
document.addEventListener('DOMContentLoaded', () => {
  const mobSheet = document.getElementById('mob-sheet');
  const mobOv    = document.getElementById('mob-ov');
  const nav      = document.getElementById('main-nav');
  if (mobSheet) mobSheet.style.zIndex = '3000';
  if (mobOv)    mobOv.style.zIndex    = '2999';
  if (nav)      nav.style.zIndex      = '1000';
  // Ham butonu her zaman nav'ın üstünde
  const ham = document.getElementById('nav-ham');
  if (ham) ham.style.zIndex = '1001';
});

// ── İLANLAR DROPDOWN ──
function toggleIlanlarMenu(e) {
  e && e.stopPropagation();
  const menu = document.getElementById('ilanlar-menu');
  const wrap = document.getElementById('ilanlar-wrap');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  // Tüm açık dropdownları kapat
  document.querySelectorAll('.nav-drop-menu.open').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.nav-drop-wrap.open').forEach(w => w.classList.remove('open'));
  if (!isOpen) {
    menu.classList.add('open');
    if (wrap) wrap.classList.add('open');
  }
}
// Dışarı tıklayınca kapat
document.addEventListener('click', function(e) {
  if (!e.target.closest('#ilanlar-wrap')) {
    const menu = document.getElementById('ilanlar-menu');
    const wrap = document.getElementById('ilanlar-wrap');
    if (menu) menu.classList.remove('open');
    if (wrap) wrap.classList.remove('open');
  }
});
