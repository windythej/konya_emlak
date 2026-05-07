// ===== KARŞILAŞTIRMA + DEĞERLEME ORTAK JS =====
const SU='https://bknfjyfuzbanhoomooth.supabase.co',SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbmZqeWZ1emJhbmhvb21vb3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODczNDgsImV4cCI6MjA5MzE2MzM0OH0.7Tl3nWspqxDtnhIj2SZju_ObXtjkAsv_n-Joj7vwSx0';
let all=[],filtered=[],dMap=null,gImgs=[],gIdx=0;
const F={district:'',quarter:'',rooms:'',heating:'',features:[],min:null,max:null};
const fp=n=>new Intl.NumberFormat('tr-TR').format(n);
const gi=l=>Array.isArray(l.images)?l.images:(typeof l.images==='string'?JSON.parse(l.images||'[]'):[]);

async function load(){
  const btn=document.getElementById('sbtn');
  if(btn){btn.textContent='Yükleniyor...';btn.disabled=true;}
  const lv=document.getElementById('listv');if(lv)lv.innerHTML='<div class="loader"><div class="spin"></div><p>İlanlar getiriliyor...</p></div>';
  try{
    const r=await fetch(`${SU}/rest/v1/listings?select=*`,{headers:{'apikey':SK,'Authorization':`Bearer ${SK}`}});
    all=await r.json();buildD();buildQ();apply();populateValDistricts();selectDistrictFromURL();
  }catch(e){const lve=document.getElementById('listv');if(lve)lve.innerHTML=`<div class="empty"><h3>Hata</h3><p>${e.message}</p></div>`;}
  if(btn){btn.textContent='İlanları Getir';btn.disabled=false;}
}
function buildD(){
  const ds=[...new Set(all.map(l=>l.district).filter(Boolean))].sort();
  const c=document.getElementById('dc');if(!c)return;
  c.innerHTML='<button class="chip on" data-value="">Tümü</button>';
  ds.forEach(d=>{const b=document.createElement('button');b.className='chip';b.dataset.value=d;b.textContent=d;c.appendChild(b);});
  c.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.district=b.dataset.value;F.quarter='';buildQ();apply();}));
  if(document.getElementById('dc-m'))buildD_m();
}
function buildQ(){
  const src=F.district?all.filter(l=>l.district===F.district):all;
  const qs=[...new Set(src.map(l=>l.quarter).filter(Boolean))].sort();
  const c=document.getElementById('qc');if(!c)return;
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
  const sortEl=document.getElementById('sort');const s=sortEl?sortEl.value:'price_asc';
  let d=[...filtered];
  if(s==='price_asc')d.sort((a,b)=>a.price-b.price);
  else if(s==='price_desc')d.sort((a,b)=>b.price-a.price);
  else if(s==='m2_asc')d.sort((a,b)=>(a.price/(a.net_size||1))-(b.price/(b.net_size||1)));
  else if(s==='m2_desc')d.sort((a,b)=>(b.price/(b.net_size||1))-(a.price/(a.net_size||1)));
  renderStats(d);
  const vm0=document.getElementById('vm');
  if(vm0&&vm0.classList.contains('on'))renderMap(d);else renderList(d);
}
function renderStats(d){
  const s=document.getElementById('stats'),r=document.getElementById('rh');if(!s||!r)return;
  if(!d.length){s.style.display='none';r.style.display='none';return;}
  s.style.display='grid';r.style.display='flex';
  const avg=Math.round(d.reduce((x,l)=>x+l.price,0)/d.length);
  const wm=d.filter(l=>l.net_size>0);const am=wm.length?Math.round(wm.reduce((x,l)=>x+(l.price/l.net_size),0)/wm.length):0;
  const _sc=document.getElementById('sc');if(_sc)_sc.textContent=d.length;
  const _sa=document.getElementById('sa');if(_sa)_sa.textContent=fp(avg)+' ₺';
  const _sm=document.getElementById('sm');if(_sm)_sm.textContent=fp(am)+' ₺';
  const _rcnt=document.getElementById('rcnt');if(_rcnt)_rcnt.textContent=d.length;
}
function renderList(d){
  const mp=document.getElementById('mapv');if(mp)mp.style.display='none';
  const c=document.getElementById('listv');if(!c)return;c.style.display='flex';
  if(!d.length){c.innerHTML='<div class="empty"><h3>İlan bulunamadı</h3><p>Farklı filtreler deneyin.</p></div>';return;}
  const avg=d.reduce((x,l)=>x+l.price,0)/d.length;
  c.innerHTML=d.map((l,i)=>{
    const imgs=gi(l),m2p=l.net_size>0?Math.round(l.price/l.net_size):null;
    const isLow=l.price<avg*.85,isHigh=l.price>avg*1.2;
    const hasEb=Array.isArray(l.features)&&l.features.includes('Ebeveyn Banyosu');
    return `<div class="card" style="animation-delay:${i*.04}s;" data-id="${l.id}">
      <div class="ci"><div class="cimg">
        ${imgs[0]?`<img src="${imgs[0]}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=noimg>🏠</div>'"><div class="icnt">📷 ${imgs.length}</div>`:'<div class="noimg">🏠</div>'}
      </div><div class="cbody"><div>
        <div class="cloc"><div class="ldot"></div>${[l.quarter,l.district].filter(Boolean).join(' · ')}</div>
        <div class="cline"></div><div class="ctitle">${l.title||'İlan'}</div>
        <div class="cmeta">
          ${l.rooms?`<span class="mt hl">🛏 ${l.rooms}</span>`:''}
          ${l.net_size?`<span class="mt">⬜ ${l.net_size}m² net</span>`:''}
          ${l.heating_type?`<span class="mt">🔥 ${l.heating_type}</span>`:''}
          ${l.building_age?`<span class="mt">🏛 ${l.building_age}</span>`:''}
        </div></div>
        <div class="cfoot">
          <div class="pills">
            <span class="pl ${l.balcony==='Var'?'ok':'no'}">${l.balcony==='Var'?'✓':'✗'} Balkon</span>
            <span class="pl ${l.elevator==='Var'?'ok':'no'}">${l.elevator==='Var'?'✓':'✗'} Asansör</span>
            <span class="pl ${l.parking&&l.parking!=='Yok'?'ok':'no'}">${l.parking&&l.parking!=='Yok'?'✓':'✗'} Otopark</span>
          </div>
          <div class="cpb">
            <div class="cp">${fp(l.price)} ₺</div>
            ${m2p?`<div class="cm2">${fp(m2p)} ₺/m²</div>`:''}
            ${isLow?'<span class="bdg low">Uygun Fiyat</span>':''}
          </div>
        </div>
      </div></div></div>`;
  }).join('');
  c.querySelectorAll('.card').forEach(card=>{card.addEventListener('click',()=>{const l=all.find(x=>x.id===card.dataset.id);if(l)openDrawer(l);});});
}
let leafMap=null;
function renderMap(d){
  const mv=document.getElementById('mapv');if(!mv)return;
  mv.style.display='block';const lv=document.getElementById('listv');if(lv)lv.style.display='none';
  const pts=d.filter(l=>l.latitude&&l.longitude);
  if(!leafMap){const ctr=pts.length?[pts[0].latitude,pts[0].longitude]:[37.87,32.49];leafMap=L.map('mapv').setView(ctr,12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(leafMap);}
  leafMap.eachLayer(l=>{if(l instanceof L.Marker)leafMap.removeLayer(l);});
  const avg=d.length?d.reduce((x,l)=>x+l.price,0)/d.length:0;
  pts.forEach(l=>{const isLow=l.price<avg*.85;const icon=L.divIcon({className:'',html:`<div style="background:${isLow?'#4CAF82':'#C9A84C'};width:11px;height:11px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`,iconSize:[15,15]});L.marker([l.latitude,l.longitude],{icon}).addTo(leafMap).bindPopup(`<strong>${fp(l.price)} ₺</strong><br><span style="font-size:11px">${l.rooms||''} · ${l.net_size||'?'}m²</span>`).on('click',()=>openDrawer(l));});
  if(pts.length){leafMap.fitBounds(L.latLngBounds(pts.map(l=>[l.latitude,l.longitude])),{padding:[30,30]});setTimeout(()=>leafMap.invalidateSize(),100);}
}
function openDrawer(l){
  gImgs=gi(l);gIdx=0;renderGal();
  document.getElementById('dloc').innerHTML=`<div class="ldot"></div>${[l.quarter,l.district].filter(Boolean).join(' · ')}`;
  document.getElementById('dtitle').textContent=l.title||'İlan';
  document.getElementById('dpr').textContent=fp(l.price)+' ₺';
  const m2p=l.net_size>0?Math.round(l.price/l.net_size):null;
  document.getElementById('dm2p').textContent=m2p?`${fp(m2p)} ₺/m²`:'';
  document.getElementById('dgrid').innerHTML=[['Oda',l.rooms],['m²',l.net_size?l.net_size+'m²':'—'],['Isıtma',l.heating_type||'—'],['Bina Yaşı',l.building_age||'—'],['Kat',l.floor?l.floor+'. kat':'—'],['Toplam Kat',l.total_floors||'—']].map(([k,v])=>`<div class="di"><div class="dil">${k}</div><div class="div">${v||'—'}</div></div>`).join('');
  const fl=Array.isArray(l.features)?l.features:[];
  document.getElementById('dfeats').innerHTML=[['Balkon',l.balcony==='Var'],['Asansör',l.elevator==='Var'],['Otopark',l.parking&&l.parking!=='Yok'],['Site İçi',l.in_complex==='Evet']].map(([n,v])=>`<span class="df ${v?'ok':''}">${v?'✓ ':''} ${n}</span>`).join('');
  document.getElementById('dsel').innerHTML=`<div><div class="sname">${l.storeName||l.sellerName||'Satıcı'}</div><div class="sdet">${l.listing_from||''}</div></div>`;
  document.getElementById('dmap').innerHTML='';
  if(l.latitude&&l.longitude){setTimeout(()=>{if(dMap){dMap.remove();dMap=null;}dMap=L.map('dmap').setView([l.latitude,l.longitude],15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:''}).addTo(dMap);L.marker([l.latitude,l.longitude]).addTo(dMap);dMap.invalidateSize();},350);}
  document.getElementById('dcta').innerHTML=`${l.url?`<a class="ctap" href="${l.url}" target="_blank">İlanı Gör →</a>`:''}<button class="ctas" onclick="closeDrawer()">Kapat</button>`;
  document.getElementById('ov').classList.add('open');document.getElementById('drawer').classList.add('open');document.getElementById('drawer').scrollTop=0;
}
function renderGal(){
  const g=document.getElementById('dgal'),t=document.getElementById('dthumbs');
  if(!gImgs.length){g.innerHTML='<div class="nogal">🏠</div>';t.innerHTML='';return;}
  g.innerHTML=`<img class="gmain" id="gmain" src="${gImgs[gIdx]}" alt=""><button class="gprev" onclick="galN(-1)">‹</button><button class="gnext" onclick="galN(1)">›</button><div class="gctr" id="gctr">${gIdx+1} / ${gImgs.length}</div>`;
  t.innerHTML=gImgs.slice(0,12).map((img,i)=>`<img class="thumb ${i===gIdx?'on':''}" src="${img}" onclick="galTo(${i})" alt="" onerror="this.style.display='none'">`).join('');
}
function galN(dir){gIdx=(gIdx+dir+gImgs.length)%gImgs.length;updGal();}
function galTo(i){gIdx=i;updGal();}
function updGal(){const m=document.getElementById('gmain'),c=document.getElementById('gctr');if(m)m.src=gImgs[gIdx];if(c)c.textContent=`${gIdx+1} / ${gImgs.length}`;document.querySelectorAll('.thumb').forEach((t,i)=>t.classList.toggle('on',i===gIdx));}
function closeDrawer(){document.getElementById('ov').classList.remove('open');document.getElementById('drawer').classList.remove('open');if(dMap){dMap.remove();dMap=null;}}

