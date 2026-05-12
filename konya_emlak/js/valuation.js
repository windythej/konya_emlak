// ===== DEĞERLEME SİSTEMİ — TAM SÜRÜM =====
// Bağımlılık: main.js (all, fp, SU, SK, populateValDistricts, populateValQuarters)

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
let smsCode = null;
let _aiTypewriterInterval = null;

function initValuation() {
  const container = document.getElementById('val-content');
  if (!container) return;
  container.innerHTML = '';
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

  const isResult = step === 6;
  container.innerHTML = `
    <div class="val-container${isResult ? ' val-result-wide' : ' val-form-wide'}" id="val-container-inner">
      <div id="val-form-area">
        ${step < 6 ? renderProgress(step) : ''}
        <div class="${step < 6 ? 'val-form-card' : ''}" id="val-form-card">
          ${step === 1 ? renderStep1() : ''}
          ${step === 2 ? renderStep2() : ''}
          ${step === 3 ? renderStep3() : ''}
          ${step === 4 ? renderStep4() : ''}
          ${step === 5 ? renderStep5() : ''}
          ${step === 6 ? renderStep6() : ''}
        </div>
      </div>
      <div id="val-info-area"></div>
    </div>`;

  bindStepEvents(step);
  if (step === 6) {
    calcAndRender(); // içinde val-info-area'yı benzer ilanlarla doldurur
    freeUsed = Math.min(freeUsed + 1, FREE_LIMIT);
    localStorage.setItem('freeUsed', freeUsed);
  } else {
    const infoArea = document.getElementById('val-info-area');
    if (infoArea) infoArea.innerHTML = renderInfoPanel(step);
    initInfoPanelListeners(step);
    const defaultCard = VAL_INFO_CARDS[step] && VAL_INFO_CARDS[step][0];
    if (defaultCard) showInfoCard(defaultCard);
  }
}

/* ─── SAĞ INFO PANEL SİSTEMİ ─── */

