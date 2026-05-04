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
        <div class="cat-card ${VAL.category === 'konut' ? 'on' : ''}" onclick="selectCat('konut')">
          <div class="cat-icon">🏠</div>
          <div class="cat-name">Konut</div>
          <div class="cat-desc">Daire, müstakil ev, villa</div>
        </div>
        <div class="cat-card ${VAL.category === 'arsa' ? 'on' : ''}" onclick="selectCat('arsa')">
          <div class="cat-icon">🌍</div>
          <div class="cat-name">Arsa / Arazi</div>
          <div class="cat-desc">İmarlı arsa, tarla, bağ bahçe</div>
        </div>
        <div class="cat-card ${VAL.category === 'ticari' ? 'on' : ''}" onclick="selectCat('ticari')">
          <div class="cat-icon">🏢</div>
          <div class="cat-name">Ticari</div>
          <div class="cat-desc">Dükkan, ofis, depo, fabrika</div>
        </div>
        <div class="cat-card ${VAL.category === 'kiralik' ? 'on' : ''}" onclick="selectCat('kiralik')">
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
        Sahibinden.com'daki <strong>gerçek ilan verileri</strong> kullanılarak yapay zeka destekli piyasa analizi yapılır.
      </div>
      <ul class="val-info-list">
        <li>Bölgenizdeki benzer ilanlar karşılaştırılır</li>
        <li>Bina yaşı, kat, özellikler hesaba katılır</li>
        <li>Yatırım getiri tahmini sunulur</li>
        <li>±%15 sapma bandı ile değer aralığı verilir</li>
      </ul>
    </div>`;
}

function selectCat(cat) {
  VAL.category = cat;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('on'));
  event.currentTarget.classList.add('on');
  document.querySelector('.val-next').removeAttribute('disabled');
}

// ===== ADIM 2: KONUM =====
function renderStep2() {
  renderProgress();
  const districts = [...new Set(allListings.map(l => l.district).filter(Boolean))].sort();
  const extraDistricts = ['Akşehir','Beyşehir','Cihanbeyli','Çumra','Ereğli','Ilgın','Kadınhanı','Kulu','Sarayönü','Seydişehir','Yunak'];
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
            <button class="vchip ${VAL.housingType === 'daire' ? 'on' : ''}" onclick="setChip('housingType','daire',this)">Apartman</button>
            <button class="vchip ${VAL.housingType === 'mustakil' ? 'on' : ''}" onclick="setChip('housingType','mustakil',this)">Müstakil</button>
          </div>
        </div>

        <div class="vfg" id="apt-type-group" ${VAL.housingType !== 'daire' ? 'style="display:none"' : ''}>
          <label class="vfl">Apartman Tipi</label>
          <div class="chip-group">
            ${['Daire','Teras Dubleks','Ara Kat Dubleks','Bahçe Dubleks','Ters Dubleks'].map(t =>
              `<button class="vchip ${VAL.apartmentType === t ? 'on' : ''}" onclick="setChip('apartmentType','${t}',this)">${t}</button>`
            ).join('')}
          </div>
        </div>

        <div class="vfg">
          <label class="vfl">Kullanım Durumu</label>
          <div class="chip-group">
            ${['Mülk Sahibi','Kiracı','Boş'].map(t =>
              `<button class="vchip ${VAL.usageStatus === t ? 'on' : ''}" onclick="setChip('usageStatus','${t}',this)">${t}</button>`
            ).join('')}
          </div>
        </div>

        <div class="vfg">
          <label class="vfl">Yapı Durumu <span class="req">*</span></label>
          <div class="chip-group">
            ${['Bakımlı/Yenilenmiş','Standart','Tadilat İhtiyacı Var'].map(t =>
              `<button class="vchip ${VAL.condition === t ? 'on' : ''}" onclick="setChip('condition','${t}',this)">${t}</button>`
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
    <button class="num-btn" onclick="changeNum('${key}',-1,${min})">−</button>
    <input class="num-val" id="v-${key}" type="number" value="${val}" min="${min}" max="${max}" onchange="VAL['${key}']=parseInt(this.value)||${min}">
    <button class="num-btn" onclick="changeNum('${key}',1,${max})">+</button>
  </div>`;
}

