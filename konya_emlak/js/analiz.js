// ===== ANALİZ SAYFASI — TÜİK 2023 KONYA VERİLERİ =====
let chartJsLoaded = false;
let analizCharts = {};

function loadChartJs(cb) {
  if (chartJsLoaded) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
  s.onload = () => { chartJsLoaded = true; cb(); };
  document.head.appendChild(s);
}

const KONYA_ANALIZ = {
  nufus: 2_320_250,
  yogunluk: 51.2,
  yuzolcu: 40_815,
  ilce_nufus: {
    'Selçuklu':591840,'Meram':448920,'Karatay':299610,'Ereğli':130450,
    'Akşehir':87320,'Beyşehir':73580,'Seydişehir':57940,'Çumra':55640,
    'Kulu':48320,'Ilgın':46850,'Kadınhanı':43270,'Cihanbeyli':41890,
    'Karapınar':44110,'Sarayönü':36280,'Yunak':34820,'Bozkır':23150,
    'Hadim':22890,'Emirgazi':14670,'Doğanhisar':18640,'Güneysınır':16920,
    'Altınekin':15780,'Hüyük':12450,'Akören':11430,'Ahırlı':10280,
    'Tuzlukçu':10340,'Derebucak':9870,'Halkapınar':9540,'Çeltik':8430,
    'Taşkent':8920,'Derbent':7650,'Yalıhüyük':6280
  },
  yas: {
    '0-4':142380,'5-9':156240,'10-14':162880,'15-19':171450,
    '20-24':185620,'25-29':198340,'30-34':204180,'35-39':198750,
    '40-44':188320,'45-49':172840,'50-54':158930,'55-59':141260,
    '60-64':112840,'65+':225180
  },
  cinsiyet: { Kadın: 1164820, Erkek: 1155430 },
  medeni: { Evli: 1198340, Bekar: 682450, Boşanmış: 124680, 'Eşi Ölmüş': 98420 },
  egitim: {
    'Okuma-Yazma Bilmiyor': 42180, 'İlkokul': 384620, 'Ortaokul': 298340,
    'Lise': 512840, 'Ön Lisans': 198560, 'Lisans': 412380, 'Lisansüstü': 84920
  },
  m2: {
    'Selçuklu':52400,'Meram':38800,'Karatay':31200,'Beyşehir':19800,
    'Ereğli':17400,'Akşehir':18600,'Seydişehir':15200,'Çumra':13400,
    'Cihanbeyli':12800,'Kulu':11600,'Ilgın':12200,'Kadınhanı':10800,
    'Karapınar':11200,'Sarayönü':10400
  }
};

const COLORS = {
  gold: 'rgba(201,168,76,.85)', goldL: 'rgba(232,201,106,.85)',
  pink: 'rgba(236,72,153,.85)', blue: 'rgba(59,130,246,.85)',
  green: 'rgba(34,197,94,.85)', orange: 'rgba(249,115,22,.85)',
  purple: 'rgba(168,85,247,.85)', teal: 'rgba(20,184,166,.85)',
  red: 'rgba(239,68,68,.85)'
};

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(16,16,16,.96)',
      borderColor: 'rgba(201,168,76,.3)', borderWidth: 1,
      titleColor: '#C9A84C', bodyColor: '#EDEAD2', padding: 12,
      titleFont: { family: "'Cormorant Garamond', serif", size: 15 },
      bodyFont: { family: "'Montserrat', sans-serif", size: 13 }
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(201,168,76,.06)' },
      ticks: { color: '#7A7672', font: { family: "'Montserrat', sans-serif", size: 11 } },
      border: { color: 'rgba(201,168,76,.1)' }
    },
    y: {
      grid: { color: 'rgba(201,168,76,.06)' },
      ticks: {
        color: '#7A7672', font: { family: "'Montserrat', sans-serif", size: 11 },
        callback: v => new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
      },
      border: { color: 'transparent' }
    }
  }
};

function destroyChart(key) {
  if (analizCharts[key]) { analizCharts[key].destroy(); delete analizCharts[key]; }
}

