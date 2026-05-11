// ===== DEĞERLEME SISTEMI =====
// Bağımlılık: main.js (all, fp, SU, SK, populateValDistricts)

const VAL = {
  category: '',
  district: '',
  quarter: '',
  currentStep: 1,
  rooms: '',
  aptType: 'Daire',
  usage: 'Mülk Sahibi',
  condition: 'Standart',
  grossM2: '',
  netM2: '',
  age: '',
  totalFloors: '',
  floor: '',
  bathrooms: 1,
  livingRooms: 1,
  facades: [],
  views: [],
  heating: '',
  amenities: [],
};

const FREE_LIMIT = 3;
let freeUsed = parseInt(localStorage.getItem('freeUsed') || '0');
let calcResult = null;

function initValuation() {
  const container = document.getElementById('val-content');
  if (!container) return;
  container.innerHTML = '';
  // Veri yoksa çek
  if (typeof all !== 'undefined' && all.length === 0) {
    if (typeof loadForVal === 'function') loadForVal();
  } else {
    if (typeof populateValDistricts === 'function') populateValDistricts();
  }
  renderStep(1);
}

function renderStep(step) {
  VAL.currentStep = step;
  const container = document.getElementById('val-content');
  if (!container) return;

  const isWide = step === 5;
  container.innerHTML = `
    <div class="val-container${isWide ? ' val-result-wide' : ''}" id="val-container-inner">
      <div id="val-form-area">
        ${renderProgress(step)}
        <div class="val-form-card" id="val-form-card">
          ${step === 1 ? renderStep1() : ''}
          ${step === 2 ? renderStep2() : ''}
          ${step === 3 ? renderStep3() : ''}
          ${step === 4 ? renderStep4() : ''}
          ${step === 5 ? renderStep5() : ''}
        </div>
      </div>
      ${step === 5 ? '<div id="val-info-area"></div>' : ''}
    </div>`;

  bindStepEvents(step);
  if (step === 5) {
    calcAndRender();
    freeUsed = Math.min(freeUsed + 1, FREE_LIMIT);
    localStorage.setItem('freeUsed', freeUsed);
  }
  if (typeof applyLang === 'function') setTimeout(applyLang, 60);
}

