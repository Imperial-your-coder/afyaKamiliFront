/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — MODULE PHARMACIE v3
   Fix: scroll, responsive, tab visibility, unit selector,
        free prescriptions, default image = trousse.png
═══════════════════════════════════════════════════════════ */

/* ── SETTINGS ── */
const SK = 'afya_pharmacy_settings';
const getSettings = () => {
  const d = { pharmacy_name:'Ma Pharmacie', currency:'USD', currency_symbol:'$',
               invoice_format:'A4', tva_rate:16, tva_enabled:true,
               footer_text:'Merci de votre confiance. Conservez ce reçu.',
               prescription_footer:'Ordonnance valable 3 mois à compter de la date d\'émission.' };
  try { return Object.assign({}, d, JSON.parse(localStorage.getItem(SK)||'{}')); }
  catch { return d; }
};
const saveSettings = s => localStorage.setItem(SK, JSON.stringify(s));
let S = getSettings();

/* ── DEFAULT IMAGE ── */
const DEFAULT_MED_IMG = '../../media/trousse.png';

/* ── UNIT TYPES ── */
const SALE_UNITS = [
  { code:'unite',     label:'Unité',      plural:'Unités',      desc:'comprimé, ampoule…' },
  { code:'plaquette', label:'Plaquette',  plural:'Plaquettes',  desc:'blister de comprimés' },
  { code:'boite',     label:'Boîte',      plural:'Boîtes',      desc:'conditionnement standard' },
  { code:'flacon',    label:'Flacon',     plural:'Flacons',     desc:'sirop, collyre…' },
  { code:'sachet',    label:'Sachet',     plural:'Sachets',     desc:'poudre, granulés' },
  { code:'tube',      label:'Tube',       plural:'Tubes',       desc:'crème, gel' },
  { code:'ampoule',   label:'Ampoule',    plural:'Ampoules',    desc:'injectable unitaire' },
  { code:'perfusion', label:'Flacon perf.',plural:'Flacons perf.',desc:'perfusion IV' },
  { code:'carton',    label:'Carton',     plural:'Cartons',     desc:'vente grossiste' },
];

/* ── MOCK DATA ── */
let MEDICATIONS = [
  { id:1, name:'Amoxicilline', generic:'Amoxicilline trihydrate', code:'MED-001', form:'Comprimé', strength:'500mg', category:'Antibiotiques', price:0.45, stock:240, min_stock:50, expiry:'2026-08-15', location:'Rayonnage A – Étagère 2', requires_prescription:true, is_controlled:false, photo:null, manufacturer:'Pharmafrique', notes:'', pack_size:30, units_per_strip:10, sale_units:['unite','plaquette','boite'] },
  { id:2, name:'Paracétamol', generic:'Acetaminophène', code:'MED-002', form:'Comprimé', strength:'500mg', category:'Analgésiques', price:0.12, stock:18, min_stock:100, expiry:'2025-12-31', location:'Rayonnage B – Étagère 1', requires_prescription:false, is_controlled:false, photo:null, manufacturer:'Sanofi', notes:'', pack_size:16, units_per_strip:8, sale_units:['unite','plaquette','boite'] },
  { id:3, name:'Artemether-Lumefantrine', generic:'Artemether/Lumefantrine', code:'MED-003', form:'Comprimé', strength:'20/120mg', category:'Antipaludéens', price:1.80, stock:0, min_stock:30, expiry:'2026-05-20', location:'Rayonnage A – Étagère 1', requires_prescription:true, is_controlled:false, photo:null, manufacturer:'Novartis', notes:'', pack_size:24, units_per_strip:6, sale_units:['unite','plaquette','boite'] },
  { id:4, name:'Métronidazole', generic:'Métronidazole', code:'MED-004', form:'Comprimé', strength:'250mg', category:'Antibiotiques', price:0.08, stock:450, min_stock:80, expiry:'2027-03-10', location:'Rayonnage B – Étagère 3', requires_prescription:true, is_controlled:false, photo:null, manufacturer:'Pharmafrique', notes:'', pack_size:30, units_per_strip:10, sale_units:['unite','plaquette','boite','carton'] },
  { id:5, name:'Salbutamol', generic:'Salbutamol sulfate', code:'MED-005', form:'Aérosol', strength:'100mcg/dose', category:'Bronchodilatateurs', price:4.20, stock:12, min_stock:20, expiry:'2025-11-30', location:'Rayonnage C – Étagère 2', requires_prescription:true, is_controlled:false, photo:null, manufacturer:'GSK', notes:'', pack_size:null, units_per_strip:null, sale_units:['flacon'] },
  { id:6, name:'Diazépam', generic:'Diazépam', code:'MED-006', form:'Comprimé', strength:'5mg', category:'Psychotropes', price:0.35, stock:60, min_stock:15, expiry:'2026-02-14', location:'Armoire sécurisée – Casier 1', requires_prescription:true, is_controlled:true, photo:null, manufacturer:'Roche', notes:'Stupéfiant – traçabilité obligatoire', pack_size:30, units_per_strip:10, sale_units:['unite','boite'] },
  { id:7, name:'Sérum physiologique NaCl', generic:'Chlorure de sodium', code:'MED-007', form:'Flacon perfusion', strength:'0.9% 500ml', category:'Solutés', price:1.20, stock:95, min_stock:40, expiry:'2026-01-20', location:'Armoire perfusions', requires_prescription:false, is_controlled:false, photo:null, manufacturer:'Baxter', notes:'', pack_size:null, units_per_strip:null, sale_units:['flacon','perfusion','carton'] },
  { id:8, name:'Ibuprofène', generic:'Ibuprofène', code:'MED-008', form:'Comprimé', strength:'400mg', category:'Anti-inflammatoires', price:0.18, stock:320, min_stock:60, expiry:'2027-06-30', location:'Rayonnage A – Étagère 3', requires_prescription:false, is_controlled:false, photo:null, manufacturer:'Pfizer', notes:'', pack_size:24, units_per_strip:8, sale_units:['unite','plaquette','boite'] },
  { id:9, name:'Vitamine C', generic:'Acide ascorbique', code:'MED-009', form:'Comprimé effervescent', strength:'1000mg', category:'Vitamines', price:0.25, stock:5, min_stock:50, expiry:'2025-09-15', location:'Rayonnage C – Étagère 1', requires_prescription:false, is_controlled:false, photo:null, manufacturer:'Bayer', notes:'', pack_size:20, units_per_strip:10, sale_units:['unite','tube','boite'] },
  { id:10, name:'Oméprazole', generic:'Oméprazole', code:'MED-010', form:'Gélule', strength:'20mg', category:'Antiacides', price:0.30, stock:180, min_stock:40, expiry:'2026-11-08', location:'Rayonnage B – Étagère 2', requires_prescription:true, is_controlled:false, photo:null, manufacturer:'AstraZeneca', notes:'', pack_size:28, units_per_strip:14, sale_units:['unite','plaquette','boite'] },
];