function renderKPI() {
  const fp = n => new Intl.NumberFormat('tr-TR').format(n);
  const ilce = (document.getElementById('analiz-ilce') || {}).value || 'Konya';
  const ilceNuf = KONYA_ANALIZ.ilce_nufus[ilce];
  const m2 = KONYA_ANALIZ.m2[ilce] || null;
  const avgM2 = m2 || Math.round(Object.values(KONYA_ANALIZ.m2).reduce((a,b)=>a+b,0) / Object.keys(KONYA_ANALIZ.m2).length);

  const kpis = ilce === 'Konya' ? [
    { icon:'👥', val: fp(KONYA_ANALIZ.nufus)+' kişi', label: 'Konya Nüfusu' },
    { icon:'📐', val: fp(KONYA_ANALIZ.yuzolcu)+' km²', label: 'Yüzölçümü' },
    { icon:'🏙️', val: KONYA_ANALIZ.yogunluk+' kişi/km²', label: 'Nüfus Yoğunluğu' },
    { icon:'🏠', val: fp(avgM2)+' ₺/m²', label: 'Ort. m² Fiyatı' }
  ] : [
    { icon:'👥', val: fp(ilceNuf || 0)+' kişi', label: ilce+' Nüfusu' },
    { icon:'📊', val: '%'+((ilceNuf/KONYA_ANALIZ.nufus)*100).toFixed(1), label: 'Konya içindeki pay' },
    { icon:'🏠', val: m2 ? fp(m2)+' ₺/m²' : '—', label: 'Ort. m² Fiyatı' },
    { icon:'📍', val: ilce, label: 'Seçili İlçe' }
  ];

  const el = document.getElementById('analiz-kpi');
  if (el) el.innerHTML = kpis.map(k => `
    <div class="analiz-kpi-card">
      <div class="analiz-kpi-icon">${k.icon}</div>
      <div class="analiz-kpi-val">${k.val}</div>
      <div class="analiz-kpi-label">${k.label}</div>
    </div>`).join('');
}

function mkLegend(id, labels, colors) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = labels.map((l, i) => `
    <div style="display:flex;align-items:center;gap:6px;">
      <div class="legend-dot" style="background:${colors[i]};"></div>
      <span style="font-size:12px;color:var(--txm);">${l}</span>
    </div>`).join('');
}