function goStep(step) {
  VAL.currentStep = step;
  renderStep(step);
  const vc = document.getElementById('val-content');
  if (vc) vc.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProgress(step) {
  const steps = ['Kategori','Konum','Özellikler','Detaylar','Analiz'];
  return `<div class="val-progress">
    ${steps.map((s,i) => `
      <div class="vp-step ${i+1 < step ? 'done' : i+1 === step ? 'active' : ''}">
        <div class="vp-num">${i+1 < step ? '✓' : i+1}</div>
        <div class="vp-lbl">${s}</div>
        ${i < steps.length-1 ? '<div class="vp-line"></div>' : ''}
      </div>`).join('')}
  </div>`;
}

function renderStep1() {
  const cats = [
    { key:'konut', icon:'🏠', label:'Konut', sub:'Daire, müstakil ev, villa' },
    { key:'arsa',  icon:'🌿', label:'Arsa / Arazi', sub:'İmarlı arsa, tarla, bağ bahçe' },
    { key:'ticari',icon:'🏢', label:'Ticari', sub:'Dükkan, ofis, depo, fabrika' },
    { key:'kiralik',icon:'🔑',label:'Kiralık', sub:'Aylık kira değeri analizi' },
  ];
  return `
    <div class="val-form-title">Ne değerlendirmek istiyorsunuz?</div>
    <p class="val-form-sub">Mülk tipini seçerek başlayın.</p>
    <div class="cat-grid">
      ${cats.map(c => `
        <div class="cat-card ${VAL.category === c.key ? 'on' : ''}" data-cat="${c.key}">
          <div class="cat-card-icon">${c.icon}</div>
          <div class="cat-card-title">${c.label}</div>
          <div class="cat-card-sub">${c.sub}</div>
        </div>`).join('')}
    </div>
    <div class="val-actions" style="margin-top:24px;">
      <button class="val-next" onclick="if(VAL.category){goStep(2);}else{if(typeof showError==='function')showError('Lütfen bir kategori seçin.','Eksik');}">Devam Et →</button>
    </div>`;
}

function renderStep2() {
  return `
    <div class="val-form-title">Mülkün konumu nerede?</div>
    <p class="val-form-sub">Konum, değerleme analizinin en kritik faktörüdür.</p>
    <div class="vfield">
      <label class="vlbl">İLÇE *</label>
      <select class="vinput" id="v-district" onchange="VAL.district=this.value;VAL.quarter='';if(typeof populateValQuarters==='function')populateValQuarters(this.value);">
        <option value="">İlçe seçin...</option>
      </select>
    </div>
    <div class="vfield">
      <label class="vlbl">MAHALLE / SEMT</label>
      <select class="vinput" id="v-quarter" onchange="VAL.quarter=this.value;">
        <option value="">Mahalle seçin (isteğe bağlı)</option>
      </select>
    </div>
    <div class="val-actions">
      <button class="val-back" onclick="goStep(1)">← Geri</button>
      <button class="val-next" onclick="if(VAL.district){goStep(3);}else{if(typeof showError==='function')showError('Lütfen ilçe seçin.','Eksik');}">Devam Et →</button>
    </div>`;
}

function renderStep3() {
  const rooms = ['1+0','1+1','2+1','3+1','3+2','4+1','4+2','5+1','5+2'];
  const heatings = ['Kombi','Merkezi','Yerden Isıtma','Soba','Klima','Yok'];
  return `
    <div class="val-form-title">Konut özelliklerini girin</div>
    <p class="val-form-sub">* ile işaretli alanlar zorunludur.</p>
    <div class="vfield">
      <label class="vlbl">ODA SAYISI *</label>
      <div class="vchips" id="v-rooms-chips">
        ${rooms.map(r => `<button class="vchip ${VAL.rooms===r?'on':''}" data-value="${r}" onclick="VAL.rooms='${r}';document.querySelectorAll('#v-rooms-chips .vchip').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${r}</button>`).join('')}
      </div>
    </div>
    <div class="vrow2">
      <div class="vfield">
        <label class="vlbl">BRÜT M² *</label>
        <input type="number" class="vinput" id="v-gross-m2" value="${VAL.grossM2}" min="20" max="2000" placeholder="120" oninput="VAL.grossM2=this.value;">
      </div>
      <div class="vfield">
        <label class="vlbl">NET M²</label>
        <input type="number" class="vinput" id="v-net-m2" value="${VAL.netM2}" min="15" max="1800" placeholder="100" oninput="VAL.netM2=this.value;">
      </div>
    </div>
    <div class="vrow2">
      <div class="vfield">
        <label class="vlbl">BİNA YAŞI</label>
        <input type="number" class="vinput" id="v-age" value="${VAL.age}" min="0" max="80" placeholder="5" oninput="VAL.age=this.value;">
      </div>
      <div class="vfield">
        <label class="vlbl">BULUNDUĞU KAT</label>
        <input type="number" class="vinput" id="v-floor" value="${VAL.floor}" min="0" max="50" placeholder="3" oninput="VAL.floor=this.value;">
      </div>
    </div>
    <div class="vfield">
      <label class="vlbl">ISITMA SİSTEMİ</label>
      <div class="vchips">
        ${heatings.map(h => `<button class="vchip vheat${VAL.heating===h?' on':''}" data-heat="${h}" onclick="VAL.heating='${h}';document.querySelectorAll('.vheat').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${h}</button>`).join('')}
      </div>
    </div>
    <div class="vfield">
      <label class="vlbl">YAPI DURUMU</label>
      <div class="vchips">
        ${['Bakımlı/Yenilenmiş','Standart','Tadilat İhtiyacı Var'].map(c => `<button class="vchip vcond${VAL.condition===c?' on':''}" onclick="VAL.condition='${c}';document.querySelectorAll('.vcond').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${c}</button>`).join('')}
      </div>
    </div>
    <div class="val-actions">
      <button class="val-back" onclick="goStep(2)">← Geri</button>
      <button class="val-next" onclick="if(VAL.rooms&&VAL.grossM2){goStep(4);}else{if(typeof showError==='function')showError('Oda sayısı ve m² giriniz.','Eksik');}">Devam Et →</button>
    </div>`;
}

function renderStep4() {
  const amenities = ['Balkon','Asansör','Otopark','Site İçi','Ebeveyn Banyosu','Jakuzi','Güvenlik','Isı Yalıtımı'];
  return `
    <div class="val-form-title">Ek özellikleri girin</div>
    <p class="val-form-sub">İsteğe bağlıdır, doğruluğu artırır.</p>
    <div class="vfield">
      <label class="vlbl">OLANAKLAR</label>
      <div class="vchips">
        ${amenities.map(a => `<button class="vchip ${VAL.amenities.includes(a)?'on':''}" onclick="const i=VAL.amenities.indexOf('${a}');if(i>-1)VAL.amenities.splice(i,1);else VAL.amenities.push('${a}');this.classList.toggle('on');">${a}</button>`).join('')}
      </div>
    </div>
    <div class="val-actions">
      <button class="val-back" onclick="goStep(3)">← Geri</button>
      <button class="val-next" onclick="goStep(5)">Analizi Başlat →</button>
    </div>`;
}

function renderStep5() {
  return `
    <div class="vre-header" style="margin-bottom:20px;">
      <div>
        <div class="vre-title" data-i18n="val_result_title">Değerleme Sonucu</div>
        <div class="vre-sub">${VAL.district} · ${VAL.rooms} · ${VAL.grossM2}m²</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="pg-back" onclick="goStep(1)">← Geri Dön</button>
        <button class="pg-back" onclick="initValuation()">+ Yeni Değerleme</button>
      </div>
    </div>
    <div class="vre-main">
      <div class="vre-price-card" id="vre-price-card">
        <div style="text-align:center;padding:20px 0 10px;">
          <div style="font-size:32px;margin-bottom:8px;">🏠</div>
          <div style="font-size:11px;color:var(--txm);letter-spacing:2px;margin-bottom:8px;" data-i18n="val_est_lbl">TAHMİNİ DEĞER</div>
          <div class="vre-price-big" id="vre-est-val">Hesaplanıyor...</div>
          <div style="height:3px;background:rgba(201,168,76,.15);border-radius:100px;overflow:hidden;margin:12px 0;">
            <div id="vre-conf-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--gold-d),var(--gold));border-radius:100px;transition:width 1s ease;"></div>
          </div>
          <div style="font-size:13px;color:var(--gold);" id="vre-conf-txt">⊙ Güven Puanı: —</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
          <div class="vre-minmax"><div style="font-size:11px;color:var(--txm);margin-bottom:4px;">↓ Min Değer</div><div id="vre-min-val" style="font-size:14px;font-weight:700;color:var(--tx);">—</div></div>
          <div class="vre-minmax"><div style="font-size:11px;color:var(--txm);margin-bottom:4px;">↑ Maks Değer</div><div id="vre-max-val" style="font-size:14px;font-weight:700;color:var(--tx);">—</div></div>
        </div>
        <button class="btn-g" style="width:100%;justify-content:center;margin-top:20px;" onclick="location.href='${document.documentElement.lang==='en'?'/en/advisors':'/danisman'}'">👤 Danışman Bul</button>
      </div>
      <div class="vre-steps-panel">
        <div style="font-size:13px;font-weight:700;color:var(--txm);letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">Sonraki Adımlar</div>
        ${[['1 — Özellikler Girildi','done'],['2 — Değer Hesaplandı','done'],['3 — Danışman Bul',''],['4 — Güvenle Sat','']].map(([t,cls])=>`
          <div class="vre-step-item ${cls}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--d3);border:1px solid var(--bd);border-radius:var(--rs);margin-bottom:8px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${cls==='done'?'rgba(76,175,130,.15)':'var(--d4)'};border:1px solid ${cls==='done'?'var(--ok)':'var(--bd)'};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">${cls==='done'?'✓':'○'}</div>
            <div style="font-size:13px;color:${cls==='done'?'var(--ok)':'var(--txm)'};">${t}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="vre-bottom-row">
      <div class="vre-invest">
        <div class="vre-section-title" data-i18n="val_invest">Yatırım Analizi</div>
        <div class="vre-invest-grid" id="vre-invest-grid">
          <div class="vre-invest-item"><div class="vre-invest-lbl" data-i18n="val_rent">Tahmini Aylık Kira</div><div class="vre-invest-val" id="vre-rent">—</div></div>
          <div class="vre-invest-item"><div class="vre-invest-lbl" data-i18n="val_yield">Brüt Kira Getirisi</div><div class="vre-invest-val" id="vre-yield">—</div></div>
          <div class="vre-invest-item"><div class="vre-invest-lbl" data-i18n="val_amort">Amortisman Süresi</div><div class="vre-invest-val" id="vre-amort">—</div></div>
          <div class="vre-invest-item"><div class="vre-invest-lbl" data-i18n="val_score">Fırsat Skoru</div><div class="vre-invest-val" id="vre-score">—</div></div>
        </div>
      </div>
      <div class="vre-ai">
        <div class="vre-ai-badge" data-i18n="val_ai">▲ AI ANALİZİ</div>
        <div class="vre-ai-text" id="ai-analysis-text">Analiz hazırlanıyor...</div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--txm);margin-top:8px;" id="vre-disclaimer">* Benzer ilanlar analiz edilmiştir. Tahmin ±%12 sapma gösterebilir.</div>`;
}

function bindStepEvents(step) {
  if (step === 1) {
    document.querySelectorAll('.cat-card').forEach(card => {
      card.addEventListener('click', () => {
        VAL.category = card.dataset.cat;
        document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('on'));
        card.classList.add('on');
        // Butonu aktif et
        const btn = document.querySelector('.val-next');
        if (btn) btn.removeAttribute('disabled');
      });
    });
  }
  if (step === 2) {
    if (typeof populateValDistricts === 'function') setTimeout(populateValDistricts, 50);
    const sel = document.getElementById('v-district');
    if (sel && VAL.district) { sel.value = VAL.district; if (typeof populateValQuarters === 'function') populateValQuarters(VAL.district); }
    const qsel = document.getElementById('v-quarter');
    if (qsel && VAL.quarter) setTimeout(() => { qsel.value = VAL.quarter; }, 100);
  }
}

function calcAndRender() {
  if (!all || !all.length) {
    if (typeof loadForVal === 'function') {
      loadForVal().then(() => calcAndRender());
    }
    return;
  }

  const district = VAL.district;
  const quarter = VAL.quarter;
  const rooms = VAL.rooms;
  const m2 = parseFloat(VAL.grossM2) || parseFloat(VAL.netM2) || 80;
  const age = parseFloat(VAL.age) || 0;

  let pool = all.filter(l => l.district === district && l.rooms === rooms && l.net_size > 0 && l.price > 0);
  let byQ = quarter ? pool.filter(l => l.quarter === quarter) : [];
  let usedPool = byQ.length >= 3 ? byQ : pool;
  let scopeLabel = byQ.length >= 3 ? quarter : (district + ' geneli');

  if (!usedPool.length) {
    // Oda sayısı yoksa sadece ilçeye göre
    usedPool = all.filter(l => l.district === district && l.net_size > 0 && l.price > 0);
    scopeLabel = district + ' geneli (tüm tipler)';
  }
  if (!usedPool.length) {
    document.getElementById('vre-est-val').textContent = 'Yeterli veri yok';
    return;
  }

  const m2Prices = usedPool.map(l => l.price / l.net_size);
  const avgM2 = m2Prices.reduce((a,b) => a+b, 0) / m2Prices.length;

  let ageFactor = age <= 2 ? 1.08 : age <= 5 ? 1.04 : age <= 10 ? 1.00 : age <= 20 ? 0.95 : age <= 30 ? 0.88 : 0.80;
  let condFactor = VAL.condition === 'Bakımlı/Yenilenmiş' ? 1.05 : VAL.condition === 'Tadilat İhtiyacı Var' ? 0.90 : 1.00;
  let amenBonus = 1 + VAL.amenities.length * 0.008;

  const estimated = Math.round(avgM2 * m2 * ageFactor * condFactor * amenBonus);
  const low = Math.round(estimated * 0.88);
  const high = Math.round(estimated * 1.12);
  const confidence = Math.min(95, 60 + usedPool.length * 2);
  const monthlyRent = Math.round(estimated * 0.0045);
  const yieldPct = ((monthlyRent * 12) / estimated * 100).toFixed(1);
  const amort = Math.round(estimated / (monthlyRent * 12));
  const score = Math.min(100, Math.round(50 + (usedPool.length * 1.5) + (ageFactor > 1 ? 15 : 0)));

  calcResult = { usedPool, estimated, low, high, confidence, monthlyRent, yieldPct, amort, score, scopeLabel, avgM2 };

  // UI güncelle
  const ev = document.getElementById('vre-est-val');
  if (ev) ev.textContent = fp(estimated) + ' ₺';
  const conf = document.getElementById('vre-conf-bar');
  if (conf) setTimeout(() => { conf.style.width = confidence + '%'; }, 100);
  const confTxt = document.getElementById('vre-conf-txt');
  if (confTxt) confTxt.textContent = '⊙ Güven Puanı: ' + confidence;
  const minEl = document.getElementById('vre-min-val');
  if (minEl) minEl.textContent = fp(low) + ' ₺';
  const maxEl = document.getElementById('vre-max-val');
  if (maxEl) maxEl.textContent = fp(high) + ' ₺';
  const rentEl = document.getElementById('vre-rent');
  if (rentEl) rentEl.textContent = fp(monthlyRent) + ' ₺';
  const yieldEl = document.getElementById('vre-yield');
  if (yieldEl) yieldEl.textContent = '%' + yieldPct;
  const amortEl = document.getElementById('vre-amort');
  if (amortEl) amortEl.textContent = amort + ' yıl';
  const scoreEl = document.getElementById('vre-score');
  if (scoreEl) scoreEl.textContent = score + '/100';
  const disc = document.getElementById('vre-disclaimer');
  if (disc) disc.textContent = `* ${usedPool.length} benzer ilan analiz edilmiştir (${scopeLabel}). Tahmin ±%12 sapma gösterebilir.`;

  // Benzer ilanlar
  const infoArea = document.getElementById('val-info-area');
  if (infoArea) {
    const similarList = usedPool.slice(0, 8);
    infoArea.innerHTML = `
      <div class="val-info-panel" style="height:100%;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div class="val-info-icon" style="margin-bottom:0;">🏠</div>
          <div class="val-info-title" data-i18n="val_similar" style="margin-bottom:0;">Benzer İlanlar</div>
        </div>
        <div style="flex:1;overflow-y:auto;scrollbar-width:thin;">
          ${similarList.map(l => {
            const titleShort = (l.title||'').substring(0,38);
            return `<div style="padding:10px 0;border-bottom:1px solid var(--bd);">
              <div style="font-size:11px;color:var(--tx);line-height:1.45;margin-bottom:4px;">${titleShort}${l.title&&l.title.length>38?'...':''}</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <div style="font-size:11px;color:var(--txm);">${l.rooms||'?'} · ${l.net_size||'?'}m²</div>
                <div style="font-size:13px;font-weight:700;color:var(--gold);">${fp(l.price)} ₺</div>
              </div>
              ${l.url ? `<button onclick="confirmGoListing('${l.url}')" style="width:100%;padding:5px 10px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:6px;color:var(--gold);font-size:11px;font-weight:600;cursor:pointer;">İlana Git →</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  // AI analizi
  generateValAI(calcResult);
}

function generateValAI(r) {
  const el = document.getElementById('ai-analysis-text');
  if (!el) return;
  const text = `${r.scopeLabel} bölgesindeki ${r.usedPool.length} benzer ilan incelenmiştir. Ortalama m² fiyatı ${fp(Math.round(r.avgM2))} ₺ olan bölgede, belirlenen tahmini değer ${fp(r.estimated)} ₺ olup ${fp(r.low)} ₺ — ${fp(r.high)} ₺ aralığında gerçekçi bir piyasa beklentisi sunmaktadır.

Satıcı için öneri: ${fp(Math.round(r.estimated * 1.05))} ₺ civarından pazarlığa başlanması tavsiye edilir.

Alıcı için öneri: ${fp(Math.round(r.estimated * 0.95))} ₺ altındaki teklifler fırsat olarak değerlendirilebilir.`;

  // Typewriter
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) { el.textContent += text[i]; i++; }
    else clearInterval(interval);
  }, 14);
}

function confirmGoListing(url) {
  if (!url) return;
  if (confirm('Bu sayfadan ayrılıp ilana gideceksiniz. Devam etmek istiyor musunuz?')) {
    window.open(url, '_blank');
  }
}

function toggleAiText(btn) {
  const shortEl = document.getElementById('ai-short-text');
  const fullEl = document.getElementById('ai-full-text');
  if (!shortEl || !fullEl) return;
  const isOpen = fullEl.style.display !== 'none';
  fullEl.style.display = isOpen ? 'none' : 'block';
  shortEl.style.display = isOpen ? 'inline' : 'none';
  btn.textContent = isOpen ? 'Devamını oku ↓' : 'Kapat ↑';
}
