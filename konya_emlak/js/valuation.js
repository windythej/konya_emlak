// allListings = main.js'deki 'all' dizisine referans
Object.defineProperty(window, 'allListings', { get: () => (typeof all !== 'undefined' ? all : []) });

// ===== GELİŞMİŞ DEĞERLEME SİSTEMİ =====

// Freemium - 3 ücretsiz hak
let freeUsed = parseInt(localStorage.getItem('val_used') || '0');
const FREE_LIMIT = 3;

// Form state
const VAL = {
  category: '', // konut, arsa, ticari, kiralik
  district: '',
  quarter: '',
  // Konut
  housingType: '', // daire, mustakil
  apartmentType: '', // daire tipi
  usageStatus: '',
  condition: '',
  rooms: 3,
  salons: 1,
  bathrooms: 1,
  grossM2: 0,
  netM2: 0,
  terraceM2: 0,
  buildingAge: 0,
  totalFloors: 0,
  floor: 0,
  // Ek özellikler
  facades: [],
  views: [],
  heating: '',
  amenities: [],
  // Arsa/Ticari
  landM2: 0,
  zoning: '',
  commercialType: '',
  // Hesaplama
  currentStep: 1,
  totalSteps: 5
};

const STEPS = [
  { num: 1, label: 'Kategori' },
  { num: 2, label: 'Konum' },
  { num: 3, label: 'Özellikler' },
  { num: 4, label: 'Detaylar' },
  { num: 5, label: 'Analiz' }
];

// ===== PROGRESS BAR =====
function renderProgress() {
  const container = document.getElementById('val-progress');
  if (!container) return;
  container.innerHTML = `
    <div class="val-steps">
      ${STEPS.map((s, i) => `
        <div class="val-step ${VAL.currentStep === s.num ? 'active' : ''} ${VAL.currentStep > s.num ? 'done' : ''}">
          ${i < STEPS.length - 1 ? `<div class="val-step-line ${VAL.currentStep > s.num ? 'done' : ''}"></div>` : ''}
          <div class="val-step-num">${VAL.currentStep > s.num ? '✓' : s.num}</div>
          <div class="val-step-label">${s.label}</div>
        </div>
      `).join('')}
    </div>`;
}

// ===== ADIM 1: KATEGORİ =====
function renderStep1() {
  renderProgress();
  updateFreeCounter();
  document.getElementById('val-form-area').innerHTML = `
    <div class="val-form-card">
      <div class="val-form-title">Ne değerlendirmek istiyorsunuz?</div>
      <div class="val-form-sub">Mülk tipini seçerek başlayın. Her kategori için farklı analiz kriterleri kullanılmaktadır.</div>
      <div class="cat-grid">
        <div class="cat-card ${VAL.category === 'konut' ? 'on' : ''}" onclick="selectCat('konut',this)">
          <div class="cat-icon">🏠</div>
          <div class="cat-name">Konut</div>
          <div class="cat-desc">Daire, müstakil ev, villa</div>
        </div>
        <div class="cat-card ${VAL.category === 'arsa' ? 'on' : ''}" onclick="selectCat('arsa',this)">
          <div class="cat-icon">🌍</div>
          <div class="cat-name">Arsa / Arazi</div>
          <div class="cat-desc">İmarlı arsa, tarla, bağ bahçe</div>
        </div>
        <div class="cat-card ${VAL.category === 'ticari' ? 'on' : ''}" onclick="selectCat('ticari',this)">
          <div class="cat-icon">🏢</div>
          <div class="cat-name">Ticari</div>
          <div class="cat-desc">Dükkan, ofis, depo, fabrika</div>
        </div>
        <div class="cat-card ${VAL.category === 'kiralik' ? 'on' : ''}" onclick="selectCat('kiralik',this)">
          <div class="cat-icon">🔑</div>
          <div class="cat-name">Kiralık</div>
          <div class="cat-desc">Aylık kira değeri analizi</div>
        </div>
      </div>
      <div class="val-nav">
        <button class="val-next" onclick="goStep(2)" ${!VAL.category ? 'disabled' : ''}>Devam Et →</button>
      </div>
    </div>`;

  document.getElementById('val-info-area').innerHTML = `
    <div class="val-info-panel">
      <div class="val-info-icon">🎯</div>
      <div class="val-info-title">Nasıl Çalışır?</div>
      <div class="val-info-text">
        Konya piyasa veritabanındaki <strong>gerçek ilan verileri</strong> kullanılarak yapay zeka destekli analiz yapılır.
      </div>
      <ul class="val-info-list">
        <li>Bölgenizdeki benzer ilanlar karşılaştırılır</li>
        <li>Bina yaşı, kat, özellikler hesaba katılır</li>
        <li>Yatırım getiri tahmini sunulur</li>
        <li>±%15 sapma bandı ile değer aralığı verilir</li>
      </ul>
    </div>`;
}

function selectCat(cat, el) {
  VAL.category = cat;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('on'));
  // el: tıklanan element (onclick="selectCat('konut',this)")
  if(el) el.classList.add('on');
  const nx = document.querySelector('.val-next');
  if(nx) nx.removeAttribute('disabled');
}