// Her adım için hover kartları
const VAL_INFO_CARDS = {
  1: [
    { id:'konut',   icon:'🏠', title:'Konut',       badge:'En Popüler',  badgeColor:'var(--gold)',
      body:'Daire, müstakil ev ve villa gibi konutlar için piyasa değeri analizi yapılır. Oda sayısı, metrekare ve bina yaşı gibi kriterler hesaba katılır.',
      bullets:['Konya piyasası verileri baz alınır','Benzer ilanlarla karşılaştırılır','±%12 sapma bandı ile değer aralığı verilir'] },
    { id:'arsa',    icon:'🌿', title:'Arsa / Arazi', badge:'İmar Bazlı',   badgeColor:'var(--ok)',
      body:'İmarlı arsa, tarla, bağ ve bahçe gibi taşınmazlar için konum ve imar durumuna göre değerleme yapılır.',
      bullets:['İmar durumu fiyatı doğrudan etkiler','Bölge emsal satışları incelenir','Yatırım getiri tahmini sunulur'] },
    { id:'ticari',  icon:'🏢', title:'Ticari',       badge:'Yatırım',      badgeColor:'#7C9EFF',
      body:'Dükkan, ofis, depo ve fabrika gibi ticari taşınmazlar için kira getirisi ve satış değeri analizi yapılır.',
      bullets:['Kira çarpanı ile değerleme','Bölge ticari emsal fiyatları','Amortisman süresi hesaplanır'] },
    { id:'kiralik', icon:'🔑', title:'Kiralık',      badge:'Kira Analizi', badgeColor:'#E07B4B',
      body:'Konutunuzun aylık kira değerini öğrenin. Bölgedeki güncel kira ilanları ile karşılaştırmalı analiz yapılır.',
      bullets:['Aylık kira tahmin aralığı','Brüt kira getiri oranı','Amortisman süresi tahmini'] },
  ],
  2: [
    { id:'default', icon:'📍', title:'Konum Seçimi',  badge:'Kritik Faktör', badgeColor:'var(--gold)',
      body:'Konum, bir mülkün değerini belirleyen en önemli faktördür. İlçe ve mahalle seçimi, değerlemenin doğruluğunu doğrudan etkiler.',
      bullets:['Mahalle bazlı fiyat farklılıkları %30\'a ulaşabilir','Merkezi konumlar prim yapar','Okul ve ulaşım yakınlığı değeri artırır'] },
    { id:'district', icon:'🗺️', title:'İlçe Seçimi',  badge:'Zorunlu Alan', badgeColor:'var(--err)',
      body:'Konya\'nın her ilçesinde m² birim fiyatları farklıdır. Selçuklu ve Meram en yüksek fiyatlı ilçeler arasında yer alır.',
      bullets:['Selçuklu: En yüksek m² fiyatı','Meram: Konut yoğunluğu yüksek','Karatay: Yatırım fırsatları mevcut'] },
    { id:'quarter', icon:'🏘️', title:'Mahalle Seçimi', badge:'İsteğe Bağlı', badgeColor:'var(--txm)',
      body:'Mahalle seçimi değerlemenin doğruluğunu artırır. En az 3 benzer ilan olan mahallelerde analiz daha güvenilirdir.',
      bullets:['Mahalle bazlı analiz daha isabetli','Güven puanı yükselir','Benzer ilanlar daha doğru eşleşir'] },
  ],
  3: [
    { id:'apt-type', icon:'🏗️', title:'Konut Tipi',    badge:'Fiyatı Etkiler', badgeColor:'var(--gold)',
      body:'Dubleks ve teras daireler, standart dairelere göre %10-25 daha yüksek fiyatlanır. Bahçe dubleksler geniş aileler için tercih edilir.',
      bullets:['Teras Dubleks: +%15-20 prim','Bahçe Dubleks: Özel yaşam alanı','Ara Kat Dubleks: Konforlu ve değerli'] },
    { id:'rooms',    icon:'🛏️', title:'Oda Sayısı',    badge:'Zorunlu Alan',   badgeColor:'var(--err)',
      body:'Oda sayısı, değerleme havuzunu oluşturmak için kullanılır. Benzer oda sayısındaki ilanlar karşılaştırılır. Konya\'da 3+1 daireler en fazla işlem gören segment.',
      bullets:['3+1 daireler en likit segment','2+1 fiyat/m² oranı en yüksek','4+1 ve üzeri daha az işlem hacmi'] },
    { id:'living',   icon:'🛋️', title:'Salon',         badge:'Opsiyonel',      badgeColor:'var(--txm)',
      body:'Salon sayısı konutun kullanım alanını ve konforunu gösterir. Çift salonlu evler genellikle geniş aileler tarafından tercih edilir.',
      bullets:['Çift salon konfor artırır','Değerlemeyi dolaylı etkiler','Kiracı profili değişir'] },
    { id:'bath',     icon:'🚿', title:'Banyo',          badge:'Değere Etkisi',  badgeColor:'var(--ok)',
      body:'Birden fazla banyo özellikle büyük dairelerde değeri artırır. Ebeveyn banyosu olan daireler %5-8 prim yapabilir.',
      bullets:['2+ banyo değere +%5 katkı','Ebeveyn banyosu prim yapar','Duşakabin kalitesi önemli'] },
    { id:'gross-m2', icon:'📐', title:'Brüt Metrekare', badge:'Zorunlu Alan',   badgeColor:'var(--err)',
      body:'Brüt m², ortak alanlar dahil toplam yapı alanıdır. Değerleme birim fiyatı (₺/m²) brüt m² ile hesaplanır.',
      bullets:['Hesaplamanın temel girdisi','Piyasa m² fiyatı ile çarpılır','Tapu senedindeki değeri girin'] },
    { id:'net-m2',   icon:'📏', title:'Net Metrekare',  badge:'Tavsiye Edilir', badgeColor:'var(--gold)',
      body:'Net m², koridorlar ve duvarlar hariç kullanılabilir yaşam alanıdır. Brüt/net oranı genellikle %75-85 arasındadır.',
      bullets:['Kullanılabilir yaşam alanı','Net/Brüt oranı %75-85 beklenir','Alıcılar net m²ye önem verir'] },
    { id:'age',      icon:'📅', title:'Bina Yaşı',      badge:'Çarpan Etkisi',  badgeColor:'var(--gold)',
      body:'Bina yaşı fiyatı doğrudan etkiler. 0-2 yaş binalarda +%10, 20+ yaş binalarda -%14 değerleme çarpanı uygulanır.',
      bullets:['0-2 yaş: +%10 prim','3-10 yaş: +%0 ile +%5','20+ yaş: -%6 ile -%22 iskonto'] },
    { id:'total-floors', icon:'🏢', title:'Toplam Kat', badge:'Konum Hesabı', badgeColor:'var(--txm)',
      body:'Toplam kat sayısı, mülkün hangi konumda olduğunu belirlemek için kullanılır. Çatı ve zemin kat pozisyonları fiyatı etkiler.',
      bullets:['Zemin kat: -%4 çarpan','Çatı kat: +%4 çarpan','Orta katlar standart değer'] },
    { id:'floor',    icon:'🪜', title:'Bulunduğu Kat',  badge:'Değer Etkisi',   badgeColor:'var(--gold)',
      body:'Kat pozisyonu değeri etkiler. Çatı katlar manzara avantajıyla prim yaparken, zemin katlar güvenlik endişesiyle iskontolu işlem görür.',
      bullets:['Yüksek kat = manzara = prim','Zemin kat -%4 iskonto','Çatı kat +%4 prim'] },
    { id:'usage',    icon:'👤', title:'Kullanım Durumu', badge:'Piyasa Etkisi', badgeColor:'var(--ok)',
      body:'Mülk sahibi oturumu genellikle boş veya kiracılı mülklere göre %3-8 daha yüksek değerlenir. Oturumun düzenliği ve bakım kalitesi fiyatı etkiler.',
      bullets:['Mülk sahibi: en yüksek değer','Boş mülk: hızlı satış avantajı','Kiracılı: %3-5 iskonto olağan'] },
    { id:'condition', icon:'🔨', title:'Yapı Durumu',   badge:'Çarpan Etkisi',  badgeColor:'var(--gold)',
      body:'Yapı durumu değerleme çarpanını doğrudan değiştirir. Bakımlı mülkler +%6, tadilat ihtiyacı olan mülkler -%12 çarpanı alır.',
      bullets:['Bakımlı/Yenilenmiş: +%6','Standart: ±0 çarpan','Tadilat İhtiyacı: -%12'] },
  ],
  4: [
    { id:'facade',   icon:'🧭', title:'Cephe Durumu',   badge:'Manzara Etkisi', badgeColor:'var(--gold)',
      body:'Her ek cephe seçimi değerlemeye +%0.8 katkı sağlar. Güney cephe ışık avantajıyla en çok tercih edilen yöndür.',
      bullets:['Güney cephe en çok tercih edilen','Her cephe +%0.8 katkı','Çift cephe konfor artırır'] },
    { id:'view',     icon:'🌅', title:'Manzara',         badge:'+%0.8 / Seçim',  badgeColor:'var(--ok)',
      body:'Her manzara seçimi değerlemeye +%0.8 ek katkı sağlar. Şehir ve doğa manzaraları alıcılar için önemli artı değer taşır.',
      bullets:['Her seçim +%0.8 değer katkısı','Şehir manzarası en değerli','Doğal manzaralar giderek önem kazanıyor'] },
    { id:'heating',  icon:'🔥', title:'Isıtma Sistemi',  badge:'+%1.5 Prim',     badgeColor:'var(--gold)',
      body:'Kombi ve yerden ısıtma sistemleri değerlemeye +%1.5 katkı sağlar. Enerji verimliliği alıcılar için kritik kriter haline geldi.',
      bullets:['Kombi/Yerden: +%1.5 katkı','Merkezi ısıtma orta değer','Soba/Klima değeri düşürür'] },
    { id:'amenities',icon:'✨', title:'Olanaklar',       badge:'+%0.7 / Olanak', badgeColor:'var(--ok)',
      body:'Her seçilen olanak değerlemeye +%0.7 katkı sağlar. Asansör, otopark ve site güvenliği en çok değer katan olanaklar arasındadır.',
      bullets:['Her olanak +%0.7 katkı','Asansör + Otopark en değerli ikili','24 saat güvenlik prim yapar'] },
  ],
  5: [
    { id:'default',  icon:'🔐', title:'Güvenli Doğrulama', badge:'Ücretsiz', badgeColor:'var(--ok)',
      body:'Telefon doğrulaması, değerleme sonuçlarının kötüye kullanımını önlemek için uygulanmaktadır. Numaran kimseyle paylaşılmaz.',
      bullets:['Kişisel veriler saklanmaz','Sonuçlar anında görüntülenir','Ayda 3 ücretsiz değerleme hakkı'] },
  ],
};