function bindComparisonEvents(){
  const ov=document.getElementById('ov'),dclose=document.getElementById('dclose'),sbtn=document.getElementById('sbtn'),sort=document.getElementById('sort'),vl=document.getElementById('vl'),vm=document.getElementById('vm');
  if(ov)ov.addEventListener('click',closeDrawer);
  if(dclose)dclose.addEventListener('click',closeDrawer);
  if(sbtn)sbtn.addEventListener('click',()=>{F.min=parseInt(document.getElementById('mnp').value)||null;F.max=parseInt(document.getElementById('mxp').value)||null;load();});
  if(sort)sort.addEventListener('change',()=>{if(all.length)sortRender();});
  const rc=document.getElementById('rc'),hc=document.getElementById('hc');
  if(rc)rc.addEventListener('click',e=>{if(!e.target.matches('.chip'))return;rc.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');F.rooms=e.target.dataset.value;if(all.length)apply();});
  if(hc)hc.addEventListener('click',e=>{if(!e.target.matches('.chip'))return;hc.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');F.heating=e.target.dataset.value;if(all.length)apply();});
  document.querySelectorAll('.panel .tog').forEach(t=>t.addEventListener('click',()=>{t.classList.toggle('on');const f=t.dataset.feat;if(F.features.includes(f))F.features=F.features.filter(x=>x!==f);else F.features.push(f);if(all.length)apply();}));
  if(vl)vl.addEventListener('click',()=>{vl.classList.add('on');if(vm)vm.classList.remove('on');document.getElementById('mapv').style.display='none';document.getElementById('listv').style.display='flex';});
  if(vm)vm.addEventListener('click',()=>{vm.classList.add('on');if(vl)vl.classList.remove('on');if(filtered.length)renderMap(filtered);});
  // Mobile
  const mobFilterBtn=document.getElementById('mob-filter-btn');if(mobFilterBtn)mobFilterBtn.addEventListener('click',openFsheet);
  const fsheetClose=document.getElementById('fsheet-close');if(fsheetClose)fsheetClose.addEventListener('click',closeFsheet);
  const fsheetOv=document.getElementById('fsheet-ov');if(fsheetOv)fsheetOv.addEventListener('click',closeFsheet);
  const fsheetApply=document.getElementById('fsheet-apply');if(fsheetApply)fsheetApply.addEventListener('click',()=>{F.min=parseInt(document.getElementById('mnp-m').value)||null;F.max=parseInt(document.getElementById('mxp-m').value)||null;closeFsheet();load();});
  const mobGoBtn=document.getElementById('mob-go-btn');if(mobGoBtn)mobGoBtn.addEventListener('click',()=>{F.min=parseInt(document.getElementById('mnp-m').value)||null;F.max=parseInt(document.getElementById('mxp-m').value)||null;load();});
  const mnbList=document.getElementById('mnb-list');if(mnbList)mnbList.addEventListener('click',()=>{['mnb-list','mnb-map','mnb-filter'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});mnbList.classList.add('on');if(vl)vl.click();});
  const mnbMap=document.getElementById('mnb-map');if(mnbMap)mnbMap.addEventListener('click',()=>{['mnb-list','mnb-map','mnb-filter'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('on');});mnbMap.classList.add('on');if(vm)vm.click();});
  const mnbFilter=document.getElementById('mnb-filter');if(mnbFilter)mnbFilter.addEventListener('click',openFsheet);
}
function openFsheet(){const f=document.getElementById('fsheet');if(f)f.classList.add('open');document.body.style.overflow='hidden';}
function closeFsheet(){const f=document.getElementById('fsheet');if(f)f.classList.remove('open');document.body.style.overflow='';}
function buildD_m(){const ds=[...new Set(all.map(l=>l.district).filter(Boolean))].sort();const cm=document.getElementById('dc-m');if(!cm)return;cm.innerHTML='<button class="chip on" data-value="">Tümü</button>';ds.forEach(d=>{const b=document.createElement('button');b.className='chip';b.dataset.value=d;b.textContent=d;cm.appendChild(b);});cm.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{cm.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.district=b.dataset.value;F.quarter='';buildQ_m();}));}
function buildQ_m(){const src=F.district?all.filter(l=>l.district===F.district):all;const qs=[...new Set(src.map(l=>l.quarter).filter(Boolean))].sort();const cm=document.getElementById('qc-m');if(!cm)return;cm.innerHTML='<button class="chip on" data-value="">Tümü</button>';qs.forEach(q=>{const b=document.createElement('button');b.className='chip';b.dataset.value=q;b.textContent=q;cm.appendChild(b);});cm.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{cm.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F.quarter=b.dataset.value;}));}

