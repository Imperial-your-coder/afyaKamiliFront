/* ═══════════════════════════════════════════════════════════════
   REMPLISSAGE PAR PHOTOS
   Avant, arrière (+ 2 côtés facultatifs). Chaque photo est lue en
   arrière-plan (OCR dans le navigateur) ; les champs VIDES de la fiche
   se remplissent seuls si la lecture donne quelque chose d'exploitable.
   La photo avant devient aussi la photo du produit si aucune n'est mise.
═══════════════════════════════════════════════════════════════ */
(function () {
  const LIB = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
  const $ = id => document.getElementById(id);
  const say = (m, t) => (window.toast || window.showToast)(m, t);
  const SLOTS = [['front', 'Avant'], ['back', 'Arrière'], ['side1', 'Côté'], ['side2', 'Côté']];
  let worker = null, workerP = null, results = {}, pending = 0;

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
  .ocr-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .ocr-slot.busy::after{content:"";position:absolute;inset:0;background:rgba(17,17,17,.45) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='%23EFFF3A' stroke-width='3' stroke-dasharray='40 20'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='.8s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E") center/26px no-repeat}
  .ocr-slot.ok::before{content:"✓";position:absolute;z-index:2;top:5px;right:5px;width:18px;height:18px;border-radius:50%;
    background:var(--accent,#EFFF3A);color:#111;font-size:11px;display:flex;align-items:center;justify-content:center}
  .ocr-filled{animation:ocrF 1.2s ease-out}
  @keyframes ocrF{0%{box-shadow:0 0 0 3px rgba(239,255,58,.9)}100%{box-shadow:0 0 0 0 rgba(239,255,58,0)}}`;

  function build() {
    const body = document.querySelector('#modalAddMed .modal-body');
    if (!body || $('ocrBox')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const box = document.createElement('div'); box.className = 'ocr-box'; box.id = 'ocrBox';
    box.innerHTML = `<div class="ocr-hd">Remplir avec des photos <small>Avant et arrière ; côtés si besoin. Les champs se remplissent seuls.</small></div>
      <div class="ocr-slots">${SLOTS.map(([k, l], i) => `
        <label class="ocr-slot ${i > 1 ? 'opt' : ''}" id="ocr_${k}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
          ${l}<input type="file" accept="image/*" capture="environment" hidden data-k="${k}">
        </label>`).join('')}</div>`;
    const ident = [...body.querySelectorAll('.sec-divider')].find(d => /Identification/.test(d.textContent));
    body.insertBefore(box, ident || body.firstChild);
    box.querySelectorAll('input[type=file]').forEach(inp => inp.addEventListener('change', () => {
      const f = inp.files[0]; inp.value = ''; if (f) handle(inp.dataset.k, f);
    }));
  }

  function reset() {
    results = {};
    SLOTS.forEach(([k, l]) => {
      const s = $('ocr_' + k); if (!s) return;
      s.classList.remove('busy', 'ok'); s.querySelector('img')?.remove();
    });
  }

  /* ── OCR ── */
  function getWorker() {
    if (worker) return Promise.resolve(worker);
    return workerP ||= new Promise((ok, ko) => {
      const go = async () => { try { worker = await Tesseract.createWorker('fra+eng'); ok(worker); } catch (e) { workerP = null; ko(e); } };
      if (window.Tesseract) return go();
      const s = document.createElement('script'); s.src = LIB; s.onload = go; s.onerror = () => { workerP = null; ko(); };
      document.head.appendChild(s);
    });
  }
  function shrink(file, max = 1600) {
    return new Promise(res => {
      const img = new Image(); img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
        const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.35)'; x.drawImage(img, 0, 0, c.width, c.height);
        res(c);
      }; img.src = URL.createObjectURL(file);
    });
  }

  async function handle(k, file) {
    const slot = $('ocr_' + k);
    slot.querySelector('img')?.remove();
    const im = document.createElement('img'); im.src = URL.createObjectURL(file); slot.prepend(im);
    slot.classList.remove('ok'); slot.classList.add('busy'); pending++;
    if (k === 'front') usAsPhoto(file);
    try {
      const [w, c] = await Promise.all([getWorker(), shrink(file)]);
      const { data } = await w.recognize(c);
      results[k] = data;
      slot.classList.add('ok');
    } catch (e) { console.warn('OCR', e); }
    slot.classList.remove('busy'); pending--;
    if (!pending) apply();
  }

  // La photo avant sert de photo produit si la fiche n'en a pas
  function usAsPhoto(file) {
    const pin = $('photoInput'), wrap = $('photoWrap');
    if (!pin || wrap?.classList.contains('has-photo')) return;
    try { const dt = new DataTransfer(); dt.items.add(file); pin.files = dt.files; pin.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
  }

  /* ── Analyse du texte ── */
  const clean = s => s.replace(/[|_~`«»"“”]/g, ' ').replace(/\s+/g, ' ').trim();
  function analyse() {
    const lines = [];
    Object.entries(results).forEach(([k, d]) => (d.lines || []).forEach(l => {
      const t = clean(l.text || ''); if (t.length < 2 || l.confidence < 45) return;
      lines.push({ t, k, h: (l.bbox?.y1 - l.bbox?.y0) || 0 });
    }));
    const all = lines.map(l => l.t).join('\n');
    const out = {};

    // Nom : plus grande ligne lisible de la face avant (ou de n'importe quelle face)
    const cand = lines.filter(l => /[a-zà-ÿ]{3,}/i.test(l.t) && l.t.length <= 40 && !/exp|lot\b|batch|fabriqu|manufact|www|\.com/i.test(l.t))
      .sort((a, b) => (b.k === 'front') - (a.k === 'front') || b.h - a.h);
    if (cand[0]) out.name = cand[0].t.replace(/\s*®|™/g, '');

    const dose = all.match(/\b\d+(?:[.,]\d+)?\s?(?:mg|g|mcg|µg|ug|ml|ui|iu|%)(?:\s?\/\s?\d*(?:[.,]\d+)?\s?(?:ml|g|mg))?\b/i);
    if (dose) out.strength = dose[0].replace(/\s+/g, '').replace(',', '.');

    // DCI : le mot qui précède le dosage, s'il diffère du nom
    if (dose) {
      const m = all.slice(Math.max(0, dose.index - 40), dose.index).match(/([A-Za-zÀ-ÿ\-]{4,})\s*$/);
      if (m && !new RegExp(m[1], 'i').test(out.name || '')) out.generic = m[1];
    }

    const FORMS = [[/lingette|wipe|tissue|serviette|coton|gant|pansement|compresse|seringue|couche|diaper/i, /autre|consomm|hygi/i],
      [/effervescent/i, /effervescent/i], [/comprim|tablet|\bcp\b/i, /^comprim/i], [/g[ée]lule|capsule/i, /g[ée]lule/i],
      [/sirop|syrup/i, /sirop/i], [/suspension|solution buvable|oral solution/i, /solution|suspension/i],
      [/cr[èe]me|cream|pommade|ointment|gel\b/i, /cr[èe]me|pommade/i], [/injectable|ampoule|injection/i, /ampoule|inject/i],
      [/suppositoire|suppositor/i, /suppo/i], [/sachet|powder|poudre/i, /sachet|poudre/i], [/collyre|eye drops|gouttes/i, /goutte|collyre/i],
      [/spray|nasal/i, /spray/i], [/perfusion|infusion/i, /perf/i], [/patch/i, /patch/i]];
    for (const [re, opt] of FORMS) if (re.test(all)) { out.formRe = opt; break; }

    const blister = all.match(/(\d{1,2})\s?[x×]\s?(\d{1,3})\s*(?:comprim|g[ée]lule|tablet|caps|cp)/i);
    if (blister) { out.strips = +blister[1]; out.perStrip = +blister[2]; }
    const units = all.match(/(\d{1,4})\s*(?:comprim[ée]s?|g[ée]lules?|tablets?|capsules?|sachets?|ampoules?|lingettes?|wipes|pi[èe]ces?|pcs)\b/i);
    if (units) out.units = +units[1];

    const exp = all.match(/(?:exp|per|p[ée]rim|use\s*by|best\s*before)[^0-9]{0,12}(\d{1,2})\s*[\/.\-]\s*(\d{2,4})/i)
             || all.match(/(?:exp|per)[^0-9]{0,12}(\d{4})\s*[\/.\-]\s*(\d{1,2})/i);
    if (exp) {
      let [a, b] = [exp[1], exp[2]], y, mo;
      if (a.length === 4) { y = a; mo = b; } else { mo = a; y = b.length === 2 ? '20' + b : b; }
      mo = String(Math.min(12, Math.max(1, +mo))).padStart(2, '0');
      if (+y > 2000 && +y < 2100) out.expiry = `${y}-${mo}-${new Date(+y, +mo, 0).getDate()}`;
    }

    const lab = lines.find(l => /(laborat|pharma\b|pharmaceut|ltd|s\.?a\.?r?\.?l?\b|gmbh|inc\.?|industr|limited)/i.test(l.t) && l.t.length < 50);
    const by = all.match(/(?:fabriqu[ée] par|manufactured by|mfd\.? by|distribu[ée] par)\s*:?\s*([^\n,]{3,40})/i);
    if (by) out.manufacturer = clean(by[1]); else if (lab) out.manufacturer = lab.t;
    return out;
  }

  /* ── Remplissage : uniquement les champs vides ── */
  function fill(id, v) {
    const e = $(id); if (!e || v == null || v === '' || String(e.value).trim()) return 0;
    e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    (e.closest('.field') || e).classList.remove('ocr-filled'); void e.offsetWidth; (e.closest('.field') || e).classList.add('ocr-filled');
    return 1;
  }
  function apply() {
    if (!Object.keys(results).length) return;
    const r = analyse(); let n = 0;
    n += fill('addName', r.name);
    const sel = $('addForm');
    if (r.formRe && sel && !sel.value) {
      const o = [...sel.options].find(o => o.value && r.formRe.test(o.text));
      if (o) { sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); n++; }
    }
    setTimeout(() => {   // champs du type, reconstruits après le choix du type
      n += fill('addGeneric', r.generic) + fill('addStrength', r.strength) + fill('addManufacturer', r.manufacturer) + fill('addExpiry', r.expiry);
      if (r.strips) n += fill('addStripsPerBox', r.strips) + fill('addUnitsPerStrip', r.perStrip);
      else if (r.units) {
        if ($('addUnitsPerBox') && ($('addUnitsPerBox').value === '1' || !$('addUnitsPerBox').value)) { $('addUnitsPerBox').value = ''; n += fill('addUnitsPerBox', r.units); }
      }
      if (n) say(`${n} information${n > 1 ? 's' : ''} remplie${n > 1 ? 's' : ''} depuis les photos`, 'success');
    }, 120);
  }

  window.addEventListener('load', () => {
    build();
    const o = window.openAddMed;
    window.openAddMed = function () { reset(); return o.apply(this, arguments); };
    // pré-charge le moteur de lecture sans bloquer
    setTimeout(() => { if (!window.Tesseract) { const s = document.createElement('script'); s.src = LIB; document.head.appendChild(s); } }, 4000);
  });
})();