let JOURNAL = [
  { id:1, type:'in', desc:'Vente comptoir', ref:'VTE-2026-00042', amount:5.22, method:'Espèces', time:'08:32' },
  { id:2, type:'in', desc:'Vente ordonnance', ref:'VTE-2026-00043', amount:2.78, method:'Mobile money', time:'09:15' },
  { id:3, type:'out', desc:'Achat fournisseur', ref:'BC-2026-0004', amount:430.00, method:'Virement', time:'09:48' },
  { id:4, type:'in', desc:'Vente comptoir', ref:'VTE-2026-00044', amount:3.13, method:'Espèces', time:'10:22' },
];

let ORDERS = [
  { id:1, number:'BC-2026-0001', supplier:'Pharmafrique SARL', status:'received', date:'2026-06-28', amount:845.50, items:8 },
  { id:2, number:'BC-2026-0002', supplier:'MedStock Congo', status:'partial_received', date:'2026-07-01', amount:320.00, items:4 },
  { id:3, number:'BC-2026-0003', supplier:'BioMed International', status:'submitted', date:'2026-07-03', amount:1250.00, items:12 },
];

let FREE_PRESCRIPTIONS = [];

/* ── STATE ── */
let currentMedId = null;
let currentSellUnit = 'boite';
let currentSellQty = 1;
let searchQ = '';
let catFilter = '';
let currentPeriod = 'day';
let editMedId = null;
let rxItems = [];

/* ═══════════════════════════════════════════════
   BRAND ANIMATION
   Afya Kamili 10s → Nom pharmacie 30s → loop
═══════════════════════════════════════════════ */
function initBrand() {
  const afya  = document.getElementById('brandAfya');
  const pharma= document.getElementById('brandPharma');
  if (!afya || !pharma) return;

  let showingPharma = false;

  function cycle() {
    if (!showingPharma) {
      // slide Afya up, slide Pharma in from bottom
      pharma.textContent = S.pharmacy_name || 'Ma Pharmacie';
      afya.classList.add('slide-up');
      pharma.classList.remove('slide-down');
      showingPharma = true;
      setTimeout(cycle, 30000);
    } else {
      // slide Pharma down, slide Afya back
      pharma.classList.add('slide-down');
      afya.classList.remove('slide-up');
      showingPharma = false;
      setTimeout(cycle, 10000);
    }
  }
  setTimeout(cycle, 10000);
}

/* ═══════════════════════════════════════════════
   TAB NAVIGATION — single source of truth
═══════════════════════════════════════════════ */
function switchTab(name) {
  // Close sidebar on mobile after selection
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');

  document.querySelectorAll('.tab[data-tab]').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-section[data-section]').forEach(s =>
    s.classList.toggle('active', s.dataset.section === name));
  try { window.scrollTo(0, 0); } catch(e) {}
  // render each section
  if (name === 'catalog')     renderCatalog();
  if (name === 'stock')       { renderStock(); updateKpis(); }
  if (name === 'accounting')  { renderJournal(); renderChart(); }
  if (name === 'orders')      renderOrders();
  if (name === 'alerts')      renderAlerts();
  if (name === 'settings')    loadSettingsForm();
  if (name === 'prescriptions') renderPrescriptions();
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const stockClass = m => m.stock === 0 ? 'stock-crit' : m.stock < m.min_stock ? 'stock-warn' : 'stock-ok';
const daysUntil  = m => Math.ceil((new Date(m.expiry) - new Date()) / (1000*60*60*24));
const imgOrDefault = m => m.photo ? `<img src="${m.photo}" alt="${m.name}" loading="lazy">` :
  `<img src="${DEFAULT_MED_IMG}" alt="médicament" loading="lazy" style="opacity:0.8">`;
const sym = () => S.currency_symbol || '$';

function unitPrice(m, unitCode) {
  switch (unitCode) {
    case 'unite':
      if (m.pack_size) return m.price / m.pack_size;
      return m.price;
    case 'plaquette':
      if (m.units_per_strip && m.pack_size) return m.price * m.units_per_strip / m.pack_size;
      if (m.units_per_strip) return m.price * m.units_per_strip;
      return m.price;
    case 'boite':    return m.price;
    case 'carton':   return m.price * 12;
    default:         return m.price;
  }
}

function unitLabel(unitCode) {
  const u = SALE_UNITS.find(x => x.code === unitCode);
  return u ? u.label : unitCode;
}