// Değerleme için
const KONYA_MAHALLELER={'Selçuklu':['Yazır Mh.','Sancak Mh.','Şeker Mh.','Beyhekim Mh.','Binkonutlar Mh.','Dumlupınar Mh.','Musalla Bağları Mh.','Bosna Mh.'],'Meram':['Yaka Mh.','Yeni Meram Mh.','Karahüyük Mh.','Aksinne Mh.','Sille Mh.'],'Karatay':['Emirgazi Mh.','Hacı Musa Mh.','Karakurt Mh.']};
function populateValDistricts(){const sel=document.getElementById('v-district');if(!sel)return;const ds=[...new Set(all.map(l=>l.district).filter(Boolean))].sort();const cur=sel.value;sel.innerHTML='<option value="">İlçe seçin...</option>';ds.forEach(d=>{const o=document.createElement('option');o.value=d;o.textContent=d;sel.appendChild(o);});const extra=['Akşehir','Beyşehir','Cihanbeyli','Çumra','Ereğli','Ilgın','Kadınhanı','Kulu','Sarayönü','Seydişehir'];extra.forEach(d=>{if(!ds.includes(d)){const o=document.createElement('option');o.value=d;o.textContent=d;sel.appendChild(o);}});if(cur)sel.value=cur;}
function populateValQuarters(district){const sel=document.getElementById('v-quarter');if(!sel)return;const fromDB=[...new Set(all.filter(l=>l.district===district).map(l=>l.quarter).filter(Boolean))].sort();const fromList=KONYA_MAHALLELER[district]||[];const combined=[...new Set([...fromDB,...fromList])].sort();sel.innerHTML='<option value="">Mahalle seçin (isteğe bağlı)</option>';combined.forEach(q=>{const o=document.createElement('option');o.value=q;o.textContent=q;sel.appendChild(o);});}
async function loadForVal(){try{const r=await fetch(SU+'/rest/v1/listings?select=*',{headers:{'apikey':SK,'Authorization':'Bearer '+SK}});all=await r.json();populateValDistricts();}catch(e){console.warn('Val veri yüklenemedi:',e);}}


// URL'den ?d= parametresi ile gelen ilçeyi seç
function selectDistrictFromURL() {
  const params = new URLSearchParams(location.search);
  const d = params.get('d');
  if (!d || !all.length) return;
  const chip = document.querySelector(`#dc .chip[data-value="${d}"]`);
  if (chip) chip.click();
}
