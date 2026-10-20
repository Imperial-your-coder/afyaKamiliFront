/* ═══════════════════════════════════════════════════════════════
   FICHE PRODUIT — saisie progressive
   Ordre : Nom → Catalogue (modèle réutilisable) → Type → champs du type.
   Rien d'autre n'apparaît tant que le type n'est pas choisi.
   Les catalogues sont des modèles de fiche : on les choisit pour
   pré-remplir au lieu de tout ressaisir.
═══════════════════════════════════════════════════════════════ */
(function () {
  const KEY = 'afya_catalogues';
  const $ = id => document.getElementById(id);
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const store = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {} };
  const say = (m, t) => (window.toast || window.showToast)(m, t);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = `
  .ff-cat{display:flex;gap:8px;align-items:stretch}
  .ff-cat select{flex:1;min-width:0}
  .ff-add{flex:none;width:44px;border-radius:12px;border:1.5px solid var(--ink,#111);background:var(--accent,#EFFF3A);
    color:var(--ink,#111);font-size:20px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center}
  .ff-add:active{transform:scale(.94)}
  .ff-types{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
  .ff-types button{border:1.5px solid var(--light,#D8D8D0);background:var(--white,#fff);border-radius:999px;
    padding:6px 11px;font:700 11.5px Manrope,sans-serif;color:var(--dark,#3D3F3A);cursor:pointer}
  .ff-types button.on{background:var(--ink,#111);border-color:var(--ink,#111);color:#fff}
  #ffDetails{animation:ffIn .25s ease-out}
  #ffDetails[hidden]{display:none}
  .ff-wait{padding:18px 14px;border-radius:14px;border:1.5px dashed var(--light,#D8D8D0);text-align:center;
    font-size:12.5px;font-weight:600;color:var(--mid,#8B8D86);margin-top:4px}
  .ff-simple .ff-medonly,.ff-simple #singleUnitNote,.ff-simple #saleUnitsWrap{display:none!important}
  @keyframes ffIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`;

  function build() {
    const body = document.querySelector('#modalAddMed .modal-body');
    if (!body || $('ffDetails')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    const f = id => $(id)?.closest('.field');
    const name = f('addName'), gen = f('addGeneric'), form = f('addForm'), str = f('addStrength'), cat = f('addCategory');
    const pack = $('packagingBlock');
    const oldRows = [name?.parentElement, form?.parentElement];
    const photoDiv = $('photoWrap')?.previousElementSibling, photo = $('photoWrap'), photoIn = $('photoInput');
    const identDiv = [...body.querySelectorAll('.sec-divider')].find(d => d.textContent.trim().startsWith('Identification'));
    // tout ce qui suit le bloc conditionnement (emplacement, réglementation, notes…)
    const tail = []; for (let n = pack.nextElementSibling; n; n = n.nextElementSibling) tail.push(n);

    // Catalogue
    const catField = document.createElement('div'); catField.className = 'field';
    catField.innerHTML = `<label class="field-lbl">Catalogue <span class="opt-tag">Choisir pour pré-remplir</span></label>
      <div class="ff-cat"><select class="ph-select" id="ffCatalog"></select>
      <button type="button" class="ff-add" id="ffCatAdd" title="Enregistrer cette fiche comme catalogue" aria-label="Ajouter un catalogue">+</button></div>`;

    // Type : boutons-pastilles qui pilotent le select existant (gardé caché)
    form.querySelector('.field-lbl').textContent = 'Type d\'article *';
    const chips = document.createElement('div'); chips.className = 'ff-types'; chips.id = 'ffTypes';

    const wait = document.createElement('div'); wait.className = 'ff-wait'; wait.id = 'ffWait';
    wait.textContent = 'Choisissez le type : seuls les champs utiles s\'afficheront.';

    const details = document.createElement('div'); details.id = 'ffDetails'; details.hidden = true;
    const medRow = document.createElement('div'); medRow.className = 'field-row ff-medonly';
    medRow.append(gen, str);
    const descDiv = document.createElement('div'); descDiv.className = 'sec-divider'; descDiv.textContent = 'Détails';
    details.append(descDiv, medRow, cat, pack, photoDiv, photo, photoIn, ...tail);

    const top = [identDiv, name, catField, form, wait, details].filter(Boolean);
    body.querySelectorAll(':scope > *').forEach(n => { if (n.id !== 'scanCodeChip') n.remove(); });
    body.append(...top);
    oldRows.forEach(r => r && r !== body && !r.children.length && r.remove());

    const reg = [...details.querySelectorAll('.sec-divider')].find(d => /Réglementation/.test(d.textContent));
    if (reg) { reg.classList.add('ff-medonly'); let n = reg.nextElementSibling;
      while (n && n.classList.contains('toggle-row')) { n.classList.add('ff-medonly'); n = n.nextElementSibling; } }
    $('ffCatalog').addEventListener('change', e => applyCatalog(e.target.value));
    $('ffCatAdd').addEventListener('click', saveCatalog);
    $('addForm').addEventListener('change', syncType);
  }

  /* ── Type ── */
  function renderChips() {
    const sel = $('addForm'); if (!sel) return;
    [...sel.options].forEach(o => {
      if (!o.value) o.text = '— Choisir le type —';
      else if (/^autre$/i.test(o.text.trim())) o.text = 'Autre (hygiène, matériel…)';
    });
    const box = $('ffTypes'); if (!box) return;
    box.innerHTML = [...sel.options].filter(o => o.value).map(o =>
      `<button type="button" data-v="${esc(o.value)}" class="${o.value === sel.value ? 'on' : ''}">${/^autre$/i.test(o.text.trim()) ? 'Autre · hygiène, matériel…' : esc(o.text)}</button>`).join('')
      || '<span style="font-size:12px;color:var(--mid)">Aucun type disponible</span>';
    box.querySelectorAll('button').forEach(b => b.onclick = () => {
      sel.value = b.dataset.v; sel.dispatchEvent(new Event('change'));
    });
  }
  function syncType() {
    const v = $('addForm').value;
    $('ffTypes')?.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $('ffDetails').hidden = !v; $('ffWait').hidden = !!v;
    if (v && $('addForm').dataset.last !== v) window.__renderPack?.();
    $('addForm').dataset.last = v;
    const sc = v && window.schemeForForm ? window.schemeForForm(v) : null;
    if (sc?.simple && !$('modalAddMed').dataset.edit) { $('tglPrescription')?.classList.remove('on'); $('tglControlled')?.classList.remove('on'); }
    $('modalAddMed').classList.toggle('ff-simple', !!sc?.simple);
  }

  /* ── Catalogues ── */
  function renderCatalogs(selected = '') {
    const l = load(), s = $('ffCatalog'); if (!s) return;
    s.innerHTML = `<option value="">${l.length ? '— Nouveau produit —' : 'Aucun catalogue pour l\'instant'}</option>` +
      l.map(c => `<option value="${c.id}" ${String(c.id) === String(selected) ? 'selected' : ''}>${esc(c.name)}${c.typeName ? ' · ' + esc(c.typeName) : ''}</option>`).join('');
  }
  const FIELDS = ['addName', 'addGeneric', 'addStrength', 'addCategory', 'addManufacturer', 'addLocation', 'addNotes'];
  const PACK = ['addStripsPerBox', 'addUnitsPerStrip', 'addUnitsPerBox', 'addPrice', 'addPriceStrip', 'addPriceUnit', 'addPurchasePrice', 'addMinStock'];

  function saveCatalog() {
    const name = $('addName').value.trim(), form = $('addForm').value;
    if (!name) { say('Indiquez d\'abord le nom', 'error'); $('addName').focus(); return; }
    if (!form) { say('Choisissez d\'abord le type', 'error'); return; }
    const c = { id: Date.now(), form, typeName: $('addForm').selectedOptions[0]?.text || '', v: {} };
    [...FIELDS, ...PACK].forEach(id => { if ($(id)) c.v[id] = $(id).value; });
    c.name = name;
    c.units = [...document.querySelectorAll('.sale-unit-cb:checked')].map(x => x.value);
    c.rx = $('tglPrescription')?.classList.contains('on');
    c.ctrl = $('tglControlled')?.classList.contains('on');
    const l = load().filter(x => x.name.toLowerCase() !== name.toLowerCase());
    l.unshift(c); store(l); renderCatalogs(c.id);
    say('Catalogue enregistré : réutilisable pour les prochains ajouts', 'success');
  }

  function applyCatalog(id) {
    const c = load().find(x => String(x.id) === String(id)); if (!c) return;
    const sel = $('addForm'); sel.value = c.form; sel.dispatchEvent(new Event('change'));
    setTimeout(() => {   // le bloc conditionnement vient d'être reconstruit
      Object.entries(c.v).forEach(([k, v]) => { const e = $(k); if (e) { e.value = v; e.dispatchEvent(new Event('input')); } });
      if (c.units?.length) document.querySelectorAll('.sale-unit-cb').forEach(x => x.checked = c.units.includes(x.value));
      $('tglPrescription')?.classList.toggle('on', !!c.rx);
      $('tglControlled')?.classList.toggle('on', !!c.ctrl);
      say('Fiche pré-remplie depuis le catalogue', 'success');
    }, 60);
  }

  /* ── branchement ── */
  window.addEventListener('load', () => {
    build();
    const o = window.openAddMed;
    window.openAddMed = function () {
      $('modalAddMed').dataset.edit = arguments[0] != null ? '1' : '';
      const r = o.apply(this, arguments);
      renderChips(); renderCatalogs(); syncType();
      return r;
    };
    const sv = window.saveMed;
    window.saveMed = function () {
      if (!$('addForm').value) { say('Choisissez le type d\'article', 'error'); return; }
      return sv.apply(this, arguments);
    };
  });
})();