function renderInfoPanel(step) {
  return `<div class="val-info-sticky" id="val-info-sticky">
    <div class="vis-inner" id="vis-inner">
      <div class="vis-icon" id="vis-icon">🏠</div>
      <div class="vis-badge" id="vis-badge"></div>
      <div class="vis-title" id="vis-title">Nasıl Çalışır?</div>
      <div class="vis-body" id="vis-body">
        Değerleme aracımız, Sahibinden.com\'daki gerçek ilan verileri kullanılarak yapay zeka destekli piyasa analizi yapar.
      </div>
      <ul class="vis-bullets" id="vis-bullets">
        <li>Bölgenizdeki benzer ilanlar karşılaştırılır</li>
        <li>Bina yaşı, kat, özellikler hesaba katılır</li>
        <li>Yatırım getiri tahmini sunulur</li>
        <li>±%15 sapma bandı ile değer aralığı verilir</li>
      </ul>
    </div>
  </div>`;
}

function showInfoCard(card) {
  const icon  = document.getElementById('vis-icon');
  const badge = document.getElementById('vis-badge');
  const title = document.getElementById('vis-title');
  const body  = document.getElementById('vis-body');
  const bullets = document.getElementById('vis-bullets');
  const inner = document.getElementById('vis-inner');
  if (!icon) return;

  // Anında güncelle (delay yok)
  icon.textContent  = card.icon;
  if (badge) {
    badge.textContent = card.badge || '';
    badge.style.background  = card.badgeColor ? card.badgeColor + '22' : 'rgba(201,168,76,.12)';
    badge.style.color       = card.badgeColor || 'var(--gold)';
    badge.style.borderColor = card.badgeColor ? card.badgeColor + '44' : 'rgba(201,168,76,.25)';
  }
  title.textContent = card.title;
  body.textContent  = card.body;
  if (bullets) bullets.innerHTML = (card.bullets||[]).map(b => `<li>${b}</li>`).join('');
  // Kısa flash animasyonu
  if (inner) {
    inner.style.transition = 'opacity 0.1s';
    inner.style.opacity = '0.7';
    requestAnimationFrame(() => { inner.style.opacity = '1'; });
  }
}

function initInfoPanelListeners(step) {
  const cards = VAL_INFO_CARDS[step] || [];
  if (!cards.length) return;

  // Varsayılan kart zaten renderStep'te gösteriliyor
  // Cat-card hover (adım 1)
  if (step === 1) {
    document.querySelectorAll('.cat-card').forEach(card => {
      const key = card.dataset.cat;
      const info = cards.find(c => c.id === key);
      if (info) {
        card.addEventListener('mouseenter', () => showInfoCard(info));
        card.addEventListener('mouseleave', () => {
          const selected = cards.find(c => c.id === VAL.category) || cards[0];
          showInfoCard(selected);
        });
      }
    });
  }

  // Adım 2: select hover/focus
  if (step === 2) {
    const distEl = document.getElementById('v-district');
    const qEl    = document.getElementById('v-quarter');
    const defCard = cards.find(c => c.id === 'default') || cards[0];
    const dCard   = cards.find(c => c.id === 'district') || defCard;
    const qCard   = cards.find(c => c.id === 'quarter')  || defCard;
    if (distEl) { distEl.addEventListener('focus', () => showInfoCard(dCard)); distEl.addEventListener('blur', () => showInfoCard(defCard)); }
    if (qEl)    { qEl.addEventListener('focus', () => showInfoCard(qCard)); qEl.addEventListener('blur', () => showInfoCard(defCard)); }
  }

  // Adım 3 & 4: data-info attribute ile genel listener
  if (step === 3 || step === 4) {
    const handleEnter = (el) => {
      const infoId = el.dataset.info;
      if (!infoId) return;
      const card = cards.find(c => c.id === infoId);
      if (card) showInfoCard(card);
    };
    const handleLeave = () => {
      const defCard = cards[0];
      if (defCard) showInfoCard(defCard);
    };

    document.querySelectorAll('[data-info]').forEach(el => {
      el.addEventListener('mouseenter', () => handleEnter(el));
      el.addEventListener('focusin',    () => handleEnter(el));
      el.addEventListener('mouseleave', handleLeave);
      el.addEventListener('focusout',   handleLeave);
    });
  }

  // Adım 5
  if (step === 5) {
    const defCard = cards.find(c => c.id === 'default') || cards[0];
    if (defCard) showInfoCard(defCard);
  }
}