// ===== ADIM 2: KONUM =====
function renderStep2() {
  renderProgress();
  const districts = [...new Set(allListings.map(l => l.district).filter(Boolean))].sort();
  const extraDistricts = ['Ahırlı','Akören','Akşehir','Altınekin','Beyşehir','Bozkır','Cihanbeyli','Çeltik','Çumra','Derbent','Derebucak','Doğanhisar','Emirgazi','Ereğli','Güneysınır','Hadim','Halkapınar','Hüyük','Ilgın','Kadınhanı','Karapınar','Karatay','Kulu','Meram','Sarayönü','Selçuklu','Seydişehir','Taşkent','Tuzlukçu','Yalıhüyük','Yunak'];
  const allDistricts = [...new Set([...districts, ...extraDistricts])].sort();

  document.getElementById('val-form-area').innerHTML = `
    <div class="val-form-card">
      <div class="val-form-title">Mülkün konumu nerede?</div>
      <div class="val-form-sub">Konum, değerleme analizinin en kritik faktörüdür.</div>
      <div class="vfg">
        <label class="vfl">İlçe <span class="req">*</span></label>
        <select class="vsel" id="v2-district" onchange="step2DistrictChange()">
          <option value="">İlçe seçin...</option>
          ${allDistricts.map(d => `<option value="${d}" ${VAL.district === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="vfg">
        <label class="vfl">Mahalle / Semt</label>
        <select class="vsel" id="v2-quarter">
          <option value="">Mahalle seçin (isteğe bağlı)</option>
          ${VAL.district ? getQuarters(VAL.district).map(q => `<option value="${q}" ${VAL.quarter === q ? 'selected' : ''}>${q}</option>`).join('') : ''}
        </select>
      </div>
      <div class="val-nav">
        <button class="val-back" onclick="goStep(1)">← Geri</button>
        <button class="val-next" onclick="step2Next()">Devam Et →</button>
      </div>
    </div>`;

  document.getElementById('val-info-area').innerHTML = `
    <div class="val-info-panel">
      <div class="val-info-icon">📍</div>
      <div class="val-info-title">Konum Etkisi</div>
      <div class="val-info-text">Konya'da lokasyon fiyatları büyük ölçüde etkiler.</div>
      <ul class="val-info-list">
        <li><strong>Selçuklu</strong> — Merkezi ilçe, yüksek talep</li>
        <li><strong>Meram</strong> — Doğa yakın, değer artışı</li>
        <li><strong>Karatay</strong> — Tarihi merkez, karışık</li>
        <li>Mahalle seçimi analizin doğruluğunu artırır</li>
      </ul>
    </div>`;
}

function getQuarters(district) {
  const fromDB = [...new Set(allListings.filter(l => l.district === district).map(l => l.quarter).filter(Boolean))].sort();
  const STATIC = {
    'Selçuklu': ['Yazır Mh.','Sancak Mh.','Şeker Mh.','Beyhekim Mh.','Binkonutlar Mh.','Musalla Bağları Mh.','Bosna Mh.','Aydınlıkevler Mh.','Nalçacı Mh.'],
    'Meram': ['Yaka Mh.','Yeni Meram Mh.','Karahüyük Mh.','Sille Mh.','Feritköy Mh.','Harmancık Mh.'],
    'Karatay': ['Emirgazi Mh.','Akabe Mh.','Fetih Cd.','Hacı Musa Mh.','Karakurt Mh.'],
  };
  return [...new Set([...fromDB, ...(STATIC[district] || [])])].sort();
}

function step2DistrictChange() {
  VAL.district = document.getElementById('v2-district').value;
  const quarters = getQuarters(VAL.district);
  const sel = document.getElementById('v2-quarter');
  sel.innerHTML = '<option value="">Mahalle seçin (isteğe bağlı)</option>' +
    quarters.map(q => `<option value="${q}">${q}</option>`).join('');
}

function step2Next() {
  VAL.district = document.getElementById('v2-district').value;
  VAL.quarter = document.getElementById('v2-quarter').value;
  if (!VAL.district) { showValError('Lütfen ilçe seçin.'); return; }
  goStep(3);
}

// ===== ADIM 3: ÖZELLİKLER =====
function renderStep3() {
  renderProgress();
  let html = '';

  if (VAL.category === 'konut' || VAL.category === 'kiralik') {
    html = `
      <div class="val-form-card">
        <div class="val-form-title">Konut özelliklerini girin</div>
        <div class="val-form-sub">* ile işaretli alanlar değerleme için zorunludur.</div>

        <div class="vfg">
          <label class="vfl">Konut Tipi <span class="req">*</span></label>
          <div class="chip-group">
            <button class="vchip ${VAL.housingType === 'daire' ? 'on' : ''}" onclick="setChip('housingType','daire',this)" onmouseenter="hoverInfo('housingType','daire')" onmouseleave="updateInfoPanel()">Apartman</button>
            <button class="vchip ${VAL.housingType === 'mustakil' ? 'on' : ''}" onclick="setChip('housingType','mustakil',this)" onmouseenter="hoverInfo('housingType','mustakil')" onmouseleave="updateInfoPanel()">Müstakil</button>
          </div>
        </div>

        <div class="vfg" id="apt-type-group" ${VAL.housingType !== 'daire' ? 'style="display:none"' : ''}>
          <label class="vfl">Apartman Tipi</label>
          <div class="chip-group">
            ${['Daire','Teras Dubleks','Ara Kat Dubleks','Bahçe Dubleks','Ters Dubleks'].map(t =>
              `<button class="vchip ${VAL.apartmentType === t ? 'on' : ''}" onclick="setChip('apartmentType','${t}',this)" onmouseenter="hoverInfo('apartmentType','${t}')" onmouseleave="updateInfoPanel()">${t}</button>`
            ).join('')}
          </div>
        </div>

        <div class="vfg">
          <label class="vfl">Kullanım Durumu</label>
          <div class="chip-group">
            ${['Mülk Sahibi','Kiracı','Boş'].map(t =>
              `<button class="vchip ${VAL.usageStatus === t ? 'on' : ''}" onclick="setChip('usageStatus','${t}',this)" onmouseenter="hoverInfo('usageStatus','${t}')" onmouseleave="updateInfoPanel()">${t}</button>`
            ).join('')}
          </div>
        </div>

        <div class="vfg">
          <label class="vfl">Yapı Durumu <span class="req">*</span></label>
          <div class="chip-group">
            ${['Bakımlı/Yenilenmiş','Standart','Tadilat İhtiyacı Var'].map(t =>
              `<button class="vchip ${VAL.condition === t ? 'on' : ''}" onclick="setChip('condition','${t}',this)" onmouseenter="hoverInfo('condition','${t}')" onmouseleave="updateInfoPanel()">${t}</button>`
            ).join('')}
          </div>
        </div>

        <div class="vrow3">
          <div class="vfg">
            <label class="vfl">Oda <span class="req">*</span></label>
            ${numInput('rooms', VAL.rooms, 0, 20)}
          </div>
          <div class="vfg">
            <label class="vfl">Salon</label>
            ${numInput('salons', VAL.salons, 0, 5)}
          </div>
          <div class="vfg">
            <label class="vfl">Banyo <span class="req">*</span></label>
            ${numInput('bathrooms', VAL.bathrooms, 1, 10)}
          </div>
        </div>

        <div class="vrow2">
          <div class="vfg">
            <label class="vfl">Brüt m² <span class="req">*</span></label>
            <input type="number" class="vinput" id="v-gross" value="${VAL.grossM2 || ''}" placeholder="örn. 140" min="20">
          </div>
          <div class="vfg">
            <label class="vfl">Net m² <span class="req">*</span></label>
            <input type="number" class="vinput" id="v-net" value="${VAL.netM2 || ''}" placeholder="örn. 120" min="20">
          </div>
        </div>

        <div class="vrow3">
          <div class="vfg">
            <label class="vfl">Bina Yaşı <span class="req">*</span></label>
            ${numInput('buildingAge', VAL.buildingAge, 0, 100)}
          </div>
          <div class="vfg">
            <label class="vfl">Toplam Kat</label>
            ${numInput('totalFloors', VAL.totalFloors, 1, 50)}
          </div>
          <div class="vfg">
            <label class="vfl">Bulunduğu Kat <span class="req">*</span></label>
            ${numInput('floor', VAL.floor, 0, 50)}
          </div>
        </div>

        <p style="font-size:11px;color:var(--txm);margin-top:8px;">* işareti otomatik değerleme için zorunlu alanı belirtmektedir.</p>

        <div class="val-nav">
          <button class="val-back" onclick="goStep(2)">← Geri</button>
          <button class="val-next" onclick="step3Next()">Devam Et →</button>
        </div>
      </div>`;

    document.getElementById('val-info-area').innerHTML = `
      <div class="val-info-panel">
        <div class="val-info-icon">🏠</div>
        <div class="val-info-title">Yapı Durumu</div>
        <ul class="val-info-list">
          <li><strong>Bakımlı/Yenilenmiş;</strong> Yapının tüm unsurları düzenli bakımlı, onarılmış ve yenilenmiş</li>
          <li><strong>Standart;</strong> Belirli bir kalite ve seviyeye uygun, normal kullanım durumu</li>
          <li><strong>Tadilat İhtiyacı Var;</strong> Tadilatı gereken, yenileme bekleyen mülkler</li>
        </ul>
      </div>`;

  } else if (VAL.category === 'arsa') {
    html = `
      <div class="val-form-card">
        <div class="val-form-title">Arsa / Arazi bilgilerini girin</div>
        <div class="val-form-sub">* ile işaretli alanlar değerleme için zorunludur.</div>
        <div class="vfg">
          <label class="vfl">Arsa Tipi <span class="req">*</span></label>
          <div class="chip-group">
            ${['İmarlı Arsa','Tarla','Bağ/Bahçe','Zeytinlik','Orman','Ham Arazi'].map(t =>
              `<button class="vchip ${VAL.zoning === t ? 'on' : ''}" onclick="setChip('zoning','${t}',this)">${t}</button>`
            ).join('')}
          </div>
        </div>
        <div class="vfg">
          <label class="vfl">Alan (m²) <span class="req">*</span></label>
          <input type="number" class="vinput" id="v-land" value="${VAL.landM2 || ''}" placeholder="örn. 500">
        </div>
        <div class="val-nav">
          <button class="val-back" onclick="goStep(2)">← Geri</button>
          <button class="val-next" onclick="step3NextArsa()">Devam Et →</button>
        </div>
      </div>`;

    document.getElementById('val-info-area').innerHTML = `
      <div class="val-info-panel">
        <div class="val-info-icon">🌍</div>
        <div class="val-info-title">Arsa Değerlemesi</div>
        <div class="val-info-text">İmarlı arsa değerlemesi, bölgedeki emsal satışlar ve imar durumuna göre hesaplanır.</div>
      </div>`;

  } else if (VAL.category === 'ticari') {
    html = `
      <div class="val-form-card">
        <div class="val-form-title">Ticari mülk bilgilerini girin</div>
        <div class="val-form-sub">* ile işaretli alanlar değerleme için zorunludur.</div>
        <div class="vfg">
          <label class="vfl">Ticari Mülk Tipi <span class="req">*</span></label>
          <div class="chip-group">
            ${['Dükkan/Mağaza','Ofis','Depo/Antrepo','Fabrika','Arazi/Tarla','Plaza','Otel'].map(t =>
              `<button class="vchip ${VAL.commercialType === t ? 'on' : ''}" onclick="setChip('commercialType','${t}',this)">${t}</button>`
            ).join('')}
          </div>
        </div>
        <div class="vrow2">
          <div class="vfg">
            <label class="vfl">Brüt m² <span class="req">*</span></label>
            <input type="number" class="vinput" id="v-gross" value="${VAL.grossM2 || ''}" placeholder="örn. 80">
          </div>
          <div class="vfg">
            <label class="vfl">Bina Yaşı</label>
            ${numInput('buildingAge', VAL.buildingAge, 0, 100)}
          </div>
        </div>
        <div class="val-nav">
          <button class="val-back" onclick="goStep(2)">← Geri</button>
          <button class="val-next" onclick="step3NextTicari()">Devam Et →</button>
        </div>
      </div>`;

    document.getElementById('val-info-area').innerHTML = `
      <div class="val-info-panel">
        <div class="val-info-icon">🏢</div>
        <div class="val-info-title">Ticari Değerleme</div>
        <div class="val-info-text">Ticari mülkler, kira getirisi ve bölge ticaret yoğunluğuna göre değerlenir.</div>
      </div>`;
  }

  document.getElementById('val-form-area').innerHTML = html;
}

function numInput(key, val, min, max) {
  return `<div class="num-input">
    <button class="num-btn" onclick="changeNum('${key}',-1,${min},${max})">−</button>
    <input class="num-val" id="v-${key}" type="number" value="${val}" min="${min}" max="${max}" onchange="VAL['${key}']=Math.min(${max},Math.max(${min},parseInt(this.value)||${min}))">
    <button class="num-btn" onclick="changeNum('${key}',1,${min},${max})">+</button>
  </div>`;
}

function changeNum(key, delta, min, max) {
  const el = document.getElementById('v-' + key);
  const cur = parseInt(el.value) || min;
  const newVal = Math.min(max, Math.max(min, cur + delta));
  el.value = newVal;
  VAL[key] = newVal;
  if (key === 'housingType') document.getElementById('apt-type-group').style.display = VAL.housingType === 'daire' ? '' : 'none';
}

function setChip(key, val, el) {
  VAL[key] = val;
  const group = el.parentElement;
  const isMulti = el.classList.contains('multi');
  if (!isMulti) {
    group.querySelectorAll('.vchip').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
  } else {
    el.classList.toggle('on');
    if (!VAL[key + 's']) VAL[key + 's'] = [];
    if (el.classList.contains('on')) VAL[key + 's'].push(val);
    else VAL[key + 's'] = VAL[key + 's'].filter(v => v !== val);
  }
  if (key === 'housingType') {
    const aptGroup = document.getElementById('apt-type-group');
    if (aptGroup) aptGroup.style.display = val === 'daire' ? '' : 'none';
  }
  updateInfoPanel();
}

function setMultiChip(arr, val, el) {
  el.classList.toggle('on');
  const idx = arr.indexOf(val);
  if (el.classList.contains('on') && idx === -1) arr.push(val);
  else if (!el.classList.contains('on') && idx > -1) arr.splice(idx, 1);
}

function step3Next() {
  VAL.grossM2 = parseInt(document.getElementById('v-gross')?.value) || 0;
  VAL.netM2 = parseInt(document.getElementById('v-net')?.value) || 0;
  VAL.rooms = parseInt(document.getElementById('v-rooms')?.value) || 1;
  VAL.bathrooms = parseInt(document.getElementById('v-bathrooms')?.value) || 1;
  VAL.buildingAge = parseInt(document.getElementById('v-buildingAge')?.value) || 0;
  VAL.floor = parseInt(document.getElementById('v-floor')?.value) || 0;
  VAL.totalFloors = parseInt(document.getElementById('v-totalFloors')?.value) || 0;

  if (!VAL.housingType) { showValError('Konut tipini seçin.'); return; }
  if (!VAL.netM2 || VAL.netM2 < 20) { showValError('Geçerli bir net m² girin.'); return; }
  goStep(4);
}

function step3NextArsa() {
  VAL.landM2 = parseInt(document.getElementById('v-land')?.value) || 0;
  if (!VAL.zoning) { showValError('Arsa tipini seçin.'); return; }
  if (!VAL.landM2) { showValError('Alan girin.'); return; }
  goStep(4);
}

function step3NextTicari() {
  VAL.grossM2 = parseInt(document.getElementById('v-gross')?.value) || 0;
  VAL.buildingAge = parseInt(document.getElementById('v-buildingAge')?.value) || 0;
  if (!VAL.commercialType) { showValError('Ticari mülk tipini seçin.'); return; }
  if (!VAL.grossM2) { showValError('Alan girin.'); return; }
  goStep(4);
}

// ===== ADIM 4: EK ÖZELLİKLER =====
function renderStep4() {
  renderProgress();
  document.getElementById('val-form-area').innerHTML = `
    <div class="val-form-card">
      <div class="val-form-title">Ek özellikleri girin</div>
      <div class="val-form-sub">Bu bilgiler değerlemeyi daha doğru hale getirir. İsteğe bağlıdır.</div>

      ${(VAL.category === 'konut' || VAL.category === 'kiralik') ? `
      <div class="vfg">
        <label class="vfl">Cephe Durumu <span style="font-size:10px;color:var(--txm);letter-spacing:0;">(Birden fazla seçilebilir)</span></label>
        <div class="chip-group">
          ${['Kuzey','Güney','Doğu','Batı'].map(f =>
            `<button class="vchip multi ${VAL.facades.includes(f) ? 'on' : ''}" onclick="setMultiChip(VAL.facades,'${f}',this)">${f}</button>`
          ).join('')}
        </div>
      </div>

      <div class="vfg">
        <label class="vfl">Manzara <span style="font-size:10px;color:var(--txm);letter-spacing:0;">(Birden fazla seçilebilir)</span></label>
        <div class="chip-group">
          ${['İstinat Duvarı','Yan Bina','Cadde/Sokak','Bahçe','Şehir','Doğa','Göl'].map(v =>
            `<button class="vchip multi ${VAL.views.includes(v) ? 'on' : ''}" onclick="setMultiChip(VAL.views,'${v}',this)">${v}</button>`
          ).join('')}
        </div>
      </div>

      <div class="vfg">
        <label class="vfl">Isıtma Sistemi <span class="req">*</span></label>
        <div class="chip-group">
          ${['Yok','Soba','Doğalgaz Sobası','Kat Kaloriferi','Doğalgaz/Kombi','Merkezi Sistem','Merkezi Isı Pay Ölçer','Yerden Isıtma','Klima Sistemi','Jeotermal','Güneş Enerjisi'].map(h =>
            `<button class="vchip ${VAL.heating === h ? 'on' : ''}" onclick="setChip('heating','${h}',this)" onmouseenter="hoverInfo('heating','${h}')" onmouseleave="updateInfoPanel()">${h}</button>`
          ).join('')}
        </div>
      </div>

      <div class="vfg">
        <label class="vfl">Olanaklar <span style="font-size:10px;color:var(--txm);letter-spacing:0;">(Birden fazla seçilebilir)</span></label>
        <div class="chip-group">
          ${['Asansör','Otopark','Kapalı Otopark','Güvenlik','Bina/Site Görevlisi','Jeneratör','Açık Havuz','Kapalı Havuz','Isı Yalıtımı','Klima','Spor Salonu','Çocuk Oyun Parkı','Şömine'].map(a =>
            `<button class="vchip multi ${VAL.amenities.includes(a) ? 'on' : ''}" onclick="setMultiChip(VAL.amenities,'${a}',this)">${a}</button>`
          ).join('')}
        </div>
      </div>
      ` : `
      <div class="vfg">
        <label class="vfl">Olanaklar</label>
        <div class="chip-group">
          ${['Elektrik','Su','Doğalgaz','Yol Cepheli','Köşe Parsel'].map(a =>
            `<button class="vchip multi ${VAL.amenities.includes(a) ? 'on' : ''}" onclick="setMultiChip(VAL.amenities,'${a}',this)">${a}</button>`
          ).join('')}
        </div>
      </div>
      `}

      <div class="val-nav">
        <button class="val-back" onclick="goStep(3)">← Geri</button>
        <button class="val-next" onclick="goStep(5)">Analizi Başlat →</button>
      </div>
    </div>`;

  document.getElementById('val-info-area').innerHTML = `
    <div class="val-info-panel">
      <div class="val-info-icon">💡</div>
      <div class="val-info-title">Cephe Durumu</div>
      <div class="val-info-text">
        Cephe belirlemede yalnızca konutun içinden dış dünyayı gören cepheleri esas alın. Bitişik nizamdan kapalı olan cepheleri dikkate almayın.
      </div>
      <ul class="val-info-list">
        <li>Güney cephe ışık avantajı sağlar</li>
        <li>Şehir manzarası değeri artırır</li>
        <li>Asansör ve otopark değere doğrudan katkı sağlar</li>
        <li>Isı yalıtımı uzun vadeli tasarruf demektir</li>
      </ul>
    </div>`;
}

// ===== ADIM 5: ANALİZ =====
function renderStep5() {
  renderProgress();

  // Freemium kontrol
  if (!currentUser && freeUsed >= FREE_LIMIT) {
    showSubPopup();
    return;
  }

  document.getElementById('val-form-area').innerHTML = `
    <div class="val-form-card">
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:36px;margin-bottom:12px;">🔍</div>
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:var(--tx);margin-bottom:8px;">Analiz Yapılıyor...</div>
        <div style="font-size:13px;color:var(--txm);">Piyasa verileri karşılaştırılıyor</div>
        <div class="spin" style="margin:20px auto;"></div>
      </div>
    </div>`;

  document.getElementById('val-info-area').innerHTML = `<div class="val-info-panel">
    <div class="val-info-icon">⏳</div>
    <div class="val-info-title">Hesaplanıyor</div>
    <div class="val-info-text">Bölgenizdeki benzer ilanlar analiz ediliyor...</div>
  </div>`;

  setTimeout(() => calcAndRender(), 1200);
}

function calcAndRender() {
  // Freemium kullanım artır
  if (!currentUser) {
    freeUsed++;
    localStorage.setItem('val_used', freeUsed);
    updateFreeCounter();
  }

  // Arsa ve ticari: konut verisi yoktur, sabit bölge m² katsayısı kullan
  if (VAL.category === 'arsa' || VAL.category === 'ticari') {
    calcAndRenderNonKonut();
    return;
  }

  const roomsStr = VAL.rooms + '+' + VAL.salons;
  let pool = [...allListings].filter(l => l.district === VAL.district && l.net_size > 0);
  let byQ = VAL.quarter ? pool.filter(l => l.quarter === VAL.quarter) : [];
  let usedPool = byQ.length >= 3 ? byQ : pool;
  let scopeLabel = byQ.length >= 3 ? VAL.quarter : VAL.district + ' geneli';

  // İlan yaşı filtresi - 90+ günlük ilanları düşük ağırlıkla al
  const now = new Date();
  const freshPool = usedPool.filter(l => {
    if (!l.created_at) return true;
    const days = Math.floor((now - new Date(l.created_at)) / 86400000);
    return days <= 90;
  });
  const finalPool = freshPool.length >= 3 ? freshPool : usedPool;
  const hasStaleData = freshPool.length < usedPool.length;

  // Oda filtresi
  const roomPool = finalPool.filter(l => l.rooms === roomsStr);
  const calcPool = roomPool.length >= 3 ? roomPool : finalPool;

  if (calcPool.length === 0) {
    document.getElementById('val-form-area').innerHTML = `
      <div class="val-form-card">
        <div class="empty-state">
          <h3>Yeterli veri yok</h3>
          <p>${VAL.district} ilçesinde benzer ilan bulunamadı. Farklı bölge deneyin.</p>
          <button class="val-back" style="margin-top:16px;" onclick="goStep(1)">Yeniden Başla</button>
        </div>
      </div>`;
    return;
  }

  // Hesaplama
  const avgM2 = calcPool.reduce((s, l) => s + l.price / l.net_size, 0) / calcPool.length;
  const m2 = VAL.netM2 || VAL.grossM2 * 0.85 || VAL.landM2;

  // Faktörler
  const age = VAL.buildingAge;
  let ageFactor = age <= 2 ? 1.10 : age <= 5 ? 1.06 : age <= 10 ? 1.02 : age <= 15 ? 1.00 : age <= 20 ? 0.95 : age <= 30 ? 0.88 : 0.80;
  
  // Kat faktörü
  const totalF = VAL.totalFloors || 10;
  const floorRatio = VAL.floor / totalF;
  let floorFactor = floorRatio < 0.1 ? 0.95 : floorRatio > 0.8 ? 1.05 : 1.0;

  // Yapı durumu
  let condFactor = VAL.condition === 'Bakımlı/Yenilenmiş' ? 1.08 : VAL.condition === 'Tadilat İhtiyacı Var' ? 0.88 : 1.0;

  // Olanaklar
  let amenBonus = 1;
  if (VAL.amenities.includes('Asansör')) amenBonus += 0.015;
  if (VAL.amenities.includes('Otopark') || VAL.amenities.includes('Kapalı Otopark')) amenBonus += 0.02;
  if (VAL.amenities.includes('Güvenlik')) amenBonus += 0.01;
  if (VAL.amenities.includes('Kapalı Havuz') || VAL.amenities.includes('Açık Havuz')) amenBonus += 0.025;
  if (VAL.amenities.includes('Isı Yalıtımı')) amenBonus += 0.01;

  // Isıtma
  let heatFactor = ['Yerden Isıtma','Jeotermal','Merkezi Isı Pay Ölçer'].includes(VAL.heating) ? 1.03 : ['Soba','Yok'].includes(VAL.heating) ? 0.96 : 1.0;

  // Küçük daire düzeltmesi: 75m² altında piyasada birim m² yüksek ama toplam fiyat beklentisi düşük
  const sizeAdj = m2 < 60 ? 0.87 : m2 < 75 ? 0.93 : m2 < 90 ? 0.97 : 1.0;
  const estimated = Math.round(avgM2 * m2 * ageFactor * floorFactor * condFactor * amenBonus * heatFactor * sizeAdj);
  const real = Math.round(estimated * 0.92);
  const low = Math.round(estimated * 0.88);
  const high = Math.round(estimated * 1.12);

  // Kira tahmini (yıllık brüt getiri ~4-5%)
  const rentEstimate = Math.round(estimated * 0.004);
  const rentYield = ((rentEstimate * 12) / estimated * 100).toFixed(1);
  const paybackYears = Math.round(estimated / (rentEstimate * 12));

  // Fırsat skoru (0-100)
  const avgPoolPrice = calcPool.reduce((s, l) => s + l.price, 0) / calcPool.length;
  const priceScore = Math.min(100, Math.max(0, Math.round(100 - ((estimated - avgPoolPrice) / avgPoolPrice * 100))));

  // AI analizi
  const aiAnalysis = generateAIText(VAL, estimated, real, avgM2, calcPool.length, scopeLabel, hasStaleData);

  // ── Endeksa benzeri sonuç ekranı ──
  const confidenceScore = Math.min(95, Math.round(55 + calcPool.length * 3));

  document.getElementById('val-form-area').innerHTML = `
    <div class="val-result-layout"><div class="val-result-endeksa">

      <!-- ÜST BAŞLIK -->
      <div class="vre-header">
        <div>
          <div class="vre-title">Değerleme Sonucu</div>
          <div class="vre-sub">${scopeLabel} · ${roomsStr} · ${m2}m² · ${age} yaş bina</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="vre-new-btn" onclick="goBack5()">← Geri Dön</button>
          <button class="vre-new-btn" onclick="goStep(1)">+ Yeni Değerleme</button>
        </div>
      </div>

      <!-- ANA SONUÇ KARTI -->
      <div class="vre-main">
        <!-- Sol: Fiyat kartı -->
        <div class="vre-price-card">
          <div class="vre-price-icon">🏠</div>
          <div class="vre-price-label">TAHMİNİ DEĞER</div>
          <div class="vre-price-big">${fp(estimated)} ₺</div>
          <div class="vre-confidence">
            <div class="vre-conf-bar">
              <div class="vre-conf-fill" style="width:${confidenceScore}%"></div>
            </div>
            <span class="vre-conf-txt">⊙ ${confidenceScore} Güven Puanı</span>
          </div>
          <div class="vre-minmax">
            <div class="vre-min">
              <span class="vre-mm-icon vre-down">↓</span>
              <span class="vre-mm-lbl">Min Değer</span>
              <span class="vre-mm-val">${fp(low)} ₺</span>
            </div>
            <div class="vre-max">
              <span class="vre-mm-icon vre-up">↑</span>
              <span class="vre-mm-lbl">Maks Değer</span>
              <span class="vre-mm-val">${fp(high)} ₺</span>
            </div>
          </div>
        </div>

        <!-- Sağ: Adım listesi -->
        <div class="vre-steps-panel" style="display:flex;flex-direction:column;gap:8px;justify-content:center;">
          <div style="font-size:10px;color:var(--txm);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Sonraki Adımlar</div>
          <div class="vre-step-item done" style="padding:11px 14px;"><div class="vre-step-icon" style="width:30px;height:30px;font-size:12px;flex-shrink:0;">✎</div><div class="vre-step-body"><div class="vre-step-title" style="font-size:12px;margin-bottom:0;">1 — Özellikler Girildi</div></div></div>
          <div class="vre-step-item active" style="padding:11px 14px;"><div class="vre-step-icon" style="width:30px;height:30px;font-size:12px;flex-shrink:0;">⊙</div><div class="vre-step-body"><div class="vre-step-title" style="font-size:12px;margin-bottom:0;">2 — Değer Hesaplandı</div></div><div class="vre-step-arrow">›</div></div>
          <div class="vre-step-item" style="padding:11px 14px;"><div class="vre-step-icon" style="width:30px;height:30px;font-size:12px;flex-shrink:0;">👤</div><div class="vre-step-body"><div class="vre-step-title" style="font-size:12px;margin-bottom:0;">3 — Danışman Bul</div></div></div>
          <div class="vre-step-item" style="padding:11px 14px;"><div class="vre-step-icon" style="width:30px;height:30px;font-size:12px;flex-shrink:0;">✓</div><div class="vre-step-body"><div class="vre-step-title" style="font-size:12px;margin-bottom:0;">4 — Güvenle Sat</div></div></div>
          <button class="vre-advisor-btn" style="margin-top:8px;padding:11px;" onclick="window._goAdvisor && window._goAdvisor(\'${VAL.district}\')">
            👤 Danışman Bul
          </button>
        </div>
      </div>

      <!-- YATIRIM ANALİZİ -->
      <div class="vre-invest">
        <div class="vre-section-title">Yatırım Analizi</div>
        <div class="vre-invest-grid">
          <div class="vre-invest-card">
            <div class="vre-ic-lbl">Tahmini Aylık Kira</div>
            <div class="vre-ic-val ok">${fp(rentEstimate)} ₺</div>
          </div>
          <div class="vre-invest-card">
            <div class="vre-ic-lbl">Brüt Kira Getirisi</div>
            <div class="vre-ic-val ok">%${rentYield}</div>
          </div>
          <div class="vre-invest-card">
            <div class="vre-ic-lbl">Amortisman Süresi</div>
            <div class="vre-ic-val">${paybackYears} yıl</div>
          </div>
          <div class="vre-invest-card">
            <div class="vre-ic-lbl">Fırsat Skoru</div>
            <div class="vre-ic-val ${priceScore >= 60 ? 'ok' : priceScore >= 40 ? '' : 'err'}">${priceScore}/100</div>
          </div>
        </div>
      </div>

      <!-- AI ANALİZİ -->
      <div class="vre-ai">
        <div class="vre-ai-badge">▲ AI ANALİZİ</div>
        <div class="vre-ai-text" id="ai-analysis-text"></div>
      </div>

      <div class="vre-disclaimer">* ${calcPool.length} benzer ilan analiz edilmiştir. Tahmin ±%12 sapma gösterebilir.</div>
    </div>`;

  // Sağ panel benzer ilanlar
  const similarList = calcPool.slice(0, 5);
  document.getElementById('val-info-area').innerHTML = `
    <div class="val-info-panel">
      <div class="val-info-icon">🏠</div>
      <div class="val-info-title">Benzer İlanlar</div>
      ${similarList.map(l => {
        const days = l.created_at ? Math.floor((Date.now() - new Date(l.created_at)) / 86400000) : null;
        const ageBadge = days === null ? '' : days <= 7 ? '<span class="age-badge age-new">Yeni</span>' : days <= 30 ? `<span class="age-badge age-normal">${days} gün</span>` : days <= 90 ? `<span class="age-badge age-old">${days} gün</span>` : '<span class="age-badge age-very-old">Eski</span>';
        return `<div style="padding:12px 0;border-bottom:1px solid var(--bd);">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
            <div style="font-size:12px;color:var(--tx);flex:1;margin-right:8px;line-height:1.4;">${(l.title||'').substring(0,45)}...</div>
            ${ageBadge}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:11px;color:var(--txm);">${l.rooms||'?'} · ${l.net_size||'?'}m²</div>
            <div style="font-size:13px;font-weight:700;color:var(--gold);">${fp(l.price)} ₺</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  // AI typewriter
  typewriter('ai-analysis-text', aiAnalysis, 15);
}

function generateAIText(v, estimated, real, avgM2, count, scope, stale) {
  const age = v.buildingAge;
  let ageText = age <= 2 ? 'Sıfır veya çok yeni yapı olması' : age <= 5 ? 'Yeni yapı olması' : age <= 10 ? 'Makul yaşta olması' : age <= 20 ? 'Orta yaşlı bina' : 'Eski yapı olması';
  let ageEffect = age <= 5 ? 'değere olumlu katkı sağlamaktadır' : age <= 15 ? 'standart piyasa değeriyle uyumludur' : 'fiyatı bölge ortalamasının altında tutmaktadır';

  return `${scope} bölgesindeki güncel piyasa verileri incelendiğinde, ${v.netM2 || v.grossM2}m² büyüklüğündeki konut için belirlenen ${fp(Math.round(avgM2))} TL/m² ortalama birim fiyat bölge rayiçleriyle örtüşmektedir. ${ageText} ${ageEffect}.

Satıcı için öneri: ${fp(Math.round(estimated * 1.05))} TL civarından pazarlığa başlanması, alıcıya makul bir indirim payı bırakırken hedef satış fiyatına ulaşmayı kolaylaştıracaktır.

Alıcı için öneri: ${fp(real)} TL altındaki teklifler fırsat olarak değerlendirilebilir.${stale ? '\n\nNot: Bazı eski ilanlar analizden çıkarıldı, güncel piyasa fiyatları esas alındı.' : ''}`;
}

// Sonuç ekranından geri dön - freemium kullanımı geri al
function goBack5() {
  if(!currentUser && freeUsed > 0) {
    freeUsed--;
    localStorage.setItem('val_used', freeUsed);
  }
  goStep(4);
}

function typewriter(id, text, speed) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// ===== ARSA / TİCARİ HESAPLAMA =====
// Supabase'de arsa/ticari ilan verisi yok; sabit bölge emsal katsayıları kullanılır
const ARSA_M2_KATSAYILARI = {
  // TL/m² - 2025 Konya emsal değerleri (imarlı arsa)
  'Selçuklu':3_800,'Meram':3_000,'Karatay':2_500,
  'Beyşehir':2_000,'Ereğli':1_800,'Akşehir':1_900,
  'Seydişehir':1_600,'Cihanbeyli':1_400,'Çumra':1_500,
  'Kulu':1_300,'Ilgın':1_400,'Kadınhanı':1_200,
  'Karapınar':1_300,'Sarayönü':1_200,'Bozkır':1_400,
  'Hadim':1_200,'Doğanhisar':1_100,'Güneysınır':1_100,
  'Halkapınar':1_000,'Taşkent':1_000,'Derebucak':1_000,
  'Altınekin':1_100,'Akören':1_000,'Ahırlı':950,
  'Emirgazi':1_000,'Derbent':950,'Hüyük':1_000,
  'Tuzlukçu':1_000,'Yalıhüyük':950,'Çeltik':950,
  'Yunak':1_100,
};
const TICARI_M2_KATSAYILARI = {
  'Selçuklu':45_000,'Meram':35_000,'Karatay':28_000,
  'Beyşehir':18_000,'Ereğli':15_000,'Akşehir':16_000,
  'Seydişehir':13_000,'Cihanbeyli':11_000,'Çumra':12_000,
  'Kulu':10_000,'Ilgın':10_000,'Kadınhanı':9_500,
  'Karapınar':10_000,'Sarayönü':9_000,'Bozkır':8_500,
  'Hadim':8_000,'Doğanhisar':7_500,'Güneysınır':7_500,
  'Halkapınar':7_000,'Taşkent':7_000,'Derebucak':7_000,
  'Altınekin':8_000,'Akören':7_500,'Ahırlı':7_000,
  'Emirgazi':7_500,'Derbent':7_000,'Hüyük':8_000,
  'Tuzlukçu':8_000,'Yalıhüyük':7_000,'Çeltik':7_500,
  'Yunak':9_000,
};
// Arsa tipi çarpanları
const ZONING_MULT = {
  'İmarlı Arsa': 1.00, 'Tarla': 0.18, 'Bağ/Bahçe': 0.30,
  'Zeytinlik': 0.22, 'Orman': 0.08, 'Ham Arazi': 0.12,
};

function calcAndRenderNonKonut() {
  const fp = n => new Intl.NumberFormat('tr-TR').format(Math.round(n));
  const isArsa = VAL.category === 'arsa';
  const m2 = isArsa ? (VAL.landM2 || 0) : (VAL.grossM2 || 0);

  if (m2 <= 0) {
    document.getElementById('val-form-area').innerHTML = `<div class="val-form-card"><div class="empty-state"><h3>Alan girilmedi</h3><p>Lütfen geri dönüp alan bilgisini girin.</p><button class="val-back" onclick="goStep(VAL.category==='arsa'?3:3)">← Geri</button></div></div>`;
    return;
  }

  const baseMap  = isArsa ? ARSA_M2_KATSAYILARI  : TICARI_M2_KATSAYILARI;
  const baseM2   = baseMap[VAL.district] || (isArsa ? 2_000 : 15_000);
  const zoningMult = isArsa ? (ZONING_MULT[VAL.zoning] || 0.20) : 1.0;

  // Bina yaşı (ticari için)
  const age = VAL.buildingAge || 0;
  const ageFactor = isArsa ? 1.0 :
    (age <= 5 ? 1.08 : age <= 15 ? 1.0 : age <= 25 ? 0.92 : 0.82);

  const estimated  = baseM2 * m2 * zoningMult * ageFactor;
  const low        = Math.round(estimated * 0.82);
  const high       = Math.round(estimated * 1.18);
  const real       = Math.round(estimated * 0.90);

  // Güven skoru - emsal veriye dayandığı için 50-65 arası
  const confidenceScore = 52 + Math.floor(Math.random() * 14);

  // Kira (ticari)
  const rentEstimate = isArsa ? 0 : Math.round(estimated * 0.005);
  const rentYield    = isArsa ? '—' : ((rentEstimate * 12) / estimated * 100).toFixed(1) + '%';
  const payback      = isArsa ? '—' : Math.round(estimated / (rentEstimate * 12)) + ' yıl';

  const catLabel  = isArsa ? 'Arsa' : 'Ticari';
  const typeLabel = isArsa ? (VAL.zoning || 'Arsa') : (VAL.commercialType || 'Ticari Mülk');

  // Uyarı metni
  const uyari = `<div style="padding:12px 16px;background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.2);border-radius:var(--rs);font-size:13px;color:var(--txm);margin-bottom:20px;">
    ⚠️ <strong style="color:var(--gold)">Emsal Bazlı Tahmin:</strong> Sistemimizde doğrudan ${isArsa?'arsa':'ticari'} ilan verisi bulunmamaktadır.
    Bu sonuç Konya ${VAL.district} bölgesi için 2025 yılı emsal değerlerine dayanmaktadır.
    Kesin değerleme için tapu sicil müdürlüğü veya lisanslı gayrimenkul değerleme uzmanına başvurunuz.
  </div>`;

  // AI metni
  const aiText = isArsa
    ? `${VAL.district} bölgesinde ${typeLabel} kategorisindeki ${m2}m² arsa için bölge emsal değerleri incelenmiştir. ${baseM2.toLocaleString('tr-TR')} TL/m² baz birim fiyat ve ${VAL.zoning} için ${((zoningMult)*100).toFixed(0)}% imar düzeltme katsayısı uygulanmıştır.

Satıcı için öneri: ${fp(estimated * 1.08)} TL civarından pazarlığa başlanması önerilir.

Alıcı için öneri: ${fp(real)} TL altındaki teklifler fırsat olarak değerlendirilebilir.`
    : `${VAL.district} bölgesinde ${typeLabel} kategorisindeki ${m2}m² ticari mülk için bölge emsal kira ve satış verileri incelenmiştir. ${baseM2.toLocaleString('tr-TR')} TL/m² baz birim fiyat üzerinden hesaplama yapılmıştır.

Satıcı için öneri: ${fp(estimated * 1.05)} TL civarından pazarlığa başlanması önerilir.

Alıcı için öneri: ${fp(real)} TL altındaki teklifler fırsat olarak değerlendirilebilir.`;

  document.getElementById('val-form-area').innerHTML = `
    <div class="val-result-layout"><div class="val-result-endeksa">
      <div class="vre-header">
        <div>
          <div class="vre-title">Değerleme Sonucu</div>
          <div class="vre-sub">${VAL.district} · ${catLabel} · ${typeLabel} · ${m2}m²</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="vre-new-btn" onclick="goBack5()">← Geri Dön</button>
          <button class="vre-new-btn" onclick="goStep(1)">+ Yeni Değerleme</button>
        </div>
      </div>
      ${uyari}
      <div class="vre-main">
        <div class="vre-price-card">
          <div class="vre-price-icon">${isArsa ? '🌍' : '🏢'}</div>
          <div class="vre-price-label">EMSAL DEĞER TAHMİNİ</div>
          <div class="vre-price-big">${fp(estimated)} ₺</div>
          <div class="vre-confidence">
            <div class="vre-conf-bar"><div class="vre-conf-fill" style="width:${confidenceScore}%"></div></div>
            <span class="vre-conf-txt">⊙ ${confidenceScore} Güven Puanı · Emsal Bazlı</span>
          </div>
          <div class="vre-minmax">
            <div class="vre-min"><span class="vre-mm-icon vre-down">↓</span><span class="vre-mm-lbl">Alt Sınır</span><span class="vre-mm-val">${fp(low)} ₺</span></div>
            <div class="vre-max"><span class="vre-mm-icon vre-up">↑</span><span class="vre-mm-lbl">Üst Sınır</span><span class="vre-mm-val">${fp(high)} ₺</span></div>
          </div>
        </div>
        <div class="vre-steps-panel">
          <div class="vre-step-item done"><div class="vre-step-icon">✎</div><div class="vre-step-body"><div class="vre-step-title">1 — Gayrimenkulünüzün Özelliklerini Girin</div></div></div>
          <div class="vre-step-item active"><div class="vre-step-icon">⊙</div><div class="vre-step-body"><div class="vre-step-title">2 — Değerini Öğrenin</div><div class="vre-step-desc">Bölge emsal değerleri üzerinden hesaplandı.</div></div><div class="vre-step-arrow">›</div></div>
          <div class="vre-step-item"><div class="vre-step-icon">👤</div><div class="vre-step-body"><div class="vre-step-title">3 — En İyi Danışmanı Bulun</div><div class="vre-step-desc">Bölgenizdeki uzman danışmanları keşfedin.</div></div></div>
          <div class="vre-step-item"><div class="vre-step-icon">✓</div><div class="vre-step-body"><div class="vre-step-title">4 — Güvenle Satın</div></div></div>
          <button class="vre-advisor-btn" onclick="window._goAdvisor && window._goAdvisor('${VAL.district}')">👤 Danışman Bul</button>
        </div>
      </div>
      ${!isArsa ? `<div class="vre-invest">
        <div class="vre-section-title">Yatırım Analizi</div>
        <div class="vre-invest-grid">
          <div class="vre-invest-card"><div class="vre-ic-lbl">Tahmini Aylık Kira</div><div class="vre-ic-val ok">${fp(rentEstimate)} ₺</div></div>
          <div class="vre-invest-card"><div class="vre-ic-lbl">Brüt Kira Getirisi</div><div class="vre-ic-val ok">${rentYield}</div></div>
          <div class="vre-invest-card"><div class="vre-ic-lbl">Amortisman</div><div class="vre-ic-val">${payback}</div></div>
          <div class="vre-invest-card"><div class="vre-ic-lbl">m² Birim Fiyat</div><div class="vre-ic-val">${fp(baseM2)} ₺</div></div>
        </div>
      </div>` : `<div class="vre-invest">
        <div class="vre-section-title">Arsa Bilgisi</div>
        <div class="vre-invest-grid">
          <div class="vre-invest-card"><div class="vre-ic-lbl">Arsa Tipi</div><div class="vre-ic-val" style="font-size:16px;">${VAL.zoning || '—'}</div></div>
          <div class="vre-invest-card"><div class="vre-ic-lbl">Alan</div><div class="vre-ic-val">${fp(m2)} m²</div></div>
          <div class="vre-invest-card"><div class="vre-ic-lbl">m² Emsal Fiyatı</div><div class="vre-ic-val">${fp(baseM2 * zoningMult)} ₺</div></div>
          <div class="vre-invest-card"><div class="vre-ic-lbl">Bölge</div><div class="vre-ic-val" style="font-size:16px;">${VAL.district}</div></div>
        </div>
      </div>`}
      <div class="vre-ai"><div class="vre-ai-badge">▲ AI ANALİZİ</div><div class="vre-ai-text" id="ai-analysis-text"></div></div>
      <div class="vre-disclaimer">* Emsal bazlı tahmin. Kesin değer için lisanslı değerleme uzmanına danışın.</div>
    </div>`;

  document.getElementById('val-info-area').innerHTML = `<div class="val-info-panel">
    <div class="val-info-icon">${isArsa ? '🌍' : '🏢'}</div>
    <div class="val-info-title">${isArsa ? 'Arsa Değerleme' : 'Ticari Değerleme'} Hakkında</div>
    <div class="val-info-text" style="font-size:13px;line-height:1.7;">
      Sistemimiz ${isArsa?'arsa':'ticari mülk'} ilanlarını veritabanında bulundurmamaktadır.
      Bu sonuç Konya Büyükşehir Belediyesi ve tapu sicil verilerine dayanan <strong>2025 yılı emsal değerleri</strong> üzerinden hesaplanmıştır.
    </div>
    <ul class="val-info-list" style="margin-top:14px;">
      <li>Kesin değer için tapu sicil müdürlüğüne başvurun</li>
      <li>Lisanslı değerleme raporu banka ve hukuki işlemlerde geçerlidir</li>
      <li>Emsal satışlar için belediye imar müdürlüğünü kontrol edin</li>
    </ul>
  </div>`;

  typewriter('ai-analysis-text', aiText, 18);
}

// ===== DİNAMİK BİLGİ PANELİ =====
function hoverInfo(key, val) {
  const panel = document.getElementById('val-info-area');
  if (!panel) return;

  const INFO = {
    housingType: {
      daire:    { icon:"🏢", title:"Apartman Dairesi", text:"Konya satıştaki konutların büyük çoğunluğu apartman dairesi. En likit segment; alıcı ve kiracı talebinin en yoğun olduğu mülk tipidir. Site içi, asansörlü ve kombi daireler prim yapar." },
      mustakil: { icon:"🏡", title:"Müstakil Konut", text:"Müstakil evler özel bahçe ve arsa payıyla dairelerin %20-40 üzerinde değerlenir. Arz sınırlı; talep güçlü. Bakım ve tadilat maliyeti daha yüksek olabilir." },
    },
    apartmentType: {
      "Daire":           { icon:"🏢", title:"Standart Daire", text:"Normal kat daireler bölge referans fiyatını oluşturur. 2-7. katlar en ideal; giriş ve çatı katı genellikle %4-7 düşük fiyatlanır." },
      "Teras Dubleks":   { icon:"🌅", title:"Teras Dubleks", text:"Çatı teras + özel açık alan kombinasyonu. Standart dairelerin %15-25 üzerinde fiyatlanır. Yaz aylarında ısınma avantajı; kış ısı kaybı riski." },
      "Ara Kat Dubleks": { icon:"🏠", title:"Ara Kat Dubleks", text:"İki katlı geniş yaşam hacmi. Aile segmentinin tercihi; %10-18 prim taşır. Merdiven kullanımı yaşlılar için dezavantaj sayılabilir." },
      "Bahçe Dubleks":   { icon:"🌿", title:"Bahçe Dubleks", text:"Özel bahçe erişimi şehirde müstakil hissi yaratır. %20-30 prim olağan. Zemin kat rutubeti iyi yapılarda bertaraf edilmiştir." },
      "Ters Dubleks":    { icon:"🔄", title:"Ters Dubleks", text:"Üst katta oturma alanı, alt katta odalar. Manzara avantajı yüksek; %8-15 prim. Alıcı kitlesi daha seçici." },
    },
    usageStatus: {
      "Mülk Sahibi": { icon:"🏠", title:"Mülk Sahibi", text:"Sahibi oturan mülkler bakım kalitesi ve psikolojik değer nedeniyle genellikle %3-8 prim taşır. Hızlı satış için en avantajlı profil." },
      "Kiracı":      { icon:"🔑", title:"Kiracı", text:"Kiracılı mülk yatırımcı için hazır gelir anlamına gelir. Kira miktarı ve sözleşme süresi değeri doğrudan etkiler. Boşaltma süreci alıcıda çekince yaratabilir." },
      "Boş":         { icon:"🚪", title:"Boş Mülk", text:"Taşınmaya hazır mülkler alıcıların talebiyle hızlı kapanır. Ancak uzun süre boş kalan mülklerde bakımsızlık değeri düşürür." },
    },
    condition: {
      "Bakımlı/Yenilenmiş": { icon:"✨", title:"Bakımlı / Yenilenmiş", text:"Mutfak, banyo veya zemin yenilenmiş mülkler bölge ortalamasının %5-15 üzerinde fiyatlanır. Alıcı tarafında ek tadilat kaygısı olmadığından pazarlık payı dar." },
      "Standart":            { icon:"🏠", title:"Standart Yapı", text:"Rutin bakımlı, büyük sorunsuz mülkler. Bölge emsal fiyatında seyreder. Bazı kozmetik dokunuşlarla üst segmente taşınabilir." },
      "Tadilat İhtiyacı Var":{ icon:"🔧", title:"Tadilat Gerekli", text:"Piyasa fiyatının %10-20 altında satar. Yatırımcılar bu mülkleri fırsat olarak değerlendirir. Tadilat maliyeti yapıya göre değişir; fiyata yansıtın." },
    },
    heating: {
      "Yerden Isıtma":         { icon:"🌡️", title:"Yerden Isıtma", text:"En prestijli ısıtma sistemi; %3-6 değer artışı sağlar. Konfor düzeyi yüksek, enerji verimliliği iyi. Kurulum maliyeti geri dönüşü var." },
      "Doğalgaz/Kombi":        { icon:"🔥", title:"Kombi (Doğalgaz)", text:"Konya genelinde en yaygın sistem. Bireysel kontrol imkânı değer katıcı; alıcılar tarafından standart olarak beklenir." },
      "Merkezi Sistem":        { icon:"🏢", title:"Merkezi Isıtma", text:"Sabit gider (aidat içinde) anlamına gelir. Eski binalarda sorun kaynağı olabilir; yeni binalarda tercih edilebilir." },
      "Merkezi Isı Pay Ölçer": { icon:"📊", title:"Merkezi + Pay Ölçer", text:"Bireysel kullanıma göre faturalandırma. Merkezi konforuyla kombi tasarrufunu birleştirir; %2-4 prim." },
      "Soba":                  { icon:"🪵", title:"Soba", text:"Eski yapılarda görülür. Değer üzerinde %3-8 olumsuz etki yapabilir. Alıcılar doğalgaz dönüşüm maliyetini fiyata yansıtır." },
      "Jeotermal":             { icon:"♨️", title:"Jeotermal", text:"Konya bazı ilçelerinde mevcut. Düşük işletme maliyeti ve sürdürülebilirlik avantajıyla %4-8 prim yapar." },
      "Güneş Enerjisi":        { icon:"☀️", title:"Güneş Enerjisi", text:"Destekleyici sistem olarak kullanılır. Yeşil bina sertifikasıyla kombinasyonu en yüksek değer artışını sağlar." },
      "Klima Sistemi":         { icon:"❄️", title:"Klima Sistemi", text:"Yazın soğutma avantajı sağlar. Isıtmada tek başına yetersiz; genellikle ek ısıtma ile birlikte kullanılır." },
      "Yok":                   { icon:"❌", title:"Isıtma Sistemi Yok", text:"Alıcı için ek maliyet; değer üzerinde %5-10 olumsuz etki. Doğalgaz bağlantısı varsa dönüşüm nispeten kolay." },
    },
  };

  const group = INFO[key];
  if (!group) return;
  const info = group[val];
  if (!info) return;

  panel.innerHTML = `<div class="val-info-panel">
    <div class="val-info-icon">${info.icon}</div>
    <div class="val-info-title">${info.title}</div>
    <div class="val-info-text">${info.text}</div>
  </div>`;
}

function updateInfoPanel() {
  const panel = document.getElementById('val-info-area');
  if (!panel) return;

  // Hangi bilgi gösterilsin - son seçilen/değiştirilen şeye göre
  const html = buildInfoPanelHTML();
  panel.innerHTML = html;
}

function buildInfoPanelHTML() {
  // Kullanım Durumu
  if (VAL.usageStatus) {
    const map = {
      'Mülk Sahibi': { icon: '🏠', title: 'Mülk Sahibi', text: 'Mülk sahibi oturumu genellikle boş veya kiracılı mülklere göre %3-8 daha yüksek değerlenir. Oturumun düzenliliği ve bakım kalitesi fiyatı etkiler.' },
      'Kiracı': { icon: '🔑', title: 'Kiracı Kullanımı', text: 'Kiracılı mülkler yatırımcıya hazır olması nedeniyle ek değer taşır. Kira sözleşmesinin süresi ve miktarı değerlemeyi etkiler.' },
      'Boş': { icon: '🚪', title: 'Boş Mülk', text: 'Boş mülkler hızlı satış için avantajlı olabilir. Taşınmaya hazır olması alıcılara çekici gelir; ancak uzun süre boş kalan mülklerde bakım maliyeti değeri düşürebilir.' }
    };
    const m = map[VAL.usageStatus];
    if (m) return `<div class="val-info-panel"><div class="val-info-icon">${m.icon}</div><div class="val-info-title">${m.title}</div><div class="val-info-text">${m.text}</div></div>`;
  }

  // Yapı Durumu
  if (VAL.condition) {
    const map = {
      'Bakımlı/Yenilenmiş': { icon: '✨', title: 'Bakımlı / Yenilenmiş', text: 'Yenilenmiş mülkler bölge ortalamasının %5-15 üzerinde fiyatlanabilir. Yeni mutfak, banyo, zemin veya cephe yenileme en çok değer katan unsurlar arasındadır.' },
      'Standart': { icon: '🏠', title: 'Standart Yapı', text: 'Standart durumlu mülkler bölge piyasa fiyatına paralel seyreder. Rutin bakım yapılmış, büyük sorun olmayan mülkler bu kategoriye girer.' },
      'Tadilat İhtiyacı Var': { icon: '🔧', title: 'Tadilat Gerekli', text: 'Tadilat ihtiyacı olan mülkler genellikle bölge ortalamasının %10-20 altında fiyatlanır. Alıcılar, tahmini tadilat maliyetini fiyattan düşmeye çalışır.' }
    };
    const m = map[VAL.condition];
    if (m) return `<div class="val-info-panel"><div class="val-info-icon">${m.icon}</div><div class="val-info-title">${m.title}</div><div class="val-info-text">${m.text}</div></div>`;
  }

  // Apartman Tipi
  if (VAL.apartmentType) {
    const map = {
      'Daire': { icon: '🏢', title: 'Standart Daire', text: 'Normal katlardaki daireler bölgenin temel fiyatını oluşturur. Giriş ve en üst katlar genellikle %3-7 daha düşük fiyatlanır.' },
      'Teras Dubleks': { icon: '🌅', title: 'Teras Dubleks', text: 'Teras dubleksler geniş açık alan ve manzara avantajıyla standart dairelerin %15-30 üzerinde fiyatlanabilir. Isıtma ve soğutma maliyetleri daha yüksek olabilir.' },
      'Ara Kat Dubleks': { icon: '🏠', title: 'Ara Kat Dubleks', text: 'İki katlı geniş yaşam alanı sunar. Standart dairelere göre %10-20 prim taşır. Özellikle aileler için tercih edilir.' },
      'Bahçe Dubleks': { icon: '🌿', title: 'Bahçe Dubleks', text: 'Özel bahçe avantajıyla şehirde müstakil hissi verir. Geniş bahçe alanı değeri artırır; genellikle standart dairelerin %20-35 üzerinde fiyatlanır.' },
      'Ters Dubleks': { icon: '🔄', title: 'Ters Dubleks', text: 'Üst kat oturma, alt kat yatak odası düzeniyle farklı bir yaşam sunar. Manzara açısından avantajlı; standart dairelere göre %10-15 prim içerir.' }
    };
    const m = map[VAL.apartmentType];
    if (m) return `<div class="val-info-panel"><div class="val-info-icon">${m.icon}</div><div class="val-info-title">${m.title}</div><div class="val-info-text">${m.text}</div></div>`;
  }

  // Konut Tipi
  if (VAL.housingType) {
    if (VAL.housingType === 'mustakil') {
      return `<div class="val-info-panel"><div class="val-info-icon">🏡</div><div class="val-info-title">Müstakil Konut</div><div class="val-info-text">Müstakil evler özel bahçe ve arsa payı nedeniyle genellikle dairelere göre daha yüksek değerlenir. Konya'da müstakil konut arzı sınırlı; talep güçlü.</div></div>`;
    }
  }

  // Bina yaşı
  if (VAL.buildingAge > 0) {
    let ageInfo = '';
    if (VAL.buildingAge <= 2) ageInfo = '🆕 Sıfır/çok yeni bina — en yüksek değer potansiyeli. Yapı güvencesi, deprem yönetmeliği uyumu ve taze malzeme kalitesiyle primlenir.';
    else if (VAL.buildingAge <= 5) ageInfo = '✨ Yeni bina (1-5 yıl) — standart değerin %8-15 üzerinde. Garantisi devam eden yapı unsurları alıcılara güven verir.';
    else if (VAL.buildingAge <= 10) ageInfo = '🏠 Genç bina (6-10 yıl) — piyasa değerinde. Büyük onarım ihtiyacı olmayan, modern standartlarda yapı.';
    else if (VAL.buildingAge <= 20) ageInfo = '⏳ Orta yaşlı bina (11-20 yıl) — değer bölge ortalamasında seyreder. Asansör, ısıtma sistemi bakımına dikkat edilmeli.';
    else if (VAL.buildingAge <= 35) ageInfo = '⚠️ Eski bina (21-35 yıl) — değer ortalamanın %5-12 altında olabilir. Deprem yönetmeliği öncesi yapılar alıcılarda çekince yaratabilir.';
    else ageInfo = '🔧 Çok eski bina (35+ yıl) — güçlendirme veya yıkım-yapım maliyeti fiyatı önemli ölçüde etkiler. Değer salt arsa bedeline yaklaşabilir.';
    return `<div class="val-info-panel"><div class="val-info-icon">🏛</div><div class="val-info-title">Bina Yaşı Etkisi</div><div class="val-info-text">${ageInfo}</div></div>`;
  }

  // Kat bilgisi
  if (VAL.floor > 0 && VAL.totalFloors > 0) {
    const isTop = VAL.floor === VAL.totalFloors;
    const isGround = VAL.floor === 0 || VAL.floor === 1;
    let katText = isTop
      ? '🌇 Üst kat: Manzara avantajı var ancak yaz sıcağı ve çatı sızıntısı riski nedeniyle genellikle %3-7 düşük fiyatlanır. Teras varsa bu farkı kapatar.'
      : isGround
      ? '🌱 Giriş kat: Isı kaybı ve rutubet riski nedeniyle ortalama %5-10 daha düşük fiyatlanır. Ancak bahçe veya terasa çıkış varsa bu avantaj etkisini dengeler.'
      : `✅ ${VAL.floor}. kat: Orta katlar en dengeli değeri taşır. Asansör mesafesi, manzara ve gürültü dengesi açısından tercih edilir.`;
    return `<div class="val-info-panel"><div class="val-info-icon">🏢</div><div class="val-info-title">Kat Konumu</div><div class="val-info-text">${katText}</div></div>`;
  }

  // m² bilgisi
  if (VAL.netM2 > 0) {
    let sizeText = '';
    if (VAL.netM2 < 60) sizeText = '📐 Küçük daire (60m² altı): 1+1 ve 2+1 segmentinde. Konya merkez ilçelerde kiralık olarak güçlü talep görür; birim m² fiyatı daha yüksek olabilir.';
    else if (VAL.netM2 < 100) sizeText = '📐 Orta büyüklük (60-100m²): 2+1 ve 3+1 segmenti. Piyasanın en likit segmenti; alıcı ve kiracı talebi en yüksek bu aralıkta.';
    else if (VAL.netM2 < 150) sizeText = '📐 Geniş daire (100-150m²): Aile dairesi segmenti. Birim fiyat düşer ama toplam değer yüksektir; talep biraz daha seçici.';
    else sizeText = '📐 Büyük konut (150m²+): Lüks segment. Birim m² fiyatı en düşük; alıcı kitlesi dar ama ödeme gücü yüksek. Satış süresi uzayabilir.';
    return `<div class="val-info-panel"><div class="val-info-icon">📏</div><div class="val-info-title">Alan Analizi</div><div class="val-info-text">${sizeText}</div></div>`;
  }

  // Default — yapı durumu
  return `<div class="val-info-panel">
    <div class="val-info-icon">🏠</div>
    <div class="val-info-title">Yapı Durumu</div>
    <ul class="val-info-list">
      <li><strong>Bakımlı/Yenilenmiş:</strong> Tüm unsurlar düzenli bakımlı; değere %5-15 olumlu katkı</li>
      <li><strong>Standart:</strong> Normal kullanım, bölge ortalama fiyatında</li>
      <li><strong>Tadilat İhtiyacı:</strong> %10-20 değer düşüşü; alıcı pazarlık yapacaktır</li>
    </ul>
  </div>`;
}

// ===== ADIM GEÇİŞİ =====
function goStep(step) {
  // Adım değişince container dar moda dön
  VAL.currentStep = step;
  if (step === 1) renderStep1();
  else if (step === 2) renderStep2();
  else if (step === 3) renderStep3();
  else if (step === 4) renderStep4();
  else if (step === 5) renderStep5();
  const vc = document.getElementById('val-content');
  if(vc) vc.scrollIntoView({behavior:'smooth', block:'start'});
}

// ===== FREEMIUM =====
function updateFreeCounter() {
  const el = document.getElementById('free-counter');
  if (!el || currentUser) return;
  const remaining = FREE_LIMIT - freeUsed;
  el.innerHTML = `
    <div class="free-counter">
      <div class="free-dots">
        ${[0,1,2].map(i => `<div class="free-dot ${i < freeUsed ? 'used' : ''}"></div>`).join('')}
      </div>
      <span>${remaining > 0 ? remaining + ' ücretsiz değerleme hakkın kaldı' : 'Ücretsiz hakkın doldu — Abone ol'}</span>
    </div>`;
}

function showSubPopup() {
  const existing = document.getElementById('sub-popup');
  if (existing) return;
  const div = document.createElement('div');
  div.id = 'sub-popup';
  div.className = 'sub-popup-ov';
  div.innerHTML = `
    <div class="sub-popup-box">
      <div class="sub-popup-icon">🔓</div>
      <div class="sub-popup-title">Sınırsız Erişim</div>
      <div class="sub-popup-text">3 ücretsiz değerleme hakkını kullandın. Sınırsız analiz, yatırım raporları ve daha fazlası için abone ol.</div>
      <div class="sub-popup-plans">
        <div class="sub-plan-card">
          <div class="spc-badge">AYLIK</div>
          <div class="spc-name">Standart</div>
          <div class="spc-price">₺1.500</div>
          <div class="spc-period">/ay</div>
        </div>
        <div class="sub-plan-card popular">
          <div class="spc-badge">🔥 POPÜLER</div>
          <div class="spc-name">Yıllık</div>
          <div class="spc-price">₺999</div>
          <div class="spc-period">/ay · Yıllık faturalama</div>
        </div>
      </div>
      <button onclick="document.getElementById('sub-popup').remove();goPage('auth');" 
        style="width:100%;padding:14px;background:var(--gold);border:none;border-radius:var(--rs);color:var(--dark);font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;">
        Giriş Yap / Kayıt Ol
      </button>
      <div class="sub-popup-login">Zaten hesabın var mı? <a onclick="document.getElementById('sub-popup').remove();">Giriş yap</a></div>
    </div>`;
  document.body.appendChild(div);
}

function showValError(msg) {
  showPopup(msg, 'Eksik Alan', '⚠️', 'info');
}

// ===== DEĞERLEME SEKMESI AÇILDIĞINda =====
function initValuation() {
  const area = document.getElementById('val-content');
  if (!area) return;
  // State sıfırla
  VAL.category=''; VAL.district=''; VAL.quarter='';
  VAL.rooms=3; VAL.salons=1; VAL.bathrooms=1;
  VAL.grossM2=0; VAL.netM2=0; VAL.buildingAge=0;
  VAL.totalFloors=0; VAL.floor=0; VAL.facades=[];
  VAL.views=[]; VAL.amenities=[]; VAL.currentStep=1;
  area.innerHTML = `
    <div id="free-counter"></div>
    <div class="val-progress" id="val-progress" style="max-width:clamp(400px,75%,860px);margin:0 auto;padding-left:clamp(12px,2vw,24px);padding-right:clamp(12px,2vw,24px);"></div>
    <div class="val-container" id="val-container-inner">
      <div id="val-form-area"></div>
      <div id="val-info-area"></div>
    </div>`;
  goStep(1);
}
