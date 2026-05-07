// ===== LANDING SAYFASI JS =====

// Hero parçacıkları
function initParticles() {
  const c = document.getElementById('hero-particles');
  if (!c) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left = Math.random() * 100;
    const dur = 7 + Math.random() * 8;
    const delay = Math.random() * 8;
    const dx = (Math.random() - .5) * 120;
    p.style.cssText = `left:${left}%;--dur:${dur}s;--delay:${delay}s;--dx:${dx}px;`;
    c.appendChild(p);
  }
}

// İlçeler ve istatistikler — Supabase'den
async function loadLandingData() {
  try {
    const SU = 'https://bknfjyfuzbanhoomooth.supabase.co';
    const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbmZqeWZ1emJhbmhvb21vb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODczNDgsImV4cCI6MjA5MzE2MzM0OH0.7Tl3nWspqxDtnhIj2SZju_ObXtjkAsv_n-Joj7vwSx0';
    const r = await fetch(`${SU}/rest/v1/listings?select=district,price,net_size&limit=500`, {
      headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK }
    });
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return;

    const fp = n => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
    const prices = data.map(d => d.price).filter(p => p > 0);
    const sortedP = [...prices].sort((a, b) => a - b);
    const medianP = sortedP[Math.floor(sortedP.length / 2)];
    const m2list = data.filter(d => d.price > 0 && d.net_size > 0 && d.net_size < 400)
                       .map(d => d.price / d.net_size);
    const avgM2 = m2list.length ? m2list.reduce((a, b) => a + b, 0) / m2list.length : 0;

    const sa = document.getElementById('sum-avg'); if (sa) sa.textContent = fp(medianP) + ' ₺';
    const sm = document.getElementById('sum-m2'); if (sm) sm.textContent = fp(Math.round(avgM2)) + ' ₺/m²';

    const dc = {};
    data.forEach(d => { if (d.district) dc[d.district] = (dc[d.district] || 0) + 1; });
    const sorted = Object.entries(dc).sort((a, b) => b[1] - a[1]);
    const st = document.getElementById('sum-top');
    if (st) st.textContent = sorted[0] ? sorted[0][0] : '—';

    const list = document.getElementById('dc-list');
    if (!list) return;
    list.innerHTML = '';
    const dbDistricts = new Set(sorted.map(([n]) => n));

    sorted.forEach(([name, cnt]) => {
      const el = document.createElement('a');
      el.className = 'dc-chip';
      el.href = '/karsilastirma?d=' + encodeURIComponent(name);
      el.style.textDecoration = 'none';
      el.innerHTML = `<div class="dc-n">${name}</div><div class="dc-c">${cnt} ilan</div>`;
      list.appendChild(el);
    });

    const TUMU = ['Ahırlı','Akören','Akşehir','Altınekin','Beyşehir','Bozkır','Cihanbeyli','Çeltik','Çumra','Derbent','Derebucak','Doğanhisar','Emirgazi','Ereğli','Güneysınır','Hadim','Halkapınar','Hüyük','Ilgın','Kadınhanı','Karapınar','Karatay','Kulu','Meram','Sarayönü','Selçuklu','Seydişehir','Taşkent','Tuzlukçu','Yalıhüyük','Yunak'];
    TUMU.forEach(name => {
      if (dbDistricts.has(name)) return;
      const el = document.createElement('div');
      el.className = 'dc-chip';
      el.style.opacity = '0.45';
      el.innerHTML = `<div class="dc-n">${name}</div><div class="dc-c" style="color:var(--txd);">Yakında</div>`;
      list.appendChild(el);
    });
  } catch (e) { console.warn('Landing data:', e); }
}

// ── GÜVENLE SAT — ADIM KONTROLÜ ──
let gsCurrentStep = 1;
let gsDemoInterval = null;
const GS_AUTO_DELAY = 6000;
const GS_RESUME_DELAY = 12000;

function gsNextStep(step, fromUser) {
  gsHoverOut();
  if (fromUser) {
    if (gsDemoInterval) { clearInterval(gsDemoInterval); gsDemoInterval = null; }
    clearTimeout(window._gsResumeTimer);
    window._gsResumeTimer = setTimeout(() => {
      gsDemoInterval = startGsDemo(gsCurrentStep);
    }, GS_RESUME_DELAY);
  }
  gsCurrentStep = step;
  const total = 4;
  for (let i = 1; i <= total; i++) {
    const pane = document.getElementById('gs-pane-' + i);
    const stepEl = document.getElementById('gs-step-' + i);
    const progEl = document.getElementById('gs-prog-' + i);
    if (!pane || !stepEl || !progEl) continue;
    pane.classList.toggle('active', i === step);
    stepEl.classList.remove('active', 'done');
    progEl.classList.remove('active', 'done');
    if (i === step) { stepEl.classList.add('active'); progEl.classList.add('active'); }
    else if (i < step) { stepEl.classList.add('done'); progEl.classList.add('done'); }
  }
}

function startGsDemo(startFrom) {
  let step = startFrom || gsCurrentStep;
  return setInterval(() => {
    step = step >= 4 ? 1 : step + 1;
    gsNextStep(step, false);
  }, GS_AUTO_DELAY);
}

function gsHover(step) {
  for (let i = 1; i <= 4; i++) {
    const p = document.getElementById('gs-prog-' + i);
    if (!p) continue;
    const line = p.querySelector('.gs-prog-line');
    if (!line) continue;
    if (i < step - 1) line.style.removeProperty('--hover-scale');
    else if (i === step - 1) line.style.setProperty('--hover-scale', '0.5');
    else line.style.setProperty('--hover-scale', '0');
  }
}

function gsHoverOut() {
  for (let i = 1; i <= 4; i++) {
    const p = document.getElementById('gs-prog-' + i);
    if (p) p.querySelector('.gs-prog-line')?.style.removeProperty('--hover-scale');
  }
}

// Devamını oku
function toggleReadMore(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.toggle('open');
  btn.textContent = isOpen ? 'Kapat ↑' : 'Devamını oku ↓';
}

// Sayaç animasyonu
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  loadLandingData();

  // Güvenle Sat — viewport'a girince başlat
  const sec = document.getElementById('guvenle-sat-sec');
  if (sec) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !gsDemoInterval) {
          setTimeout(() => { gsDemoInterval = startGsDemo(); }, 1500);
        } else if (!e.isIntersecting && gsDemoInterval) {
          clearInterval(gsDemoInterval); gsDemoInterval = null;
          gsNextStep(1, false);
        }
      });
    }, { threshold: 0.25 });
    obs.observe(sec);
  }

  // Sayaç observer
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.target.classList.contains('counter-anim')) {
        animateCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.counter-anim').forEach(el => counterObs.observe(el));
});