function goStep(step) {
  // Adım 5 = SMS doğrulama: giriş yapılmışsa direkt adım 6'ya geç
  if (step === 5) {
    const tok = localStorage.getItem('emlak_token');
    let loggedIn = false;
    if (tok) {
      try {
        const p = JSON.parse(atob(tok));
        if (p.exp > Date.now()) loggedIn = true;
      } catch(e) {}
    }
    if (loggedIn) { step = 6; } // SMS'i atla
  }
  VAL.currentStep = step;
  if (_aiTypewriterInterval) { clearInterval(_aiTypewriterInterval); _aiTypewriterInterval = null; }
  renderStep(step);
  const vc = document.getElementById('val-content');
  if (vc) vc.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProgress(step) {
  const steps = ['Kategori', 'Konum', 'Özellikler', 'Detaylar', 'Doğrula'];
  return `<div class="val-progress">
    ${steps.map((s,i) => `
      <div class="vp-step ${i+1 < step ? 'done' : i+1 === step ? 'active' : ''}">
        <div class="vp-num">${i+1 < step ? '✓' : i+1}</div>
        <div class="vp-lbl">${s}</div>
        ${i < steps.length-1 ? '<div class="vp-line"></div>' : ''}
      </div>`).join('')}
  </div>`;
}

/* ─── ADIM 1: KATEGORİ ─── */
function renderStep1() {
  const cats = [
    { key:'konut',  icon:'🏠', label:'Konut',       sub:'Daire, müstakil ev, villa' },
    { key:'arsa',   icon:'🌿', label:'Arsa / Arazi', sub:'İmarlı arsa, tarla, bağ bahçe' },
    { key:'ticari', icon:'🏢', label:'Ticari',       sub:'Dükkan, ofis, depo, fabrika' },
    { key:'kiralik',icon:'🔑', label:'Kiralık',      sub:'Aylık kira değeri analizi' },
  ];
  return `
    <div class="val-form-title">Ne değerlendirmek istiyorsunuz?</div>
    <p class="val-form-sub">Mülk tipini seçerek başlayın. Her kategori için farklı analiz kriterleri kullanılmaktadır.</p>
    <div class="cat-grid">
      ${cats.map(c => `
        <div class="cat-card ${VAL.category === c.key ? 'on' : ''}" data-cat="${c.key}">
          <div class="cat-card-icon">${c.icon}</div>
          <div class="cat-card-title">${c.label}</div>
          <div class="cat-card-sub">${c.sub}</div>
        </div>`).join('')}
    </div>
    <div class="val-actions" style="margin-top:28px;">
      <button class="val-next" id="val-next-1" onclick="if(VAL.category){goStep(2);}else{if(typeof showError==='function')showError('Lütfen bir kategori seçin.','Eksik Alan');}" ${!VAL.category ? 'disabled' : ''}>Devam Et →</button>
    </div>`;
}

/* ─── ADIM 2: KONUM ─── */
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
      <button class="val-next" onclick="if(VAL.district){goStep(3);}else{if(typeof showError==='function')showError('Lütfen ilçe seçin.','Eksik Alan');}">Devam Et →</button>
    </div>`;
}

/* ─── ADIM 3: ÖZELLİKLER ─── */
function renderStep3() {
  const rooms = ['Stüdyo','1+0','1+1','2+1','3+1','3+2','4+1','4+2','5+1','5+2'];
  const aptTypes = ['Daire','Teras Dubleks','Ara Kat Dubleks','Bahçe Dubleks','Ters Dubleks'];
  const usages = ['Mülk Sahibi','Kiracı','Boş'];
  const conditions = ['Bakımlı/Yenilenmiş','Standart','Tadilat İhtiyacı Var'];

  return `
    <div class="val-form-title">Konut özelliklerini girin</div>
    <p class="val-form-sub">* ile işaretli alanlar değerleme için zorunludur.</p>
    <p style="font-size:12px;color:var(--txm);margin-bottom:20px;padding:8px 12px;background:rgba(201,168,76,.05);border-left:2px solid var(--gold);border-radius:0 var(--rs) var(--rs) 0;">💡 Alanlara tıklayarak sağ panelde detaylı bilgi alabilirsiniz.</p>

    <div class="vfield" data-info="apt-type">
      <label class="vlbl">KONUT TİPİ</label>
      <div class="vchips" id="v-apt-chips">
        ${aptTypes.map(t => `<button class="vchip ${VAL.aptType===t?'on':''}" data-val="${t}" onclick="VAL.aptType='${t}';document.querySelectorAll('#v-apt-chips .vchip').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${t}</button>`).join('')}
      </div>
    </div>

    <div class="vfield" data-info="rooms">
      <label class="vlbl">ODA SAYISI *</label>
      <div class="vchips" id="v-rooms-chips">
        ${rooms.map(r => `<button class="vchip ${VAL.rooms===r?'on':''}" data-val="${r}" onclick="VAL.rooms='${r}';document.querySelectorAll('#v-rooms-chips .vchip').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${r}</button>`).join('')}
      </div>
    </div>

    <div class="vrow3">
      <div class="vfield" data-info="living">
        <label class="vlbl">SALON</label>
        <div class="vstep-wrap">
          <button class="vstep-btn" onclick="VAL.livingRooms=Math.max(0,VAL.livingRooms-1);document.getElementById('v-living').value=VAL.livingRooms;">−</button>
          <input type="number" class="vinput vstep-input" id="v-living" value="${VAL.livingRooms}" min="0" max="5" placeholder="1" oninput="VAL.livingRooms=parseInt(this.value)||1;">
          <button class="vstep-btn" onclick="VAL.livingRooms=Math.min(5,VAL.livingRooms+1);document.getElementById('v-living').value=VAL.livingRooms;">+</button>
        </div>
      </div>
      <div class="vfield" data-info="bath">
        <label class="vlbl">BANYO *</label>
        <div class="vstep-wrap">
          <button class="vstep-btn" onclick="VAL.bathrooms=Math.max(1,VAL.bathrooms-1);document.getElementById('v-bath').value=VAL.bathrooms;">−</button>
          <input type="number" class="vinput vstep-input" id="v-bath" value="${VAL.bathrooms}" min="1" max="10" placeholder="1" oninput="VAL.bathrooms=parseInt(this.value)||1;">
          <button class="vstep-btn" onclick="VAL.bathrooms=Math.min(10,VAL.bathrooms+1);document.getElementById('v-bath').value=VAL.bathrooms;">+</button>
        </div>
      </div>
    </div>

    <div class="vrow2">
      <div class="vfield" data-info="gross-m2">
        <label class="vlbl">BRÜT M² *</label>
        <input type="number" class="vinput num-input" id="v-gross-m2" value="${VAL.grossM2}" min="20" max="2000" placeholder="örn. 140" oninput="VAL.grossM2=this.value;">
      </div>
      <div class="vfield" data-info="net-m2">
        <label class="vlbl">NET M² *</label>
        <input type="number" class="vinput num-input" id="v-net-m2" value="${VAL.netM2}" min="15" max="1800" placeholder="örn. 120" oninput="VAL.netM2=this.value;">
      </div>
    </div>

    <div class="vrow2">
      <div class="vfield" data-info="age">
        <label class="vlbl">BİNA YAŞI *</label>
        <div class="vstep-wrap">
          <button class="vstep-btn" onclick="VAL.age=Math.max(0,(parseInt(VAL.age)||0)-1);document.getElementById('v-age').value=VAL.age;">−</button>
          <input type="number" class="vinput vstep-input" id="v-age" value="${VAL.age}" min="0" max="80" placeholder="0" oninput="VAL.age=this.value;">
          <button class="vstep-btn" onclick="VAL.age=Math.min(80,(parseInt(VAL.age)||0)+1);document.getElementById('v-age').value=VAL.age;">+</button>
        </div>
      </div>
      <div class="vfield" data-info="total-floors">
        <label class="vlbl">TOPLAM KAT</label>
        <div class="vstep-wrap">
          <button class="vstep-btn" onclick="VAL.totalFloors=Math.max(1,(parseInt(VAL.totalFloors)||0)-1);document.getElementById('v-total-floors').value=VAL.totalFloors;">−</button>
          <input type="number" class="vinput vstep-input" id="v-total-floors" value="${VAL.totalFloors}" min="1" max="60" placeholder="0" oninput="VAL.totalFloors=this.value;">
          <button class="vstep-btn" onclick="VAL.totalFloors=Math.min(60,(parseInt(VAL.totalFloors)||0)+1);document.getElementById('v-total-floors').value=VAL.totalFloors;">+</button>
        </div>
      </div>
    </div>

    <div class="vrow2">
      <div class="vfield" data-info="floor">
        <label class="vlbl">BULUNDUĞU KAT *</label>
        <div class="vstep-wrap">
          <button class="vstep-btn" onclick="VAL.floor=Math.max(0,(parseInt(VAL.floor)||0)-1);document.getElementById('v-floor').value=VAL.floor;">−</button>
          <input type="number" class="vinput vstep-input" id="v-floor" value="${VAL.floor}" min="0" max="60" placeholder="0" oninput="VAL.floor=this.value;">
          <button class="vstep-btn" onclick="VAL.floor=Math.min(60,(parseInt(VAL.floor)||0)+1);document.getElementById('v-floor').value=VAL.floor;">+</button>
        </div>
      </div>
    </div>

    <div class="vfield" data-info="usage">
      <label class="vlbl">KULLANIM DURUMU</label>
      <div class="vchips" id="v-usage-chips">
        ${usages.map(u => `<button class="vchip ${VAL.usage===u?'on':''}" onclick="VAL.usage='${u}';document.querySelectorAll('#v-usage-chips .vchip').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${u}</button>`).join('')}
      </div>
    </div>

    <div class="vfield" data-info="condition">
      <label class="vlbl">YAPI DURUMU</label>
      <div class="vchips" id="v-cond-chips">
        ${conditions.map(c => `<button class="vchip vcond${VAL.condition===c?' on':''}" onclick="VAL.condition='${c}';document.querySelectorAll('#v-cond-chips .vchip').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${c}</button>`).join('')}
      </div>
    </div>

    <div class="val-actions">
      <button class="val-back" onclick="goStep(2)">← Geri</button>
      <button class="val-next" onclick="if(VAL.rooms&&VAL.grossM2){goStep(4);}else{if(typeof showError==='function')showError('Oda sayısı ve brüt m² giriniz.','Eksik Alan');}">Devam Et →</button>
    </div>`;
}

/* ─── ADIM 4: DETAYLAR ─── */
function renderStep4() {
  const facades = ['Kuzey','Güney','Doğu','Batı','Kuzeydoğu','Kuzeybatı','Güneydoğu','Güneybatı'];
  const views = ['Şehir','Deniz','Göl','Orman','Dağ','Park','Bahçe','İç Avlu'];
  const heatings = ['Kombi','Merkezi','Yerden Isıtma','Soba','Klima','Yok'];
  const amenities = [
    'Balkon','Asansör','Otopark','Site İçi','Ebeveyn Banyosu',
    'Jakuzi','Duşakabin','Ankastre Fırın','Gömme Dolap','Parke Zemin',
    '24 Saat Güvenlik','Isı Yalıtımı','Kamera Sistemi','Görüntülü Diafon',
    'Doğalgaz','Klima','Çelik Kapı','Amerikan Kapı'
  ];

  return `
    <div class="val-form-title">Ek özellikleri girin</div>
    <p class="val-form-sub">Bu bilgiler değerlemeyi daha doğru hale getirir. İsteğe bağlıdır.</p>

    <div class="vfield" data-info="facade">
      <label class="vlbl">CEPHE DURUMU (BİRDEN FAZLA SEÇİLEBİLİR)</label>
      <div class="vchips" id="v-facade-chips">
        ${facades.map(f => `<button class="vchip ${VAL.facades.includes(f)?'on':''}" onclick="const i=VAL.facades.indexOf('${f}');if(i>-1)VAL.facades.splice(i,1);else VAL.facades.push('${f}');this.classList.toggle('on');">${f}</button>`).join('')}
      </div>
    </div>

    <div class="vfield" data-info="view">
      <label class="vlbl">MANZARA (BİRDEN FAZLA SEÇİLEBİLİR)</label>
      <div class="vchips" id="v-view-chips">
        ${views.map(v => `<button class="vchip ${VAL.views.includes(v)?'on':''}" onclick="const i=VAL.views.indexOf('${v}');if(i>-1)VAL.views.splice(i,1);else VAL.views.push('${v}');this.classList.toggle('on');">${v}</button>`).join('')}
      </div>
    </div>

    <div class="vfield" data-info="heating">
      <label class="vlbl">ISITMA SİSTEMİ</label>
      <div class="vchips" id="v-heat-chips">
        ${heatings.map(h => `<button class="vchip vheat${VAL.heating===h?' on':''}" onclick="VAL.heating='${h}';document.querySelectorAll('#v-heat-chips .vchip').forEach(x=>x.classList.remove('on'));this.classList.add('on');">${h}</button>`).join('')}
      </div>
    </div>

    <div class="vfield" data-info="amenities">
      <label class="vlbl">OLANAKLAR (BİRDEN FAZLA SEÇİLEBİLİR)</label>
      <div class="vchips" id="v-amen-chips">
        ${amenities.map(a => `<button class="vchip ${VAL.amenities.includes(a)?'on':''}" onclick="const i=VAL.amenities.indexOf('${a}');if(i>-1)VAL.amenities.splice(i,1);else VAL.amenities.push('${a}');this.classList.toggle('on');">${a}</button>`).join('')}
      </div>
    </div>

    <div class="val-actions">
      <button class="val-back" onclick="goStep(3)">← Geri</button>
      <button class="val-next" onclick="goStep(5)">Analizi Başlat →</button>
    </div>`;
}

/* ─── ADIM 5: SMS DOĞRULAMA ─── */
function renderStep5() {
  return `
    <div class="val-form-title">Sonuçları görüntüle</div>
    <p class="val-form-sub">Değerleme sonuçlarınızı görmek için telefon numaranızı girin.</p>

    <div id="sms-tel-step">
      <div class="vfield">
        <label class="vlbl">TELEFON NUMARASI</label>
        <input type="tel" class="vinput" id="v-tel" placeholder="05xx xxx xx xx" maxlength="11" style="font-size:18px;letter-spacing:2px;text-align:center;">
        <div style="font-size:12px;color:var(--txm);margin-top:8px;">Sonuçlarınızı görmek için telefon numaranızı doğrulayın.</div>
      </div>
      <div class="val-actions">
        <button class="val-back" onclick="goStep(4)">← Geri</button>
        <button class="val-next" onclick="smsSend()">Kod Gönder →</button>
      </div>
    </div>

    <div id="sms-code-step" style="display:none;">
      <div class="vfield">
        <label class="vlbl">DOĞRULAMA KODU</label>
        <div style="font-size:13px;color:var(--txm);margin-bottom:14px;" id="sms-code-desc">Numaranıza gönderilen 4 haneli kodu girin.</div>
        <input type="number" class="vinput" id="v-code" placeholder="0000" maxlength="4" style="font-size:32px;letter-spacing:12px;text-align:center;font-weight:700;">
      </div>
      <div class="val-actions">
        <button class="val-back" onclick="document.getElementById('sms-tel-step').style.display='block';document.getElementById('sms-code-step').style.display='none';">← Geri</button>
        <button class="val-next" onclick="smsVerify()">Sonuçları Gör →</button>
      </div>
      <button onclick="smsSend()" style="width:100%;padding:10px;background:transparent;border:none;color:var(--txm);font-size:13px;font-family:var(--font);cursor:pointer;margin-top:8px;text-decoration:underline;">Tekrar gönder</button>
    </div>`;
}

/* SMS gönder */
function smsSend() {
  const tel = (document.getElementById('v-tel')||{}).value || '';
  const clean = tel.replace(/\s/g,'');
  if (clean.length < 10 || !clean.startsWith('0')) {
    if(typeof showError==='function') showError('Lütfen geçerli bir telefon numarası girin (05xx ile başlamalı).','Geçersiz Numara');
    return;
  }
  smsCode = String(Math.floor(1000 + Math.random() * 9000));
  if(typeof showSMSCode==='function') showSMSCode(smsCode, tel);
  else console.log('SMS Kodu:', smsCode);
  document.getElementById('sms-tel-step').style.display = 'none';
  document.getElementById('sms-code-step').style.display = 'block';
  const desc = document.getElementById('sms-code-desc');
  if(desc) desc.textContent = clean + ' numarasına gönderilen 4 haneli kodu girin.';
}

function smsVerify() {
  const entered = (document.getElementById('v-code')||{}).value || '';
  if (!entered || entered.length < 4) {
    if(typeof showError==='function') showError('Lütfen doğrulama kodunu girin.','Eksik Kod');
    return;
  }
  if (String(entered) !== String(smsCode)) {
    if(typeof showError==='function') showError('Girdiğiniz kod hatalı. Tekrar deneyin.','Hatalı Kod');
    return;
  }
  goStep(6);
}

/* ─── ADIM 6: SONUÇ ─── */
function renderStep6() {
  const label = VAL.district + (VAL.quarter ? ' · '+VAL.quarter : '') + (VAL.rooms ? ' · '+VAL.rooms : '') + (VAL.grossM2 ? ' · '+VAL.grossM2+'m²' : '');
  return `
    <div class="vre-header">
      <div>
        <div class="vre-title">Değerleme Sonucu</div>
        <div class="vre-sub">${label}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="pg-back" onclick="goStep(1)">← Geri Dön</button>
        <button class="pg-back" onclick="initValuation()">+ Yeni Değerleme</button>
      </div>
    </div>

    <div class="vre-main">

      <!-- SOL: Fiyat kartı -->
      <div class="vre-price-card" id="vre-price-card">
        <div style="text-align:center;padding:24px 0 12px;">
          <div style="font-size:36px;margin-bottom:10px;">🏠</div>
          <div style="font-size:11px;color:var(--txm);letter-spacing:2.5px;margin-bottom:10px;">TAHMİNİ DEĞER</div>
          <div class="vre-price-big" id="vre-est-val">Hesaplanıyor...</div>
          <div style="height:3px;background:rgba(201,168,76,.15);border-radius:100px;overflow:hidden;margin:14px 0 8px;">
            <div id="vre-conf-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--gold-d),var(--gold));border-radius:100px;transition:width 1.2s ease;"></div>
          </div>
          <div style="font-size:13px;color:var(--gold);" id="vre-conf-txt">⊙ Güven Puanı: —</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
          <div class="vre-minmax"><div style="font-size:11px;color:var(--txm);margin-bottom:5px;">↓ Min Değer</div><div id="vre-min-val" style="font-size:14px;font-weight:700;color:var(--tx);">—</div></div>
          <div class="vre-minmax"><div style="font-size:11px;color:var(--txm);margin-bottom:5px;">↑ Maks Değer</div><div id="vre-max-val" style="font-size:14px;font-weight:700;color:var(--tx);">—</div></div>
        </div>
        <button class="btn-g" style="width:100%;justify-content:center;margin-top:20px;" onclick="if(typeof openAdvisorModal==='function')openAdvisorModal(VAL.district);else location.href='/danisman'">👤 Danışman Bul</button>
      </div>

      <!-- SAĞ: Sonraki adımlar -->
      <div class="vre-steps-panel">
        <div style="font-size:12px;font-weight:700;color:var(--txm);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:18px;">Sonraki Adımlar</div>
        ${[
          ['1 — Özellikler Girildi','done'],
          ['2 — Değer Hesaplandı','done'],
          ['3 — Danışman Bul',''],
          ['4 — Güvenle Sat','']
        ].map(([t,cls]) => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--d3);border:1px solid ${cls==='done'?'rgba(76,175,130,.25)':'var(--bd)'};border-radius:var(--rs);margin-bottom:8px;transition:all .2s;">
            <div style="width:28px;height:28px;border-radius:50%;background:${cls==='done'?'rgba(76,175,130,.15)':'var(--d4)'};border:1px solid ${cls==='done'?'var(--ok)':'var(--bd)'};display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;color:${cls==='done'?'var(--ok)':'var(--txm)'};">${cls==='done'?'✓':'○'}</div>
            <div style="font-size:13px;color:${cls==='done'?'var(--ok)':'var(--txm)'};">${t}</div>
          </div>`).join('')}
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--bd);font-size:12px;color:var(--txd);" id="vre-disclaimer">* Benzer ilanlar analiz edilmiştir. Tahmin ±%12 sapma gösterebilir.</div>
      </div>

    </div>

    <!-- Alt satır: Yatırım + AI -->
    <div class="vre-bottom-row">

      <div class="vre-invest">
        <div class="vre-section-title">▼ Yatırım Analizi</div>
        <div class="vre-invest-grid" id="vre-invest-grid">
          <div class="vre-invest-item"><div class="vre-invest-lbl">Tahmini Aylık Kira</div><div class="vre-invest-val" id="vre-rent">—</div></div>
          <div class="vre-invest-item"><div class="vre-invest-lbl">Brüt Kira Getirisi</div><div class="vre-invest-val" id="vre-yield">—</div></div>
          <div class="vre-invest-item"><div class="vre-invest-lbl">Amortisman Süresi</div><div class="vre-invest-val" id="vre-amort">—</div></div>
          <div class="vre-invest-item"><div class="vre-invest-lbl">Fırsat Skoru</div><div class="vre-invest-val" id="vre-score">—</div></div>
        </div>
      </div>

      <div class="vre-ai">
        <div class="vre-ai-badge">▲ AI ANALİZİ</div>
        <div class="vre-ai-text" id="ai-analysis-text">Analiz hazırlanıyor...</div>
        <div id="ai-read-more-wrap" style="margin-top:10px;display:none;">
          <span id="ai-short-text" style="display:none;font-size:13px;color:var(--txm);"></span>
          <button id="ai-toggle-btn" onclick="toggleAiText(this)" style="background:none;border:none;color:var(--gold);font-size:13px;font-weight:600;font-family:var(--font);cursor:pointer;padding:0;">Devamını oku ↓</button>
          <span id="ai-full-text" style="display:none;font-size:13px;color:var(--txm);white-space:pre-line;line-height:1.75;"></span>
        </div>
      </div>

    </div>`;
}

function bindStepEvents(step) {
  if (step === 1) {
    document.querySelectorAll('.cat-card').forEach(card => {
      card.addEventListener('click', () => {
        VAL.category = card.dataset.cat;
        document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('on'));
        card.classList.add('on');
        const btn = document.getElementById('val-next-1');
        if (btn) btn.removeAttribute('disabled');
      });
    });
  }
  if (step === 2) {
    if (typeof populateValDistricts === 'function') setTimeout(populateValDistricts, 50);
    const sel = document.getElementById('v-district');
    if (sel && VAL.district) { sel.value = VAL.district; if (typeof populateValQuarters === 'function') populateValQuarters(VAL.district); }
    const qsel = document.getElementById('v-quarter');
    if (qsel && VAL.quarter) setTimeout(() => { qsel.value = VAL.quarter; }, 120);
  }
}

