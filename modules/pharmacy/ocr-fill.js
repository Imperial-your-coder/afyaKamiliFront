/* ═══════════════════════════════════════════════════════════════
   REMPLISSAGE PAR PHOTOS
   1. Chaque photo est nettoyée dans le navigateur : fond retiré,
      recadrée sur le produit, posée sur fond blanc.
   2. Les photos nettoyées partent au serveur, qui identifie le produit
      et le cherche sur internet (/pharmacy/medications/identify).
   3. Seuls les champs VIDES sont remplis, et uniquement avec ce que
      l'identification a confirmé. Prix et stock ne sont jamais touchés.
   Si le serveur est injoignable, une lecture OCR locale prend le relais.
   La photo avant nettoyée devient la photo du produit si aucune n'est mise.
═══════════════════════════════════════════════════════════════ */
(function () {
  const OCR_LIB = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
  const BG_LIB  = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
  const BG_TIMEOUT = 30000;   // au-delà, on garde la photo d'origine
  const $ = id => document.getElementById(id);
  const say = (m, t) => (window.toast || window.showToast)(m, t);
  const SLOTS = [['front', 'Avant'], ['back', 'Arrière'], ['side1', 'Côté'], ['side2', 'Côté']];
  let photos = {}, pending = 0, runId = 0, timer = null, bgLib = null;

  const css = `
  .ocr-box{margin:0 0 14px;padding:12px;border-radius:16px;background:var(--card,#F8F8F3);border:1.5px solid var(--light,#D8D8D0)}
  .ocr-hd{display:flex;flex-direction:column;gap:1px;font-size:12.5px;font-weight:800;margin-bottom:10px}
  .ocr-hd small{font-weight:600;color:var(--mid,#8B8D86);font-size:11px}
  .ocr-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .ocr-slot{position:relative;aspect-ratio:1;border-radius:14px;border:1.5px dashed var(--light,#D8D8D0);background:var(--white,#fff);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;overflow:hidden;
    font:700 10.5px Manrope,sans-serif;color:var(--mid,#8B8D86)}
  .ocr-slot svg{width:20px;height:20px;color:var(--ink,#111)}
  .ocr-slot.opt{opacity:.7}
  .ocr-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#fff}
  .ocr-slot.busy::after{content:"";position:absolute;inset:0;background:rgba(17,17,17,.45) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='%23EFFF3A' stroke-width='3' stroke-dasharray='40 20'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='.8s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E") center/26px no-repeat}
  .ocr-slot.ok::before{content:"✓";position:absolute;z-index:2;top:5px;right:5px;width:18px;height:18px;border-radius:50%;
    background:var(--accent,#EFFF3A);color:#111;font-size:11px;display:flex;align-items:center;justify-content:center}
  .ocr-status{margin-top:10px;font-size:11.5px;font-weight:600;color:var(--mid,#8B8D86);line-height:1.45}
  .ocr-status:empty{display:none}
  .ocr-status b{color:var(--ink,#111)}
  .ocr-status a{color:inherit;text-decoration:underline;word-break:break-all}
  .ocr-filled{box-shadow:0 0 0 2px rgba(239,255,58,.95);border-radius:12px}`;

  function build() {
    const body = document.querySelector('#modalAddMed .modal-body');
    if (!body || $('ocrBox')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const box = document.createElement('div'); box.className = 'ocr-box'; box.id = 'ocrBox';
    box.innerHTML = `<div class="ocr-hd">Remplir avec des photos <small>Avant et arrière ; côtés si besoin. Le produit est recherché sur internet.</small></div>
      <div class="ocr-slots">${SLOTS.map(([k, l], i) => `
        <label class="ocr-slot ${i > 1 ? 'opt' : ''}" id="ocr_${k}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
          ${l}<input type="file" accept="image/*" capture="environment" hidden data-k="${k}">
        </label>`).join('')}</div>
      <div class="ocr-status" id="ocrStatus"></div>`;
    const ident = [...body.querySelectorAll('.sec-divider')].find(d => /Identification/.test(d.textContent));
    body.insertBefore(box, ident || body.firstChild);
    box.querySelectorAll('input[type=file]').forEach(inp => inp.addEventListener('change', () => {
      const f = inp.files[0]; inp.value = ''; if (f) handle(inp.dataset.k, f);
    }));
  }

  function status(html) { const s = $('ocrStatus'); if (s) s.innerHTML = html || ''; }

  function reset() {
    photos = {}; pending = 0; runId++; clearTimeout(timer); status('');
    document.querySelectorAll('.ocr-filled').forEach(e => e.classList.remove('ocr-filled'));
    SLOTS.forEach(([k]) => {
      const s = $('ocr_' + k); if (!s) return;
      s.classList.remove('busy', 'ok'); s.querySelector('img')?.remove();
    });
  }

  /* ── Nettoyage de l'image ── */
  const loadImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });

  async function removeBg(file) {
    bgLib ||= import(BG_LIB).catch(e => { bgLib = null; throw e; });
    const lib = await bgLib;
    const run = lib.removeBackground(file, { model: 'isnet_quint8', output: { format: 'image/png' } });
    const late = new Promise((_, ko) => setTimeout(() => ko(new Error('délai dépassé')), BG_TIMEOUT));
    return Promise.race([run, late]);
  }

  // Recadre sur la zone non transparente, pose sur fond blanc, réduit à `max` px
  function cropOnWhite(img, max = 1024) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let i = 0; i < w; i += 2) {
      if (d[(y * w + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0 || (x1 - x0) * (y1 - y0) < w * h * 0.03) return null;   // rien de sérieux détecté
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w, x1 + pad); y1 = Math.min(h, y1 + pad);
    const cw = x1 - x0, ch = y1 - y0, k = Math.min(1, max / Math.max(cw, ch));
    const o = document.createElement('canvas'); o.width = Math.round(cw * k); o.height = Math.round(ch * k);
    const ox = o.getContext('2d'); ox.fillStyle = '#fff'; ox.fillRect(0, 0, o.width, o.height);
    ox.drawImage(c, x0, y0, cw, ch, 0, 0, o.width, o.height);
    return o;
  }

  function plain(img, max = 1024) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const o = document.createElement('canvas'); o.width = Math.round(img.naturalWidth * k); o.height = Math.round(img.naturalHeight * k);
    o.getContext('2d').drawImage(img, 0, 0, o.width, o.height); return o;
  }

  async function clean(file) {
    try {
      const blob = await removeBg(file);
      const url = URL.createObjectURL(blob);
      const out = cropOnWhite(await loadImg(url)); URL.revokeObjectURL(url);
      if (out) return { canvas: out, cleaned: true };
    } catch (e) { console.warn('Fond non retiré :', e.message || e); }
    const url = URL.createObjectURL(file);
    const out = plain(await loadImg(url)); URL.revokeObjectURL(url);
    return { canvas: out, cleaned: false };
  }

  const toBlob = c => new Promise(r => c.toBlob(r, 'image/jpeg', 0.88));

  async function handle(k, file) {
    const slot = $('ocr_' + k), my = runId;
    slot.querySelector('img')?.remove();
    const im = document.createElement('img'); im.src = URL.createObjectURL(file); slot.prepend(im);
    slot.classList.remove('ok'); slot.classList.add('busy'); pending++;
    status('Nettoyage de la photo…');
    try {
      const r = await clean(file);
      if (my !== runId) return;
      photos[k] = r.canvas;
      im.src = r.canvas.toDataURL('image/jpeg', 0.85);
      slot.classList.add('ok');
      if (k === 'front') useAsPhoto(await toBlob(r.canvas), file.name);
    } catch (e) { console.warn('Photo', e); }
    if (my !== runId) return;
    slot.classList.remove('busy'); pending--;
    // On attend un peu : la personne prend souvent l'arrière juste après l'avant
    clearTimeout(timer);
    if (!pending) timer = setTimeout(identify, 1200);
  }

  // La photo avant nettoyée sert de photo produit si la fiche n'en a pas
  function useAsPhoto(blob, name) {
    const pin = $('photoInput'), wrap = $('photoWrap');
    if (!pin || !blob || wrap?.classList.contains('has-photo')) return;
    try {
      const f = new File([blob], (name || 'produit').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer(); dt.items.add(f); pin.files = dt.files;
      pin.dispatchEvent(new Event('change', { bubbles: true }));
    } catch {}
  }

  /* ── Identification en ligne ── */
  async function identify() {
    const order = SLOTS.map(([k]) => k).filter(k => photos[k]);
    if (!order.length) return;
    const my = runId;
    status('<b>Recherche du produit sur internet…</b> Vous pouvez continuer à remplir la fiche.');
    let r;
    try {
      r = await AfyaAPI.medications.identify(order.map(k => photos[k].toDataURL('image/jpeg', 0.85)));
    } catch (e) {
      if (my !== runId) return;
      console.warn('Identification :', e);
      status('Recherche en ligne indisponible ; lecture locale des photos…');
      return localFallback(order, my);
    }
    if (my !== runId) return;
    if (!r?.found) { status('Produit non trouvé en ligne. Complétez la fiche à la main.'); return; }
    applyResult(r);
  }

  function applyResult(r) {
    const filled = [];
    const mark = e => { (e.closest('.field') || e).classList.add('ocr-filled'); };
    const fill = (id, v, label) => {
      const e = $(id); if (!e || v == null || v === '' || String(e.value).trim()) return;
      e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
      mark(e); filled.push(label);
    };
    const pick = (id, text, label) => {
      const sel = $(id); if (!sel || !text || sel.value) return;
      const o = [...sel.options].find(o => o.value && o.text.trim().toLowerCase() === text.toLowerCase());
      if (o) { sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); mark(sel); filled.push(label); }
    };

    fill('addName', r.name, 'nom');
    pick('addCategory', r.category, 'catégorie');
    pick('addForm', r.form, 'forme');

    setTimeout(() => {   // les champs de conditionnement sont reconstruits après le choix de la forme
      fill('addGeneric', r.generic, 'DCI');
      fill('addStrength', r.strength, 'dosage');
      fill('addManufacturer', r.manufacturer, 'laboratoire');
      if (r.expiry) {
        const [y, m] = r.expiry.split('-').map(Number);
        fill('addExpiry', `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`, 'péremption');
      }
      if ($('addStripsPerBox') && r.strips_per_box && r.units_per_strip) {
        fill('addStripsPerBox', r.strips_per_box, 'plaquettes');
        fill('addUnitsPerStrip', r.units_per_strip, 'unités/plaquette');
      } else if ($('addUnitsPerBox') && r.units_per_box) {
        const u = $('addUnitsPerBox'); if (u.value === '1') u.value = '';
        fill('addUnitsPerBox', r.units_per_box, 'unités/boîte');
      }
      const rx = $('tglPrescription');
      if (rx && typeof r.requires_prescription === 'boolean' && rx.classList.contains('on') !== r.requires_prescription) {
        rx.classList.toggle('on', r.requires_prescription); filled.push('ordonnance');
      }

      const conf = { high: 'fiable', medium: 'à vérifier', low: 'incertaine' }[r.confidence] || 'à vérifier';
      const src = (r.sources || []).slice(0, 2).map(u => `<a href="${u.replace(/"/g, '%22')}" target="_blank" rel="noopener">${new URL(u).hostname}</a>`).join(', ');
      status(filled.length
        ? `<b>${filled.length} champ${filled.length > 1 ? 's' : ''} rempli${filled.length > 1 ? 's' : ''}</b> (identification ${conf}) : ${filled.join(', ')}. Vérifiez les champs surlignés.${src ? ' Sources : ' + src : ''}`
        : 'Produit trouvé, mais les champs étaient déjà remplis.');
      if (filled.length) say(`${filled.length} information${filled.length > 1 ? 's' : ''} remplie${filled.length > 1 ? 's' : ''}`, 'success');
    }, 150);
  }

  /* ── Secours : OCR local (sans internet côté serveur) ── */
  function getOcr() {
    return new Promise((ok, ko) => {
      const go = () => Tesseract.createWorker('fra+eng').then(ok, ko);
      if (window.Tesseract) return go();
      const s = document.createElement('script'); s.src = OCR_LIB; s.onload = go; s.onerror = ko; document.head.appendChild(s);
    });
  }

  async function localFallback(order, my) {
    let w;
    try { w = await getOcr(); } catch { status('Lecture impossible. Complétez la fiche à la main.'); return; }
    let text = '';
    for (const k of order) { try { text += '\n' + (await w.recognize(photos[k])).data.text; } catch {} }
    w.terminate();
    if (my !== runId) return;
    const out = { found: true, confidence: 'low', sources: [] };
    const dose = text.match(/\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|g|ml|ui|%)(?:\s?\/\s?\d*(?:[.,]\d+)?\s?(?:ml|g))?\b/i);
    if (dose) out.strength = dose[0].replace(/\s+/g, '').replace(',', '.');
    const blister = text.match(/(\d{1,2})\s?[x×]\s?(\d{1,3})\s*(?:comprim|g[ée]lule|tablet|caps|cp)/i);
    if (blister) { out.strips_per_box = +blister[1]; out.units_per_strip = +blister[2]; }
    const exp = text.match(/(?:exp|p[ée]rim|use\s*by)[^0-9]{0,12}(\d{1,2})\s*[\/.\-]\s*(20\d{2}|\d{2})\b/i);
    if (exp) out.expiry = `${exp[2].length === 2 ? '20' + exp[2] : exp[2]}-${String(Math.min(12, Math.max(1, +exp[1]))).padStart(2, '0')}`;
    applyResult(out);   // volontairement prudent : pas de nom deviné
  }

  window.addEventListener('load', () => {
    build();
    const o = window.openAddMed;
    window.openAddMed = function () { reset(); return o.apply(this, arguments); };
  });
})();