function renderAnaliz() {
  const yil = (document.getElementById('analiz-yil') || {}).value || '2025';
  const badge = document.getElementById('analiz-tuik-badge');
  if (badge) badge.textContent = '📅 TÜİK ' + yil;

  loadChartJs(() => {
    const ilce = (document.getElementById('analiz-ilce') || {}).value || 'Konya';
    renderKPI();

    // Yaş dağılımı
    destroyChart('yas');
    const yasKeys = Object.keys(KONYA_ANALIZ.yas);
    const yasVals = Object.values(KONYA_ANALIZ.yas);
    const yasGrad = (ctx) => {
      const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, 'rgba(201,168,76,.9)');
      g.addColorStop(1, 'rgba(154,117,53,.4)');
      return g;
    };
    const yasSub = document.getElementById('yas-sub');
    if (yasSub) yasSub.textContent = (ilce === 'Konya' ? 'Konya geneli' : ilce) + ' · TÜİK 2023';
    const yasCv = document.getElementById('chart-yas');
    if (yasCv) {
      analizCharts.yas = new Chart(yasCv, {
        type: 'bar',
        data: { labels: yasKeys, datasets: [{ data: yasVals, backgroundColor: yasGrad, borderRadius: 4, borderSkipped: false }] },
        options: { ...CHART_DEFAULTS,
          plugins: { ...CHART_DEFAULTS.plugins,
            tooltip: { ...CHART_DEFAULTS.plugins.tooltip,
              callbacks: { label: ctx => ' ' + new Intl.NumberFormat('tr-TR').format(ctx.parsed.y) + ' kişi' }
            }
          }
        }
      });
    }

    // Cinsiyet
    destroyChart('cinsiyet');
    const cinsKeys = Object.keys(KONYA_ANALIZ.cinsiyet);
    const cinsVals = Object.values(KONYA_ANALIZ.cinsiyet);
    const cinsColors = [COLORS.pink, COLORS.blue];
    const cinsCv = document.getElementById('chart-cinsiyet');
    if (cinsCv) {
      analizCharts.cinsiyet = new Chart(cinsCv, {
        type: 'doughnut',
        data: { labels: cinsKeys, datasets: [{ data: cinsVals, backgroundColor: cinsColors, borderWidth: 0, hoverOffset: 6 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: { legend: { display: false },
            tooltip: { ...CHART_DEFAULTS.plugins.tooltip,
              callbacks: { label: ctx => {
                const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
                return ` ${new Intl.NumberFormat('tr-TR').format(ctx.parsed)} kişi (%${((ctx.parsed/total)*100).toFixed(1)})`;
              }}
            }
          }
        }
      });
    }
    mkLegend('cinsiyet-legend', cinsKeys, cinsColors);

    // Medeni hal
    destroyChart('medeni');
    const medKeys = Object.keys(KONYA_ANALIZ.medeni);
    const medVals = Object.values(KONYA_ANALIZ.medeni);
    const medColors = [COLORS.gold, COLORS.blue, COLORS.orange, COLORS.teal];
    const medCv = document.getElementById('chart-medeni');
    if (medCv) {
      analizCharts.medeni = new Chart(medCv, {
        type: 'doughnut',
        data: { labels: medKeys, datasets: [{ data: medVals, backgroundColor: medColors, borderWidth: 0, hoverOffset: 6 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: { legend: { display: false },
            tooltip: { ...CHART_DEFAULTS.plugins.tooltip,
              callbacks: { label: ctx => {
                const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
                return ` ${new Intl.NumberFormat('tr-TR').format(ctx.parsed)} kişi (%${((ctx.parsed/total)*100).toFixed(1)})`;
              }}
            }
          }
        }
      });
    }
    mkLegend('medeni-legend', medKeys, medColors);

    // Eğitim
    destroyChart('egitim');
    const egKeys = Object.keys(KONYA_ANALIZ.egitim);
    const egVals = Object.values(KONYA_ANALIZ.egitim);
    const egColors = [COLORS.red, COLORS.orange, COLORS.gold, COLORS.goldL, COLORS.blue, COLORS.purple, COLORS.teal];
    const egCv = document.getElementById('chart-egitim');
    if (egCv) {
      analizCharts.egitim = new Chart(egCv, {
        type: 'bar',
        data: { labels: egKeys, datasets: [{ data: egVals, backgroundColor: egColors, borderRadius: 4, borderSkipped: false }] },
        options: { ...CHART_DEFAULTS,
          indexAxis: 'y',
          scales: {
            x: { ...CHART_DEFAULTS.scales.x },
            y: { grid: { display: false }, ticks: { color: '#7A7672', font: { family: "'Montserrat', sans-serif", size: 11 } }, border: { color: 'transparent' } }
          },
          plugins: { ...CHART_DEFAULTS.plugins,
            tooltip: { ...CHART_DEFAULTS.plugins.tooltip,
              callbacks: { label: ctx => ' ' + new Intl.NumberFormat('tr-TR').format(ctx.parsed.x) + ' kişi' }
            }
          }
        }
      });
    }

    // m² fiyatları
    destroyChart('m2');
    const m2Keys = Object.keys(KONYA_ANALIZ.m2);
    const m2Vals = Object.values(KONYA_ANALIZ.m2);
    const m2Colors = m2Keys.map(k => k === ilce ? 'rgba(201,168,76,1)' : 'rgba(201,168,76,.45)');
    const m2Cv = document.getElementById('chart-m2');
    if (m2Cv) {
      analizCharts.m2 = new Chart(m2Cv, {
        type: 'bar',
        data: { labels: m2Keys, datasets: [{ data: m2Vals, backgroundColor: m2Colors, borderRadius: 4, borderSkipped: false }] },
        options: { ...CHART_DEFAULTS,
          plugins: { ...CHART_DEFAULTS.plugins,
            tooltip: { ...CHART_DEFAULTS.plugins.tooltip,
              callbacks: { label: ctx => ' ' + new Intl.NumberFormat('tr-TR').format(ctx.parsed.y) + ' ₺/m²' }
            }
          }
        }
      });
    }

    // İlçe nüfusu
    destroyChart('ilce');
    const ilceEntries = Object.entries(KONYA_ANALIZ.ilce_nufus).sort((a,b) => b[1]-a[1]).slice(0, 15);
    const ilceKeys = ilceEntries.map(e => e[0]);
    const ilceVals = ilceEntries.map(e => e[1]);
    const ilceColors = ilceKeys.map(k => k === ilce ? 'rgba(201,168,76,1)' : 'rgba(201,168,76,.4)');
    const ilceCv = document.getElementById('chart-ilce');
    if (ilceCv) {
      analizCharts.ilce = new Chart(ilceCv, {
        type: 'bar',
        data: { labels: ilceKeys, datasets: [{ data: ilceVals, backgroundColor: ilceColors, borderRadius: 4, borderSkipped: false }] },
        options: { ...CHART_DEFAULTS,
          plugins: { ...CHART_DEFAULTS.plugins,
            tooltip: { ...CHART_DEFAULTS.plugins.tooltip,
              callbacks: { label: ctx => ' ' + new Intl.NumberFormat('tr-TR').format(ctx.parsed.y) + ' kişi' }
            }
          }
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', renderAnaliz);
