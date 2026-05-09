// ===== DANIŞMAN SAYFASI JS =====
const ADVISORS = [
  { name:'Ahmet Yılmaz', initials:'AY', district:'Selçuklu', specialties:['konut','ticari'], sales:47, years:8, rating:4.9, desc:'Selçuklu ve çevresinde 8 yıllık deneyim. Konut ve ticari gayrimenkul alanında uzman.' },
  { name:'Fatma Demir', initials:'FD', district:'Meram', specialties:['konut','kiralık'], sales:38, years:6, rating:4.8, desc:'Meram bölgesinde konut ve kiralık mülk konusunda güvenilir hizmet.' },
  { name:'Mehmet Kaya', initials:'MK', district:'Karatay', specialties:['ticari','arsa'], sales:29, years:11, rating:4.7, desc:'Karatay\'da ticari mülkler ve arsa yatırımlarında 11 yıllık deneyim.' },
  { name:'Zeynep Arslan', initials:'ZA', district:'Selçuklu', specialties:['konut','arsa'], sales:52, years:9, rating:4.9, desc:'Lüks konut ve arsa segmentinde Konya\'nın en çok tercih edilen danışmanlarından.' },
  { name:'Ali Öztürk', initials:'AÖ', district:'Beyşehir', specialties:['konut','kiralık'], sales:21, years:4, rating:4.6, desc:'Beyşehir bölgesinde konut alım-satım ve kiralama konusunda uzman.' },
  { name:'Ayşe Çelik', initials:'AÇ', district:'Ereğli', specialties:['arsa','ticari'], sales:34, years:7, rating:4.8, desc:'Ereğli ve Konya ovasında arsa ve tarım arazisi değerleme uzmanı.' },
  { name:'Hasan Yıldız', initials:'HY', district:'Meram', specialties:['konut','ticari'], sales:41, years:10, rating:4.7, desc:'Meram\'da lüks konut projeleri ve ticari mülk alım-satımında uzman.' },
  { name:'Elif Şahin', initials:'EŞ', district:'Karatay', specialties:['konut','kiralık'], sales:18, years:3, rating:4.5, desc:'Karatay\'da konut ve kiralık daire konusunda genç ve dinamik danışman.' },
  { name:'Mustafa Güler', initials:'MG', district:'Seydişehir', specialties:['arsa','konut'], sales:26, years:6, rating:4.6, desc:'Seydişehir ve çevresinde tarım arazisi ve konut alanında uzman.' },
];

function filterAdvisors() {
  const dist = (document.getElementById('adv-district-filter') || {}).value || '';
  const spec = (document.getElementById('adv-spec-filter') || {}).value || '';
  renderAdvisors(dist, spec);
}

function renderAdvisors(distFilter, specFilter) {
  const grid = document.getElementById('adv-grid');
  if (!grid) return;
  let list = [...ADVISORS];
  if (distFilter) list = list.filter(a => a.district === distFilter);
  if (specFilter) list = list.filter(a => a.specialties.includes(specFilter));
  if (!list.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--txm);font-size:15px;">Bu kriterlere uygun danışman bulunamadı.</div>';
    return;
  }
  grid.innerHTML = list.map(a => `
    <div class="adv-card">
      <div class="adv-card-top">
        <div class="adv-avatar">${a.initials}</div>
        <div>
          <div class="adv-name">${a.name}</div>
          <div class="adv-title-badge">Gayrimenkul Danışmanı</div>
          <div class="adv-district">📍 ${a.district}</div>
        </div>
      </div>
      <div class="adv-stats">
        <div class="adv-stat"><div class="adv-stat-val">${a.sales}</div><div class="adv-stat-lbl">Satış</div></div>
        <div class="adv-stat"><div class="adv-stat-val">${a.years}</div><div class="adv-stat-lbl">Yıl</div></div>
        <div class="adv-stat"><div class="adv-stat-val">${a.rating}</div><div class="adv-stat-lbl">Puan</div></div>
      </div>
      <p class="adv-desc">${a.desc}</p>
      <div class="adv-tags">${a.specialties.map(s => `<span class="adv-tag">${s}</span>`).join('')}</div>
      <button class="adv-contact-btn" onclick="showPopup('${a.name} ile iletişim yakında aktif olacak.','Danışman','👤','info')">İletişime Geç</button>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => renderAdvisors('', ''));