function changeNum(key, delta, min) {
  const el = document.getElementById('v-' + key);
  const newVal = Math.max(min, (parseInt(el.value) || 0) + delta);
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
            `<button class="vchip ${VAL.heating === h ? 'on' : ''}" onclick="setChip('heating','${h}',this)">${h}</button>`
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

  const estimated = Math.round(avgM2 * m2 * ageFactor * floorFactor * condFactor * amenBonus * heatFactor);
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

  document.getElementById('val-form-area').innerHTML = `
    <div class="val-form-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div>
          <div class="val-form-title" style="margin-bottom:4px;">Değerleme Sonucu</div>
          <div style="font-size:12px;color:var(--txm);">${scopeLabel} · ${roomsStr} · ${m2}m² · ${age} yaş</div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--gold);">${fp(estimated)} ₺</div>
          <div style="font-size:11px;color:var(--txm);">Tahmini Piyasa Değeri</div>
        </div>
      </div>

      ${hasStaleData ? `<div style="padding:10px 14px;background:rgba(201,168,76,.06);border:1px solid var(--bd);border-radius:var(--rs);font-size:12px;color:var(--txm);margin-bottom:16px;">
        ⚠️ Bazı eski ilanlar (90+ gün) analizden çıkarıldı, güncel fiyatlar esas alındı.
      </div>` : ''}

      <div class="val-result-grid">
        <div class="val-result-card">
          <div class="vrc-label">Fiyat Aralığı</div>
          <div class="vrc-val" style="font-size:14px;">${fp(low)} — ${fp(high)}</div>
          <div class="vrc-sub">±%12 sapma bandı</div>
        </div>
        <div class="val-result-card">
          <div class="vrc-label">Gerçek Satış</div>
          <div class="vrc-val">${fp(real)} ₺</div>
          <div class="vrc-sub">Pazarlık sonrası tahmini</div>
        </div>
        <div class="val-result-card">
          <div class="vrc-label">Ort. m² Fiyatı</div>
          <div class="vrc-val">${fp(Math.round(avgM2))} ₺</div>
          <div class="vrc-sub">${calcPool.length} ilan analiz edildi</div>
        </div>
      </div>

      <div style="font-size:12px;font-weight:600;color:var(--txm);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Yatırım Analizi</div>
      <div class="invest-grid">
        <div class="invest-card">
          <div class="ic-label">Tahmini Aylık Kira</div>
          <div class="ic-val pos">${fp(rentEstimate)} ₺</div>
          <div class="ic-sub">Bölge ortalamasına göre</div>
        </div>
        <div class="invest-card">
          <div class="ic-label">Brüt Kira Getirisi</div>
          <div class="ic-val pos">%${rentYield}</div>
          <div class="ic-sub">Yıllık brüt getiri</div>
        </div>
        <div class="invest-card">
          <div class="ic-label">Amortisman Süresi</div>
          <div class="ic-val">${paybackYears} yıl</div>
          <div class="ic-sub">Kira ile geri dönüş</div>
        </div>
        <div class="invest-card">
          <div class="ic-label">Fırsat Skoru</div>
          <div class="ic-val ${priceScore >= 60 ? 'pos' : priceScore >= 40 ? '' : 'neg'}">${priceScore}/100</div>
          <div class="ic-sub">${priceScore >= 70 ? 'Uygun fiyat' : priceScore >= 40 ? 'Piyasa değeri' : 'Piyasa üstü'}</div>
        </div>
      </div>

      <div style="font-size:12px;font-weight:600;color:var(--txm);letter-spacing:1.5px;text-transform:uppercase;margin:20px 0 12px;">Değerleme Skoru</div>
      ${[
        { label: 'Konum Puanı', val: Math.min(95, 50 + calcPool.length * 3), max: 100 },
        { label: 'Veri Güvenilirliği', val: Math.min(95, Math.round(60 + calcPool.length * 2.5)), max: 100 },
        { label: 'Piyasa Uyumu', val: priceScore, max: 100 },
      ].map(s => `
        <div class="score-bar-wrap">
          <div class="score-label-row">
            <span class="score-label">${s.label}</span>
            <span class="score-val">${s.val}%</span>
          </div>
          <div class="score-bar">
            <div class="score-fill ${s.val >= 70 ? 'green' : s.val >= 40 ? '' : 'red'}" style="width:${s.val}%"></div>
          </div>
        </div>`).join('')}

      <div style="margin-top:20px;padding:16px;background:rgba(201,168,76,.05);border:1px solid var(--bd);border-radius:var(--rs);">
        <div style="font-size:10px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">▲ AI ANALİZİ</div>
        <div style="font-size:13px;color:var(--tx);line-height:1.8;white-space:pre-wrap;" id="ai-analysis-text"></div>
      </div>

      <div style="font-size:11px;color:var(--txd);text-align:center;margin-top:16px;font-style:italic;">
        * ${calcPool.length} benzer ilan analiz edilmiştir. Tahmin ±%12 sapma gösterebilir. Konya ${new Date().getFullYear()} piyasa verilerine dayanmaktadır.
      </div>

      <div class="val-nav">
        <button class="val-back" onclick="goStep(1)">Yeni Değerleme</button>
        ${!currentUser ? `<div style="font-size:12px;color:var(--txm);display:flex;align-items:center;gap:6px;">
          <span>${FREE_LIMIT - freeUsed} ücretsiz hakkın kaldı</span>
        </div>` : ''}
      </div>
    </div>`;

  // AI metni typewriter efekti
  typewriter('ai-analysis-text', aiAnalysis, 15);

  // Sağ panel - benzer ilanlar
  const similar = calcPool.slice(0, 5);
  document.getElementById('val-info-area').innerHTML = `
    <div class="val-info-panel">
      <div class="val-info-icon">🏠</div>
      <div class="val-info-title">Benzer İlanlar</div>
      ${similar.map(l => {
        const days = l.created_at ? Math.floor((now - new Date(l.created_at)) / 86400000) : null;
        const ageBadge = days === null ? '' : days <= 7 ? '<span class="age-badge age-new">Yeni</span>' : days <= 30 ? '<span class="age-badge age-normal">' + days + ' gün</span>' : days <= 90 ? '<span class="age-badge age-old">' + days + ' gün</span>' : '<span class="age-badge age-very-old">Eski İlan</span>';
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
}

function generateAIText(v, estimated, real, avgM2, count, scope, stale) {
  const age = v.buildingAge;
  let ageText = age <= 2 ? 'Sıfır veya çok yeni yapı olması' : age <= 5 ? 'Yeni yapı olması' : age <= 10 ? 'Makul yaşta olması' : age <= 20 ? 'Orta yaşlı bina' : 'Eski yapı olması';
  let ageEffect = age <= 5 ? 'değere olumlu katkı sağlamaktadır' : age <= 15 ? 'standart piyasa değeriyle uyumludur' : 'fiyatı bölge ortalamasının altında tutmaktadır';

  return `${scope} bölgesindeki güncel piyasa verileri incelendiğinde, ${v.netM2 || v.grossM2}m² büyüklüğündeki konut için belirlenen ${fp(Math.round(avgM2))} TL/m² ortalama birim fiyat bölge rayiçleriyle örtüşmektedir. ${ageText} ${ageEffect}.

Satıcı için öneri: ${fp(Math.round(estimated * 1.05))} TL civarından pazarlığa başlanması, alıcıya makul bir indirim payı bırakırken hedef satış fiyatına ulaşmayı kolaylaştıracaktır.

Alıcı için öneri: ${fp(real)} TL altındaki teklifler fırsat olarak değerlendirilebilir.${stale ? '\n\nNot: Bazı eski ilanlar analizden çıkarıldı, güncel piyasa fiyatları esas alındı.' : ''}`;
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

// ===== ADIM GEÇİŞİ =====
function goStep(step) {
  VAL.currentStep = step;
  if (step === 1) renderStep1();
  else if (step === 2) renderStep2();
  else if (step === 3) renderStep3();
  else if (step === 4) renderStep4();
  else if (step === 5) renderStep5();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  area.innerHTML = `
    <div id="free-counter"></div>
    <div class="val-progress" id="val-progress"></div>
    <div class="val-container">
      <div id="val-form-area"></div>
      <div id="val-info-area"></div>
    </div>`;
  goStep(1);
}