/* ═══════════════════════════════════════════════
   CATALOGUE — CARDS
═══════════════════════════════════════════════ */
function renderCatalog() {
  const grid = document.getElementById('medGrid');
  if (!grid) return;
  const q = searchQ.trim().toLowerCase();
  const filtered = MEDICATIONS.filter(m => {
    const mq = !q || [m.name, m.generic||'', m.code, m.category].some(x => x.toLowerCase().includes(q));
    const mc = !catFilter || m.category === catFilter;
    return mq && mc;
  });
  const cnt = document.getElementById('catCount');
  if (cnt) cnt.textContent = `${filtered.length} article${filtered.length !== 1 ? 's' : ''}`;
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg><div class="empty-title">Aucun résultat</div><div class="empty-sub">Essayez un autre terme ou effacez les filtres.</div></div>`;
    return;
  }
  grid.innerHTML = filtered.map(m => {
    const sc = stockClass(m);
    const d  = daysUntil(m);
    const stl = m.stock === 0 ? 'Épuisé' : m.stock < m.min_stock ? `Bas (${m.stock})` : String(m.stock);
    const tags = [
      m.is_controlled ? `<span class="med-tag tag-controlled">Stupéfiant</span>` : '',
      d < 0 ? `<span class="med-tag tag-expired">Périmé</span>` : d < 60 ? `<span class="med-tag tag-expiring">${d}j</span>` : ''
    ].join('');
    return `<div class="med-card ${sc}" onclick="openMedModal(${m.id})">
      <div class="med-img-wrap">
        <div class="med-img-placeholder">${imgOrDefault(m)}</div>
        ${tags}
      </div>
      <div class="med-card-body">
        <div class="med-card-name">${m.name}</div>
        <div class="med-card-form">${m.form}${m.strength ? ' · '+m.strength : ''}</div>
        <div class="med-card-price">${sym()}${m.price.toFixed(2)} <span class="med-card-currency">/ boîte</span></div>
      </div>
      <div class="med-card-footer">
        <div class="med-stock-pill"><div class="sdot"></div>${stl}</div>
        <div class="med-location">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 1a4 4 0 014 4c0 3.5-4 8-4 8S3 8.5 3 5a4 4 0 014-4z"/><circle cx="7" cy="5" r="1.5"/></svg>
          ${(m.location||'—').split(/[–-]/)[0].trim()}
        </div>
      </div>
    </div>`;
  }).join('');
  updateKpis();
}

function toggleCat(btn, cat) {
  catFilter = catFilter === cat ? '' : cat;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  if (catFilter) btn.classList.add('active');
  renderCatalog();
}

/* ═══════════════════════════════════════════════
   FICHE MÉDICAMENT (MODAL)
═══════════════════════════════════════════════ */
function openMedModal(id) {
  const m = MEDICATIONS.find(x => x.id === id);
  if (!m) return;
  currentMedId = id;
  const sc = stockClass(m);
  const d  = daysUntil(m);
  const cls = sc === 'stock-ok' ? 'ok' : sc === 'stock-warn' ? 'warn' : 'crit';

  document.getElementById('medModalBody').innerHTML = `
    <div class="med-hero">
      <div class="med-hero-img">${imgOrDefault(m)}</div>
      <div style="flex:1">
        <div class="med-hero-name">${m.name}${m.is_controlled?'<span style="font-size:9.5px;background:var(--red);color:#fff;padding:2px 6px;border-radius:999px;margin-left:6px">Stupéfiant</span>':''}</div>
        <div class="med-hero-generic">${[m.generic, m.strength, m.form].filter(Boolean).join(' · ')}</div>
        <div class="med-hero-price">${sym()}${m.price.toFixed(2)}<span style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:500"> / boîte</span></div>
      </div>
    </div>
    <div class="med-info-grid">
      <div class="mi"><div class="mi-lbl">Stock actuel</div><div class="mi-val ${cls}">${m.stock} unités</div></div>
      <div class="mi"><div class="mi-lbl">Seuil minimum</div><div class="mi-val">${m.min_stock}</div></div>
      <div class="mi"><div class="mi-lbl">Péremption</div><div class="mi-val ${d<0?'crit':d<60?'warn':''}">${d<0?'PÉRIMÉ':d<60?`${m.expiry} (${d}j)`:m.expiry}</div></div>
      <div class="mi"><div class="mi-lbl">Catégorie</div><div class="mi-val">${m.category}</div></div>
      <div class="mi" style="grid-column:1/-1"><div class="mi-lbl">Emplacement</div><div class="mi-val">${m.location||'—'}</div></div>
      ${m.pack_size?`<div class="mi"><div class="mi-lbl">Unités/boîte</div><div class="mi-val">${m.pack_size}</div></div>`:''}
      ${m.units_per_strip?`<div class="mi"><div class="mi-lbl">Unités/plaquette</div><div class="mi-val">${m.units_per_strip}</div></div>`:''}
    </div>
    ${m.notes?`<div style="background:var(--orange-bg);border:1px solid rgba(245,158,11,0.2);border-radius:var(--r-sm);padding:9px 12px;font-size:11.5px;color:#92400e;margin-top:4px"><strong>Note :</strong> ${m.notes}</div>`:''}
  `;
  const btn = document.getElementById('medModalSellBtn');
  btn.disabled = m.stock === 0;
  btn.textContent = m.stock === 0 ? 'Stock épuisé' : '💊 Vendre ce médicament';
  btn.style.opacity = m.stock === 0 ? '0.4' : '1';
  openModal('modalMed');
}

/* ═══════════════════════════════════════════════
   VENTE — MODAL AVEC UNITÉ + QTÉ + TOTAL
═══════════════════════════════════════════════ */
function openSellModal() {
  const m = MEDICATIONS.find(x => x.id === currentMedId);
  if (!m || m.stock === 0) return;
  closeModal('modalMed');
  currentSellQty = 1;

  // Unités disponibles pour ce médicament
  const units = (m.sale_units && m.sale_units.length) ? m.sale_units : ['boite'];
  currentSellUnit = units[0];

  // Info médicament
  document.getElementById('sellMedInfo').innerHTML = `
    <div class="sell-med-img">${imgOrDefault(m)}</div>
    <div>
      <div class="sell-med-name">${m.name}</div>
      <div class="sell-med-sub">${m.form}${m.strength?' · '+m.strength:''} · Stock : <strong>${m.stock} boîtes</strong></div>
    </div>`;

  // Sélecteur d'unité
  document.getElementById('unitSelector').innerHTML = units.map(u => {
    const ut = SALE_UNITS.find(x => x.code === u);
    const up = unitPrice(m, u);
    return `<button class="unit-btn${u === currentSellUnit ? ' active' : ''}" onclick="selectUnit('${u}')">${ut?ut.label:u}<br><span style="font-size:10px;font-weight:600;opacity:0.7">${sym()}${up.toFixed(2)}</span></button>`;
  }).join('');

  document.getElementById('sellQtyInput').value = 1;
  updateSellTotal();
  openModal('modalSell');
  setTimeout(() => document.getElementById('sellQtyInput')?.focus(), 150);
}

function selectUnit(code) {
  currentSellUnit = code;
  document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().startsWith(unitLabel(code))));
  // Re-render buttons to highlight correctly
  const m = MEDICATIONS.find(x => x.id === currentMedId);
  if (!m) return;
  const units = m.sale_units || ['boite'];
  document.getElementById('unitSelector').innerHTML = units.map(u => {
    const ut = SALE_UNITS.find(x => x.code === u);
    const up = unitPrice(m, u);
    return `<button class="unit-btn${u === currentSellUnit ? ' active' : ''}" onclick="selectUnit('${u}')">${ut?ut.label:u}<br><span style="font-size:10px;font-weight:600;opacity:0.7">${sym()}${up.toFixed(2)}</span></button>`;
  }).join('');
  updateSellTotal();
}

function updateQty(delta) {
  const input = document.getElementById('sellQtyInput');
  let v = Math.max(1, (parseInt(input.value)||1) + delta);
  input.value = v;
  currentSellQty = v;
  updateSellTotal();
}

function onQtyInput() {
  const v = Math.max(1, parseInt(document.getElementById('sellQtyInput').value)||1);
  currentSellQty = v;
  updateSellTotal();
}

function updateSellTotal() {
  const m = MEDICATIONS.find(x => x.id === currentMedId);
  if (!m) return;
  const up     = unitPrice(m, currentSellUnit);
  const sub    = currentSellQty * up;
  const tva    = S.tva_enabled ? sub * S.tva_rate / 100 : 0;
  const total  = sub + tva;
  const ulabel = unitLabel(currentSellUnit);
  document.getElementById('sellTotal').textContent = `${sym()}${total.toFixed(2)}`;
  document.getElementById('sellBreakdown').textContent =
    `${currentSellQty} ${ulabel}${currentSellQty>1?'s':''} × ${sym()}${up.toFixed(2)}${S.tva_enabled?` + TVA ${S.tva_rate}%`:''}`;
}

function confirmSale() {
  const m = MEDICATIONS.find(x => x.id === currentMedId);
  if (!m) return;
  const method   = document.getElementById('sellPayMethod').value;
  const customer = document.getElementById('sellCustomer').value.trim();
  const up       = unitPrice(m, currentSellUnit);
  const sub      = currentSellQty * up;
  const tva      = S.tva_enabled ? sub * S.tva_rate / 100 : 0;
  const total    = sub + tva;
  const now      = new Date();
  const timeStr  = now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  const dateStr  = now.toLocaleDateString('fr-FR');
  const ref      = 'VTE-'+now.getFullYear()+'-'+String(Math.floor(Math.random()*99999)).padStart(5,'0');
  const ulabel   = unitLabel(currentSellUnit);

  // Décrémenter le stock (en boîtes pour simplifier; en prod = calcul selon unit)
  if (currentSellUnit === 'boite' || currentSellUnit === 'flacon' || currentSellUnit === 'perfusion') {
    m.stock = Math.max(0, m.stock - currentSellQty);
  } else if (currentSellUnit === 'carton') {
    m.stock = Math.max(0, m.stock - currentSellQty * 12);
  } else if (currentSellUnit === 'plaquette' && m.pack_size && m.units_per_strip) {
    const stripsPerBox = m.pack_size / m.units_per_strip;
    const boxesDec = currentSellQty / stripsPerBox;
    m.stock = Math.max(0, m.stock - Math.ceil(boxesDec));
  }
  // unite : on retire 1 boîte tous les pack_size unités (approximatif pour mock)

  JOURNAL.unshift({ id:Date.now(), type:'in', desc:`Vente ${ulabel}${customer?' — '+customer:''}`, ref, amount:total, method, time:timeStr });

  closeModal('modalSell');
  setTimeout(() => showInvoice({ m, qty:currentSellQty, ulabel, up, sub, tva, total, method, customer, ref, dateStr, timeStr }), 200);
  renderCatalog();
  renderAlerts();
  updateKpis();
}

function showInvoice({ m, qty, ulabel, up, sub, tva, total, method, customer, ref, dateStr, timeStr }) {
  document.getElementById('invoiceBody').innerHTML = `
    <div class="inv-preview">
      <div class="inv-hd">
        <div class="inv-pharma">${S.pharmacy_name||'Pharmacie'}</div>
        <div class="inv-meta">Reçu de vente · Format ${S.invoice_format}</div>
      </div>
      <div class="inv-row"><span>N° Reçu</span><strong>${ref}</strong></div>
      <div class="inv-row"><span>Date</span><span>${dateStr} à ${timeStr}</span></div>
      ${customer?`<div class="inv-row"><span>Client</span><span>${customer}</span></div>`:''}
      <div class="inv-row"><span>Paiement</span><span>${method}</span></div>
      <div style="font-weight:700;margin:10px 0 5px">Détail</div>
      <div class="inv-row"><span>${m.name} ${m.strength||''} × ${qty} ${ulabel}${qty>1?'s':''}</span><span>${S.currency_symbol}${sub.toFixed(2)}</span></div>
      ${tva>0?`<div class="inv-row"><span>TVA (${S.tva_rate}%)</span><span>${S.currency_symbol}${tva.toFixed(2)}</span></div>`:''}
      <div class="inv-row total"><span>TOTAL</span><span>${S.currency_symbol}${total.toFixed(2)}</span></div>
      <div class="inv-ft">${S.footer_text}</div>
    </div>`;
  openModal('modalInvoice');
  showToast('Vente enregistrée', 'success');
}

function printInvoice() {
  const c = document.getElementById('invoiceBody').innerHTML;
  const w = window.open('','_blank','width=600,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture</title><style>
    body{font-family:sans-serif;padding:20px;font-size:13px;line-height:1.7;max-width:400px;margin:auto;}
    .inv-hd{text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px;}
    .inv-pharma{font-size:18px;font-weight:800;}
    .inv-meta{font-size:11px;color:#666;}
    .inv-row{display:flex;justify-content:space-between;padding:3px 0;}
    .inv-row.total{border-top:1px solid #ccc;margin-top:5px;padding-top:7px;font-weight:800;font-size:14px;}
    .inv-ft{text-align:center;margin-top:14px;padding-top:10px;border-top:1px solid #eee;font-size:11px;color:#888;}
  </style></head><body>${c}<script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}

/* ═══════════════════════════════════════════════
   ORDONNANCE LIBRE
═══════════════════════════════════════════════ */
let rxItemCount = 0;

function openFreePrescription() {
  rxItems = [];
  rxItemCount = 0;
  document.getElementById('rxPatient').value = '';
  document.getElementById('rxPrescriber').value = '';
  document.getElementById('rxItemsContainer').innerHTML = '';
  addRxItem();
  openModal('modalRx');
}

function addRxItem() {
  rxItemCount++;
  const n = rxItemCount;
  const container = document.getElementById('rxItemsContainer');
  const div = document.createElement('div');
  div.className = 'rx-item';
  div.id = `rxItem${n}`;
  div.innerHTML = `
    <div class="rx-item-num">Médicament ${n}</div>
    <button class="rx-remove" onclick="removeRxItem(${n})" title="Supprimer">×</button>
    <div class="field-row">
      <div class="field"><label class="field-lbl">Nom du médicament *</label><input class="ph-input" id="rxName${n}" placeholder="Ex : Amoxicilline 500mg"></div>
      <div class="field"><label class="field-lbl">Forme / Dosage</label><input class="ph-input" id="rxStrength${n}" placeholder="Ex : comprimé 500mg"></div>
    </div>
    <div class="field"><label class="field-lbl">Posologie *</label><input class="ph-input" id="rxDosage${n}" placeholder="Ex : 1 comprimé matin et soir pendant 7 jours"></div>
    <div class="field-row">
      <div class="field"><label class="field-lbl">Quantité</label><input class="ph-input" id="rxQty${n}" placeholder="Ex : 30 comprimés, 2 boîtes"></div>
      <div class="field"><label class="field-lbl">Durée</label><input class="ph-input" id="rxDuration${n}" placeholder="Ex : 7 jours"></div>
    </div>`;
  container.appendChild(div);
}

function removeRxItem(n) {
  const el = document.getElementById(`rxItem${n}`);
  if (el) el.remove();
}

function previewRx() {
  const patient    = document.getElementById('rxPatient').value.trim();
  const prescriber = document.getElementById('rxPrescriber').value.trim();
  const now        = new Date();
  const dateStr    = now.toLocaleDateString('fr-FR');

  const items = [];
  document.querySelectorAll('.rx-item').forEach((el, idx) => {
    const n = el.id.replace('rxItem','');
    const name    = document.getElementById(`rxName${n}`)?.value.trim();
    const strength= document.getElementById(`rxStrength${n}`)?.value.trim();
    const dosage  = document.getElementById(`rxDosage${n}`)?.value.trim();
    const qty     = document.getElementById(`rxQty${n}`)?.value.trim();
    const dur     = document.getElementById(`rxDuration${n}`)?.value.trim();
    if (name) items.push({ num:idx+1, name, strength, dosage, qty, dur });
  });

  if (!items.length) { showToast('Ajoutez au moins un médicament', 'error'); return; }

  document.getElementById('rxPreviewBody').innerHTML = `
    <div class="rx-preview">
      <div class="rx-preview-hd">
        <div class="rx-preview-title">ORDONNANCE MÉDICALE</div>
        <div class="rx-preview-pharma">${S.pharmacy_name||'Pharmacie'}</div>
        <div style="font-size:11px;color:var(--mid)">Date : ${dateStr}</div>
      </div>
      ${patient?`<div style="margin-bottom:12px;font-size:12px"><strong>Patient :</strong> ${patient}</div>`:''}
      ${prescriber?`<div style="margin-bottom:12px;font-size:12px"><strong>Prescripteur :</strong> ${prescriber}</div>`:''}
      <div style="font-weight:800;font-size:12.5px;margin-bottom:10px;border-bottom:1px solid var(--border);padding-bottom:6px">Prescriptions</div>
      ${items.map(item => `
        <div class="rx-item-line">
          <div class="rx-item-num-badge">${item.num}</div>
          <div class="rx-item-content">
            <div class="rx-item-med-name">${item.name}${item.strength?' – '+item.strength:''}</div>
            <div class="rx-item-dosage">${item.dosage}${item.qty?' · '+item.qty:''}${item.dur?' · '+item.dur:''}</div>
          </div>
        </div>`).join('')}
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--mid)">${S.prescription_footer||''}</div>
    </div>`;
  closeModal('modalRx');
  openModal('modalRxPreview');
}

function printRx() {
  const c = document.getElementById('rxPreviewBody').innerHTML;
  const w = window.open('','_blank','width=700,height:900');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ordonnance</title><style>
    body{font-family:sans-serif;padding:28px;font-size:13px;line-height:1.8;max-width:480px;margin:auto;}
    .rx-preview-hd{text-align:center;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:16px;}
    .rx-preview-title{font-size:20px;font-weight:800;letter-spacing:1px;}
    .rx-preview-pharma{font-size:13px;color:#666;}
    .rx-item-line{display:flex;gap:10px;padding:7px 0;border-bottom:1px dashed #ddd;}
    .rx-item-num-badge{width:20px;height:20px;border-radius:50%;background:#111;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
    .rx-item-med-name{font-size:13px;font-weight:800;}
    .rx-item-dosage{font-size:12px;color:#555;}
  </style></head><body>${c}<script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}

function renderPrescriptions() {
  const list = document.getElementById('rxList');
  if (!list) return;
  if (!FREE_PRESCRIPTIONS.length) {
    list.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><div class="empty-title">Aucune ordonnance créée</div><div class="empty-sub">Créez une ordonnance libre pour un médicament non disponible en stock.</div></div>`;
    return;
  }
  // simplified list
  list.innerHTML = FREE_PRESCRIPTIONS.map(rx => `
    <div class="order-item">
      <div class="order-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12H8M12 16H8M10 8H8"/></svg></div>
      <div class="order-info"><div class="order-num">${rx.number}</div><div class="order-sup">${rx.patient_name||'Patient anonyme'} · ${rx.items_count} article${rx.items_count>1?'s':''}</div></div>
      <span class="pill pill-blue">${rx.status}</span>
      <div class="order-right"><div class="order-date">${rx.created_at}</div></div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════
   AJOUTER / MODIFIER MÉDICAMENT
═══════════════════════════════════════════════ */
function openAddMed(id = null) {
  editMedId = id;
  const m = id ? MEDICATIONS.find(x => x.id === id) : null;
  document.getElementById('addMedTitle').textContent = m ? `Modifier — ${m.name}` : 'Nouveau médicament';
  const pw = document.getElementById('photoWrap');
  const pi = document.getElementById('photoPreviewImg');
  pw.classList.remove('has-photo');
  pi.style.display = 'none';
  pi.src = '';
  document.getElementById('photoInput').value = '';

  const sv = (id, v) => { const el=document.getElementById(id); if(el) el.value = v ?? ''; };
  if (m) {
    sv('addName', m.name); sv('addGeneric', m.generic||'');
    sv('addForm', m.form); sv('addStrength', m.strength||'');
    sv('addCategory', m.category); sv('addPrice', m.price);
    sv('addStock', m.stock); sv('addMinStock', m.min_stock);
    sv('addExpiry', m.expiry); sv('addLocation', m.location||'');
    sv('addManufacturer', m.manufacturer||''); sv('addNotes', m.notes||'');
    sv('addPackSize', m.pack_size||''); sv('addUnitsPerStrip', m.units_per_strip||'');
    setTgl('tglPrescription', m.requires_prescription);
    setTgl('tglControlled', m.is_controlled);
    if (m.photo) { pi.src = m.photo; pi.style.display='block'; pw.classList.add('has-photo'); }
    // sale_units checkboxes
    document.querySelectorAll('.sale-unit-cb').forEach(cb => {
      cb.checked = (m.sale_units||['boite']).includes(cb.value);
    });
  } else {
    ['addName','addGeneric','addForm','addStrength','addCategory','addPrice','addStock','addMinStock','addExpiry','addLocation','addManufacturer','addNotes','addPackSize','addUnitsPerStrip'].forEach(id => sv(id,''));
    sv('addMinStock', 10);
    setTgl('tglPrescription', true); setTgl('tglControlled', false);
    document.querySelectorAll('.sale-unit-cb').forEach(cb => { cb.checked = cb.value === 'boite'; });
  }
  openModal('modalAddMed');
}

function setTgl(id, on) { const el=document.getElementById(id); if(el) el.classList.toggle('on', on); }
function tglBtn(el) { el.classList.toggle('on'); }

function handlePhoto(input) {
  const f = input.files[0];
  if (!f) return;
  if (f.size > 3*1024*1024) { showToast('Photo max 3 Mo', 'error'); input.value=''; return; }
  const r = new FileReader();
  r.onload = e => {
    const pi = document.getElementById('photoPreviewImg');
    pi.src = e.target.result; pi.style.display = 'block';
    document.getElementById('photoWrap').classList.add('has-photo');
  };
  r.readAsDataURL(f);
}

function removePhoto() {
  document.getElementById('photoInput').value='';
  const pi = document.getElementById('photoPreviewImg');
  pi.style.display='none'; pi.src='';
  document.getElementById('photoWrap').classList.remove('has-photo');
}

function saveMed() {
  const name  = document.getElementById('addName').value.trim();
  const price = parseFloat(document.getElementById('addPrice').value);
  if (!name)  { showToast('Le nom est requis', 'error'); return; }
  if (!price || price <= 0) { showToast('Le prix est requis', 'error'); return; }
  const pi = document.getElementById('photoPreviewImg');
  const photo = document.getElementById('photoWrap').classList.contains('has-photo') ? pi.src : null;
  const saleUnits = [...document.querySelectorAll('.sale-unit-cb:checked')].map(cb => cb.value);
  const data = {
    name, photo,
    generic:  document.getElementById('addGeneric').value.trim()||null,
    form:     document.getElementById('addForm').value,
    strength: document.getElementById('addStrength').value.trim(),
    category: document.getElementById('addCategory').value,
    price, stock: parseInt(document.getElementById('addStock').value)||0,
    min_stock: parseInt(document.getElementById('addMinStock').value)||10,
    expiry:   document.getElementById('addExpiry').value,
    location: document.getElementById('addLocation').value.trim(),
    manufacturer: document.getElementById('addManufacturer').value.trim()||null,
    notes:    document.getElementById('addNotes').value.trim(),
    pack_size: parseInt(document.getElementById('addPackSize').value)||null,
    units_per_strip: parseInt(document.getElementById('addUnitsPerStrip').value)||null,
    sale_units: saleUnits.length ? saleUnits : ['boite'],
    requires_prescription: document.getElementById('tglPrescription').classList.contains('on'),
    is_controlled: document.getElementById('tglControlled').classList.contains('on'),
  };
  if (editMedId) {
    const i = MEDICATIONS.findIndex(x => x.id === editMedId);
    if (i > -1) { data.id = editMedId; data.code = MEDICATIONS[i].code; MEDICATIONS[i] = {...MEDICATIONS[i], ...data}; }
    showToast('Médicament modifié', 'success');
  } else {
    data.id   = Date.now();
    data.code = 'MED-'+String(data.id).slice(-5);
    MEDICATIONS.push(data);
    showToast('Médicament ajouté', 'success');
  }
  closeModal('modalAddMed');
  renderCatalog(); renderAlerts(); updateKpis();
}

function deleteMed(id) {
  if (!confirm('Supprimer ce médicament ?')) return;
  MEDICATIONS = MEDICATIONS.filter(m => m.id !== id);
  closeModal('modalMed');
  showToast('Médicament supprimé');
  renderCatalog(); renderAlerts(); updateKpis();
}

/* ═══════════════════════════════════════════════
   STOCK
═══════════════════════════════════════════════ */
function renderStock() {
  const g = document.getElementById('stockGrid');
  if (!g) return;
  g.innerHTML = MEDICATIONS.map(m => {
    const sc  = stockClass(m);
    const pct = Math.min(100, Math.round(m.stock / (m.min_stock * 3) * 100));
    const d   = daysUntil(m);
    const color = sc === 'stock-ok' ? 'var(--green)' : sc === 'stock-warn' ? 'var(--orange)' : 'var(--red)';
    return `<div class="med-card ${sc}" onclick="openMedModal(${m.id})">
      <div class="med-img-wrap" style="aspect-ratio:auto;height:48px">
        <div class="med-img-placeholder">${imgOrDefault(m)}</div>
      </div>
      <div class="med-card-body" style="padding:9px 10px">
        <div class="med-card-name" style="font-size:11.5px">${m.name}</div>
        <div class="med-card-form">${m.form} ${m.strength||''}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:5px">
          <div style="flex:1;height:4px;background:var(--light);border-radius:999px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:999px"></div>
          </div>
          <span style="font-size:12px;font-weight:800;color:${color}">${m.stock}</span>
        </div>
        <div style="font-size:10px;color:var(--mid);margin-top:2px">min. ${m.min_stock}${d<60?` · <span style="color:${d<0?'var(--red)':'var(--orange)'};font-weight:700">${d<0?'PÉRIMÉ':d+'j'}</span>`:''}</div>
      </div>
    </div>`;
  }).join('');
}

function updateKpis() {
  const ok   = MEDICATIONS.filter(m => m.stock >= m.min_stock).length;
  const warn = MEDICATIONS.filter(m => m.stock > 0 && m.stock < m.min_stock).length;
  const crit = MEDICATIONS.filter(m => m.stock === 0).length;
  const exp  = MEDICATIONS.filter(m => { const d=daysUntil(m); return d>=0&&d<60; }).length;
  ['kpiOk','kpiWarn','kpiCrit'].forEach((id,i) => { const e=document.getElementById(id); if(e) e.textContent=[ok,warn,crit][i]; });
  ['kpiOkC','kpiWarnC','kpiCritC','kpiExpC'].forEach((id,i) => { const e=document.getElementById(id); if(e) e.textContent=[ok,warn,crit,exp][i]; });
  const badge = document.getElementById('alertBadge');
  if (badge) badge.textContent = warn + crit;
  const total = document.getElementById('kpiTotal');
  if (total) total.textContent = MEDICATIONS.length;
}

/* ═══════════════════════════════════════════════
   AJUSTEMENT
═══════════════════════════════════════════════ */
function openAjust() {
  const sel = document.getElementById('ajustMedSel');
  if (sel) sel.innerHTML = '<option value="">Sélectionner…</option>' +
    MEDICATIONS.map(m => `<option value="${m.id}">${m.name} (${m.stock})</option>`).join('');
  openModal('modalAjust');
}
function saveAjust() {
  const id  = parseInt(document.getElementById('ajustMedSel').value);
  const typ = document.getElementById('ajustType').value;
  const qty = parseInt(document.getElementById('ajustQty').value)||0;
  if (!id || qty<=0) { showToast('Renseignez tous les champs', 'error'); return; }
  const m = MEDICATIONS.find(x => x.id === id);
  if (!m) return;
  if (typ==='up')   m.stock += qty;
  if (typ==='down') m.stock = Math.max(0, m.stock - qty);
  if (typ==='set')  m.stock = qty;
  showToast('Ajustement enregistré', 'success');
  closeModal('modalAjust');
  renderCatalog(); renderStock(); updateKpis(); renderAlerts();
}

/* ═══════════════════════════════════════════════
   ALERTS
═══════════════════════════════════════════════ */
function renderAlerts() {
  const list = document.getElementById('alertList');
  if (!list) return;
  const crits = MEDICATIONS.filter(m => m.stock === 0);
  const warns  = MEDICATIONS.filter(m => m.stock > 0 && m.stock < m.min_stock);
  const exp    = MEDICATIONS.filter(m => { const d=daysUntil(m); return d<0; });
  const expiring=MEDICATIONS.filter(m => { const d=daysUntil(m); return d>=0&&d<60; });
  if (!crits.length && !warns.length && !exp.length && !expiring.length) {
    list.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><div class="empty-title">Tout est en ordre</div><div class="empty-sub">Aucune alerte active.</div></div>`;
    return;
  }
  const items = [
    ...exp.map(m => ({ m, cls:'crit', title:`Médicament périmé — ${m.name}`, sub:`Périmé depuis le ${m.expiry}` })),
    ...crits.map(m => ({ m, cls:'crit', title:`Rupture de stock — ${m.name}`, sub:`Épuisé · Seuil min. ${m.min_stock}` })),
    ...warns.map(m => ({ m, cls:'warn', title:`Stock bas — ${m.name}`, sub:`${m.stock} unités · Seuil min. ${m.min_stock}` })),
    ...expiring.map(m => ({ m, cls:'warn', title:`Péremption imminente — ${m.name}`, sub:`Expire le ${m.expiry} · dans ${daysUntil(m)} jours` })),
  ];
  list.innerHTML = items.map(({ m, cls, title, sub }) => `
    <div class="alert-item ${cls}" onclick="openMedModal(${m.id})">
      <div class="ai-icon ${cls}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 2l5.5 9.5H2.5L8 2z"/><path d="M8 6.5v3M8 11h.01"/></svg></div>
      <div class="ai-text"><div class="ai-title">${title}</div><div class="ai-sub">${sub}</div></div>
      <div class="ai-cta">→</div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════
   ORDERS
═══════════════════════════════════════════════ */
function renderOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;
  const sm = { draft:{l:'Brouillon',c:'pill-gray'}, submitted:{l:'Envoyée',c:'pill-blue'}, confirmed:{l:'Confirmée',c:'pill-green'}, partial_received:{l:'Partiel',c:'pill-orange'}, received:{l:'Reçue',c:'pill-green'}, cancelled:{l:'Annulée',c:'pill-red'} };
  list.innerHTML = ORDERS.map(o => {
    const s = sm[o.status]||{l:o.status,c:'pill-gray'};
    return `<div class="order-item">
      <div class="order-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3h14l-1.8 11H4.8L3 3z"/><circle cx="8" cy="18" r="1.5"/><circle cx="14" cy="18" r="1.5"/></svg></div>
      <div class="order-info"><div class="order-num">${o.number}</div><div class="order-sup">${o.supplier} · ${o.items} articles</div></div>
      <span class="pill ${s.c}">${s.l}</span>
      <div class="order-right"><div class="order-amount">${sym()}${o.amount.toFixed(2)}</div><div class="order-date">${o.date}</div></div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   ACCOUNTING
═══════════════════════════════════════════════ */
function setPeriod(p) {
  currentPeriod = p;
  document.querySelectorAll('.period-tab').forEach(t => t.classList.toggle('active', t.dataset.period === p));
  renderJournal(); renderChart();
}

/* ── Journal filter state ── */
let journalFilter = 'all'; // 'all' | 'in' | 'out'

function setJournalFilter(f) {
  journalFilter = f;
  document.querySelectorAll('.jf-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  renderJournal();
}

function renderJournal() {
  const wrap = document.getElementById('journalRows');
  if (!wrap) return;
  const s = sym();

  // Always compute from ALL journal entries for KPIs
  const tin  = JOURNAL.filter(j => j.type==='in').reduce((a,j) => a+j.amount, 0);
  const tout = JOURNAL.filter(j => j.type==='out').reduce((a,j) => a+j.amount, 0);
  const net  = tin - tout;

  const set = (id, v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  set('acctIn',  s+tin.toFixed(2));
  set('acctOut', s+tout.toFixed(2));
  set('acctNet', s+net.toFixed(2));
  const ne = document.getElementById('acctNet');
  if (ne) ne.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';

  // Filter for display
  const filtered = journalFilter === 'all'
    ? JOURNAL
    : JOURNAL.filter(j => j.type === journalFilter);

  if (filtered.length === 0) {
    wrap.innerHTML = `<div class="empty" style="padding:24px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 13h6M9 17h4"/></svg><div class="empty-title">Aucune écriture</div></div>`;
    return;
  }

  wrap.innerHTML = filtered.map(j => `
    <div class="jrow">
      <div class="jdir ${j.type}">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          ${j.type==='in' ? '<path d="M7 10V3M4 6.5L7 3l3 3.5"/>' : '<path d="M7 4v7M4 8l3 3 3-3"/>'}
        </svg>
      </div>
      <div class="jinfo">
        <div class="jdesc">${j.desc}</div>
        <div class="jref">${j.ref} · ${j.method}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="jamount ${j.type}">${j.type==='in' ? '+' : '−'}${s}${j.amount.toFixed(2)}</div>
        <div class="jtime">${j.time}</div>
      </div>
    </div>`).join('');
}

/* ── Add expense (Dépenser) ── */
function openExpenseModal() {
  const el = document.getElementById('expenseAmount');
  const em = document.getElementById('expenseMotif');
  if (el) el.value = '';
  if (em) em.value = '';
  openModal('modalExpense');
  setTimeout(() => el?.focus(), 150);
}

function confirmExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const motif  = document.getElementById('expenseMotif').value.trim();
  const method = document.getElementById('expenseMethod').value;
  if (!amount || amount <= 0) { showToast('Saisissez un montant valide', 'error'); return; }
  if (!motif) { showToast('Le motif est requis', 'error'); return; }
  const now    = new Date();
  const time   = now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  const ref    = 'DEP-'+now.getFullYear()+'-'+String(Math.floor(Math.random()*99999)).padStart(5,'0');
  JOURNAL.unshift({ id:Date.now(), type:'out', desc:motif, ref, amount, method, time });
  closeModal('modalExpense');
  showToast(`Dépense de ${sym()}${amount.toFixed(2)} enregistrée`, 'success');
  renderJournal();
}

function renderChart() {
  const chart = document.getElementById('acctChart');
  if (!chart) return;
  const data = {
    day:  [{l:'L',i:85,e:30},{l:'Ma',i:120,e:45},{l:'Me',i:98,e:20},{l:'J',i:145,e:60},{l:'V',i:200,e:80},{l:'Auj',i:178,e:430}],
    week: [{l:'S-4',i:820,e:310},{l:'S-3',i:940,e:280},{l:'S-2',i:1100,e:420},{l:'S-1',i:890,e:300},{l:'Sem',i:178,e:430}],
    month:[{l:'Mar',i:3600,e:1400},{l:'Avr',i:3100,e:1100},{l:'Mai',i:3900,e:1300},{l:'Jun',i:3400,e:1200},{l:'Jul',i:178,e:430}],
    year: [{l:'2023',i:45000,e:24000},{l:'2024',i:48000,e:25000},{l:'2025',i:52000,e:27000},{l:'2026',i:178,e:430}],
  };
  const d = data[currentPeriod]||data.day;
  const mx = Math.max(...d.map(x => Math.max(x.i,x.e)),1);
  chart.innerHTML = d.map(x => `<div class="bar-col">
    <div style="display:flex;align-items:flex-end;gap:2px;height:88px">
      <div class="bar-fill bar-income" style="height:${Math.round(x.i/mx*85)}px;flex:1"></div>
      <div class="bar-fill bar-expense" style="height:${Math.round(x.e/mx*85)}px;flex:1"></div>
    </div>
    <div class="bar-lbl">${x.l}</div>
  </div>`).join('');
}

/* ═══════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════ */
function loadSettingsForm() {
  const sv = (id, v) => { const e=document.getElementById(id); if(e) e.value=v; };
  sv('setPharmacyName', S.pharmacy_name);
  sv('setCurrency', S.currency);
  sv('setCurrencySymbol', S.currency_symbol);
  sv('setTvaRate', S.tva_rate);
  sv('setInvoiceFormat', S.invoice_format);
  sv('setFooter', S.footer_text);
  sv('setRxFooter', S.prescription_footer);
  setTgl('setTvaEnabled', S.tva_enabled);
}

function saveSettingsForm() {
  S.pharmacy_name      = document.getElementById('setPharmacyName').value.trim()||'Ma Pharmacie';
  S.currency           = document.getElementById('setCurrency').value;
  S.currency_symbol    = document.getElementById('setCurrencySymbol').value.trim()||'$';
  S.tva_rate           = parseFloat(document.getElementById('setTvaRate').value)||16;
  S.invoice_format     = document.getElementById('setInvoiceFormat').value;
  S.footer_text        = document.getElementById('setFooter').value.trim();
  S.prescription_footer= document.getElementById('setRxFooter').value.trim();
  S.tva_enabled        = document.getElementById('setTvaEnabled').classList.contains('on');
  saveSettings(S);
  const ph = document.getElementById('brandPharma');
  if (ph) ph.textContent = S.pharmacy_name;
  showToast('Paramètres enregistrés', 'success');
  renderCatalog();
}

/* ═══════════════════════════════════════════════
   MODAL / TOAST UTILS
═══════════════════════════════════════════════ */
function openModal(id) {
  const ov = document.getElementById(id);
  if (!ov) return;
  ov.classList.add('open');
  // Don't lock body scroll — let the modal scroll internally
}
function closeModal(id) {
  const ov = document.getElementById(id);
  if (ov) ov.classList.remove('open');
}

let _tt;
function showToast(msg, type='') {
  const t = document.getElementById('globalToast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type?' '+type:'');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  S = getSettings();
  initBrand();
  // Render catalog immediately — don't wait for switchTab
  renderCatalog();
  updateKpis();
  renderAlerts();
  // Activate catalog tab visually
  document.querySelectorAll('.tab[data-tab]').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === 'catalog'));
  document.querySelectorAll('.tab-section[data-section]').forEach(s =>
    s.classList.toggle('active', s.dataset.section === 'catalog'));
  // close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
  });
});