/* ─── HESAPLAMA ─── */
function calcAndRender() {
  if (!all || !all.length) {
    if (typeof loadForVal === 'function') {
      loadForVal().then(() => calcAndRender()).catch(() => {});
    }
    return;
  }

  const district = VAL.district;
  const quarter  = VAL.quarter;
  const rooms    = VAL.rooms;
  const m2       = parseFloat(VAL.grossM2) || parseFloat(VAL.netM2) || 80;
  const age      = parseFloat(VAL.age) || 5;

  let pool  = all.filter(l => l.district === district && l.rooms === rooms && l.net_size > 0 && l.price > 0);
  let byQ   = quarter ? pool.filter(l => l.quarter === quarter) : [];
  let usedPool   = byQ.length >= 3 ? byQ : pool;
  let scopeLabel = byQ.length >= 3 ? quarter : district + ' geneli';

  if (!usedPool.length) {
    usedPool = all.filter(l => l.district === district && l.net_size > 0 && l.price > 0);
    scopeLabel = district + ' geneli (tüm tipler)';
  }
  if (!usedPool.length) {
    const ev = document.getElementById('vre-est-val');
    if (ev) ev.textContent = 'Yeterli veri yok';
    return;
  }

  // Ağırlıklı m² ortalaması (yeni ilanlar daha ağırlıklı)
  const now = Date.now();
  const weights = usedPool.map(l => {
    const dateStr = l.created_at || l.updated_at || '';
    const d = dateStr ? new Date(dateStr).getTime() : now - 30*24*3600*1000;
    const daysOld = Math.max(0, (now - d) / (1000*3600*24));
    return Math.max(0.1, 1 - daysOld/180);
  });
  const totalW = weights.reduce((a,b) => a+b, 0);
  const m2Prices = usedPool.map(l => l.price / l.net_size);
  const avgM2 = m2Prices.reduce((sum, p, i) => sum + p * weights[i], 0) / totalW;
  const avgTotal = usedPool.reduce((sum, l, i) => sum + l.price * weights[i], 0) / totalW;

  // Çarpanlar
  const ageFactor  = age <= 2 ? 1.10 : age <= 5 ? 1.05 : age <= 10 ? 1.00 : age <= 20 ? 0.94 : age <= 30 ? 0.86 : 0.78;
  const condFactor = VAL.condition === 'Bakımlı/Yenilenmiş' ? 1.06 : VAL.condition === 'Tadilat İhtiyacı Var' ? 0.88 : 1.00;
  const heatBonus  = ['Yerden Isıtma','Kombi'].includes(VAL.heating) ? 0.015 : 0;
  const viewBonus  = VAL.views.length * 0.008;
  const amenBonus  = VAL.amenities.length * 0.007;
  const floorFactor = (() => {
    const fl = parseInt(VAL.floor) || 3;
    const tot = parseInt(VAL.totalFloors) || 8;
    if (fl === 0 || fl === 1) return 0.96;
    if (fl === tot) return 1.04;
    return 1.0 + (fl / tot) * 0.02;
  })();

  const totalFactor = ageFactor * condFactor * floorFactor * (1 + heatBonus + viewBonus + amenBonus);
  const estimated   = Math.round(avgM2 * m2 * totalFactor);
  const low  = Math.round(estimated * 0.88);
  const high = Math.round(estimated * 1.12);
  const confidence  = Math.min(95, 55 + usedPool.length * 2);
  const monthlyRent = Math.round(estimated * 0.0045);
  const yieldPct    = ((monthlyRent * 12) / estimated * 100).toFixed(1);
  const amort       = Math.round(estimated / (monthlyRent * 12));
  const score       = Math.min(100, Math.round(48 + usedPool.length * 1.8 + (ageFactor > 1 ? 12 : 0) + VAL.amenities.length * 0.5));

  calcResult = { usedPool, estimated, low, high, confidence, monthlyRent, yieldPct, amort, score, scopeLabel, avgM2, avgTotal };

  const fp2 = n => new Intl.NumberFormat('tr-TR').format(n);

  // UI güncelle
  const ev = document.getElementById('vre-est-val'); if(ev) ev.textContent = fp2(estimated)+' ₺';
  setTimeout(() => {
    const cb = document.getElementById('vre-conf-bar'); if(cb) cb.style.width = confidence + '%';
  }, 150);
  const ct = document.getElementById('vre-conf-txt'); if(ct) ct.textContent = '⊙ Güven Puanı: ' + confidence;
  const mn = document.getElementById('vre-min-val'); if(mn) mn.textContent = fp2(low)+' ₺';
  const mx = document.getElementById('vre-max-val'); if(mx) mx.textContent = fp2(high)+' ₺';
  const rn = document.getElementById('vre-rent');    if(rn) rn.textContent = fp2(monthlyRent)+' ₺';
  const yl = document.getElementById('vre-yield');   if(yl) yl.textContent = '%'+yieldPct;
  const am = document.getElementById('vre-amort');   if(am) am.textContent = amort+' yıl';
  const sc = document.getElementById('vre-score');   if(sc) sc.textContent = score+'/100';
  const dc = document.getElementById('vre-disclaimer'); if(dc) dc.textContent = `* ${usedPool.length} benzer ilan analiz edilmiştir (${scopeLabel}). Tahmin ±%12 sapma gösterebilir.`;

  // Sağ panel — Benzer ilanlar
  const infoArea = document.getElementById('val-info-area');
  if (infoArea) {
    const list = usedPool.slice(0, 10);
    const avgAge = list.reduce((s,l) => s + (parseInt(l.building_age)||10), 0) / list.length;
    infoArea.innerHTML = `
      <div class="val-info-panel" id="val-info-panel">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div class="val-info-title">🏠 Benzer İlanlar</div>
          <div style="font-size:11px;color:var(--txm);">${list.length} ilan</div>
        </div>
        <div style="flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,.15) transparent;padding-right:4px;">
          ${list.map(l => {
            const imgs = (() => { try { return Array.isArray(l.images)?l.images:(typeof l.images==='string'?JSON.parse(l.images||'[]'):[]) } catch(e) { return [] } })();
            const lAge = parseInt(l.building_age) || 0;
            const ageDiff = lAge - (parseInt(VAL.age)||5);
            const ageLabel = lAge ? lAge+' yaş' : '?';
            const ageBadge = lAge <= 5 ? 'rgba(76,175,130,.15);color:var(--ok)' : lAge <= 15 ? 'rgba(201,168,76,.12);color:var(--gold)' : 'rgba(255,255,255,.05);color:var(--txm)';
            return `<div style="padding:10px 0;border-bottom:1px solid var(--bd);" onmouseenter="this.style.background='rgba(201,168,76,.03)'" onmouseleave="this.style.background=''">
              <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">
                ${imgs[0] ? `<img src="${imgs[0]}" style="width:52px;height:42px;object-fit:cover;border-radius:5px;flex-shrink:0;" onerror="this.style.display='none'">` : `<div style="width:52px;height:42px;background:var(--d3);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🏠</div>`}
                <div style="flex:1;min-width:0;">
                  <div style="font-size:11px;color:var(--tx);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${l.title||'İlan'}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                <div style="font-size:10px;color:var(--txm);">${l.rooms||'?'} · ${l.net_size||'?'}m² · ${l.quarter||l.district||'?'}</div>
                <div style="display:flex;align-items:center;gap:5px;">
                  <span style="font-size:10px;padding:2px 7px;border-radius:100px;background:${ageBadge};">${ageLabel}</span>
                  <span style="font-size:13px;font-weight:700;color:var(--gold);">${fp2(l.price)} ₺</span>
                </div>
              </div>
              ${l.url ? `<button onclick="confirmGoListing('${l.url.replace(/'/g,"\\'")}','${(l.title||'İlan').replace(/'/g,"\\'")}',${l.price})" style="width:100%;margin-top:7px;padding:5px;background:rgba(201,168,76,.07);border:1px solid rgba(201,168,76,.18);border-radius:6px;color:var(--gold);font-size:11px;font-weight:600;font-family:var(--font);cursor:pointer;transition:all .2s;" onmouseover="this.style.background='rgba(201,168,76,.15)'" onmouseout="this.style.background='rgba(201,168,76,.07)'">İlana Git →</button>` : ''}
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
  const fp2 = n => new Intl.NumberFormat('tr-TR').format(n);

  const age = parseInt(VAL.age) || 0;
  let yasYorum = age <= 2
    ? 'Sıfır veya çok yeni yapı olması mülkün hem oturuma hazır hem de yatırım değerini güçlü kılmaktadır.'
    : age <= 5  ? 'Yeni yapı olması mülkün bakım maliyetlerini düşük tutmakta ve alıcılar için cazip bir seçenek oluşturmaktadır.'
    : age <= 10 ? 'Bina yaşının makul seviyede olması mülkün hem kullanım kalitesini hem de piyasa değerini olumlu yönde korumaktadır.'
    : age <= 20 ? 'Binanın orta yaşlı olması fiyatı bölge ortalamasının hafif altında tutmakta, bu durum alıcılar için avantajlı bir fırsat sunmaktadır.'
    : 'Bina yaşının yüksek olması fiyatı bölge ortalamasının altında tutmaktadır. Renovasyon potansiyeli taşıyan mülkler yatırımcılar için fırsat oluşturabilir.';

  const veriYorum = r.usedPool.length >= 10
    ? `${r.usedPool.length} benzer ilan incelenerek`
    : `Bölgedeki mevcut ${r.usedPool.length} benzer ilan baz alınarak`;

  const shortText = `${r.scopeLabel} bölgesindeki güncel piyasa verileri incelendiğinde, ${VAL.grossM2 || '?'} m² büyüklüğündeki ${VAL.rooms||''} tipi konutunuz için belirlenen ortalama birim fiyat ${fp2(Math.round(r.avgM2))} ₺/m² olup bölge rayiçlerine uygundur.`;

  const fullText = `\n\n${yasYorum} ${veriYorum} hesaplanan tahmini piyasa değeri ${fp2(r.estimated)} ₺ olup, ${fp2(r.low)} ₺ ile ${fp2(r.high)} ₺ aralığındaki fiyatlandırma bölgenin mevcut koşullarına göre gerçekçi bir piyasa beklentisidir.\n\n**Satıcı için öneri:** İç kondisyon ve bina bakımı iyiyse ${fp2(Math.round(r.estimated * 1.05))} ₺ bandından pazarlığa başlanması, alıcıya makul bir indirim payı bırakırken hedef satış fiyatına ulaşmayı kolaylaştıracaktır.\n\n**Alıcı için öneri:** Bölgedeki arz koşulları göz önüne alındığında ${fp2(r.estimated * 0.95 | 0)} ₺ altındaki tekliflerin fırsat olarak değerlendirilmesi ve ${fp2(Math.round(r.estimated * 0.95))} ₺ civarında pazarlık başlatılması tavsiye edilir.`;

  // İlk kısım typewriter, sonra "Devamını oku" butonu
  el.textContent = '';
  let i = 0;
  _aiTypewriterInterval = setInterval(() => {
    if (i < shortText.length) {
      el.textContent += shortText[i];
      i++;
    } else {
      clearInterval(_aiTypewriterInterval);
      _aiTypewriterInterval = null;
      // "Devamını oku" göster
      const wrap = document.getElementById('ai-read-more-wrap');
      const full = document.getElementById('ai-full-text');
      if (wrap && full) {
        full.textContent = fullText;
        wrap.style.display = 'block';
      }
    }
  }, 14);
}

function toggleAiText(btn) {
  const full = document.getElementById('ai-full-text');
  if (!full) return;
  const isOpen = full.style.display !== 'none';
  full.style.display = isOpen ? 'none' : 'block';
  btn.textContent = isOpen ? 'Devamını oku ↓' : 'Kapat ↑';
}

function confirmGoListing(url, title, price) {
  if (!url) return;
  const fp2 = n => new Intl.NumberFormat('tr-TR').format(n);
  if (confirm(`"${title}"\n${fp2(price)} ₺\n\nBu sayfadan ayrılıp ilana gideceksiniz. Devam etmek istiyor musunuz?`)) {
    window.open(url, '_blank');
  }
}
