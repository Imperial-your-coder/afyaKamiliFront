/* ═══════════════════════════════════════════════════════════════
   SCANNER CODE-BARRES — Pharmacie
   • « Ajouter »          → scan d'abord ; code inconnu = fiche pré-remplie,
                             code connu = ouverture de la fiche existante.
   • « Vendre maintenant » → scan en continu ; chaque article connu va au panier.
   • Produit sans code (plaquette seule…) → « Saisir à la main ».
   Le lien code ↔ médicament est envoyé à l'API (champ barcode) et gardé
   localement en secours.
═══════════════════════════════════════════════════════════════ */
(function () {
  const LIB = 'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js';
  const MAP_KEY = 'afya_barcodes';
  let mode = null, busy = false, pendingCode = null, libP = null;

  /* ── mémoire code → id ── */
  const loadMap = () => { try { return JSON.parse(localStorage.getItem(MAP_KEY)) || {}; } catch { return {}; } };
  const saveMap = m => { try { localStorage.setItem(MAP_KEY, JSON.stringify(m)); } catch {} };
  function findByCode(code) {
    const byField = meds().find(m => String(m.barcode || '') === code);
    if (byField) return byField;
    const id = loadMap()[code];
    return id != null ? meds().find(m => String(m.id) === String(id)) : null;
  }
  const meds = () => (typeof MEDICATIONS !== 'undefined' ? MEDICATIONS : []);
  const say = (msg, type) => (window.showToast || window.toast || alert)(msg, type);

  /* ── chargement paresseux de la librairie ── */
  function loadLib() {
    if (window.ZXing) return Promise.resolve();
    return libP ||= new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = LIB; s.onload = ok; s.onerror = () => { libP = null; ko(); };
      document.head.appendChild(s);
    });
  }

  /* ── interface ── */
  const css = `
  #scanSheet{position:fixed;inset:0;z-index:9999;background:#0d0e0c;color:#fff;display:none;flex-direction:column;font-family:Manrope,system-ui,sans-serif}
  #scanSheet.on{display:flex}
  .sc-top{display:flex;align-items:center;gap:12px;padding:16px 16px 10px}
  .sc-title{flex:1;font-weight:800;font-size:17px}
  .sc-sub{font-size:12px;color:#a3a59e;font-weight:600;margin-top:2px}
  .sc-x{width:40px;height:40px;border-radius:50%;border:0;background:#24261f;color:#fff;font-size:20px}
  .sc-cam{position:relative;flex:1;margin:0 16px;border-radius:22px;overflow:hidden;background:#000;min-height:260px}
  #scanReader{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  #scanReader video{width:100%!important;height:100%!important;object-fit:cover}
  #scanReader img,#scanReader__dashboard,#scanReader__header_message{display:none!important}
  .sc-frame{position:absolute;left:5%;right:5%;top:24%;height:46%;border-radius:16px;pointer-events:none;
    box-shadow:0 0 0 2000px rgba(0,0,0,.45);border:2px solid #EFFF3A}
  .sc-frame::after{content:"";position:absolute;left:6%;right:6%;top:50%;height:2px;background:#EFFF3A;
    box-shadow:0 0 12px #EFFF3A;animation:scl 1.8s ease-in-out infinite}
  @keyframes scl{0%,100%{transform:translateY(-38px);opacity:.4}50%{transform:translateY(38px);opacity:1}}
  .sc-hint{position:absolute;left:0;right:0;bottom:16px;text-align:center;font-size:13px;font-weight:700;color:#e6e7e0}
  .sc-flash{position:absolute;inset:0;background:#EFFF3A;opacity:0;pointer-events:none;transition:opacity .25s}
  .sc-flash.on{opacity:.35}
  .sc-res{margin:12px 16px 0;padding:14px;border-radius:16px;background:#1b1d18;min-height:58px;display:flex;align-items:center;gap:12px}
  .sc-res .ic{width:38px;height:38px;border-radius:12px;background:#2a2c25;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
  .sc-res .t{font-weight:800;font-size:14px}.sc-res .s{font-size:12px;color:#a3a59e;margin-top:2px}
  .sc-res .acts{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .sc-btn{border:0;border-radius:12px;padding:12px 14px;font:800 13px Manrope,system-ui;background:#2a2c25;color:#fff}
  .sc-btn.y{background:#EFFF3A;color:#111}
  .sc-foot{display:flex;gap:10px;padding:12px 16px calc(16px + env(safe-area-inset-bottom))}
  .sc-foot .sc-btn{flex:1;padding:15px}
  .sc-cnt{background:#EFFF3A;color:#111;border-radius:10px;padding:1px 7px;margin-left:6px}
  #scanCodeChip{display:none;align-items:center;gap:8px;margin:0 0 12px;padding:9px 12px;border-radius:12px;
    background:var(--card,#F8F8F3);border:1.5px dashed var(--light,#D8D8D0);font-size:12.5px;font-weight:700}
  #scanCodeChip.on{display:flex}#scanCodeChip b{font-family:ui-monospace,monospace;letter-spacing:.5px}
  #scanCodeChip button{margin-left:auto;border:0;background:none;color:var(--mid,#8B8D86);font-weight:700;cursor:pointer}`;

  function buildUI() {
    if (document.getElementById('scanSheet')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'scanSheet';
    d.innerHTML = `
      <div class="sc-top"><div style="flex:1"><div class="sc-title" id="scTitle"></div><div class="sc-sub" id="scSub"></div></div>
        <button class="sc-x" onclick="closeScanner()" aria-label="Fermer">×</button></div>
      <div class="sc-cam"><video id="scanReader" playsinline muted></video><div class="sc-frame"></div>
        <div class="sc-flash" id="scFlash"></div><div class="sc-hint" id="scHint">Placez le code-barres dans le cadre</div></div>
      <div class="sc-res" id="scRes"><div class="ic">▦</div><div><div class="t">En attente…</div><div class="s">Le scan est automatique</div></div></div>
      <div class="sc-foot"><button class="sc-btn" id="scManual"></button><button class="sc-btn y" id="scMain"></button></div>`;
    document.body.appendChild(d);

    // pastille « code scanné » dans la fiche produit
    const body = document.querySelector('#modalAddMed .modal-body');
    if (body) {
      const c = document.createElement('div'); c.id = 'scanCodeChip';
      c.innerHTML = `▦ Code-barres : <b id="scanCodeVal"></b><button type="button" onclick="clearPendingCode()">Retirer</button>`;
      body.prepend(c);
    }
  }

  function result(icon, title, sub, actions = '') {
    document.getElementById('scRes').innerHTML =
      `<div class="ic">${icon}</div><div style="min-width:0"><div class="t">${title}</div><div class="s">${sub}</div></div>
       ${actions ? `<div class="acts">${actions}</div>` : ''}`;
  }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cartCount = () => { try { return (JSON.parse(sessionStorage.getItem('afya_cart')) || []).reduce((a, l) => a + (l.qty || 0), 0); } catch { return 0; } };

  function setFoot() {
    const man = document.getElementById('scManual'), main = document.getElementById('scMain');
    if (mode === 'add') {
      document.getElementById('scTitle').textContent = 'Ajouter un article';
      document.getElementById('scSub').textContent = 'Scannez la boîte pour créer sa fiche';
      man.textContent = '✎ Saisir à la main'; man.onclick = () => { closeScanner(); window.openAddMed(); };
      main.style.display = 'none';
    } else {
      document.getElementById('scTitle').textContent = 'Vendre';
      document.getElementById('scSub').textContent = 'Scannez chaque article, il va au panier';
      man.textContent = '✎ Sans code-barres'; man.onclick = () => { closeScanner(); window.openQuickSale(); };
      main.style.display = '';
      main.innerHTML = `Panier<span class="sc-cnt">${cartCount()}</span>`;
      main.onclick = () => { closeScanner(); window.openCart(); };
    }
  }

  /* ── ouverture / fermeture ── */
  let stream = null, loop = null, reader = null, flip = 0;
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });

  function makeReader() {
    const Z = ZXing, h = new Map(), B = Z.BarcodeFormat;
    h.set(Z.DecodeHintType.TRY_HARDER, true);
    h.set(Z.DecodeHintType.POSSIBLE_FORMATS, [B.EAN_13, B.EAN_8, B.UPC_A, B.UPC_E, B.CODE_128, B.CODE_39, B.ITF, B.QR_CODE, B.DATA_MATRIX]);
    const r = new Z.MultiFormatReader(); r.setHints(h); return r;
  }
  // Image entière (comme le prototype), une fois sur deux tournée de 90° pour les codes verticaux
  function tick() {
    const v = document.getElementById('scanReader');
    if (busy || !v.videoWidth) return;
    const sc = v.videoWidth > 1280 ? .6 : 1, W = Math.round(v.videoWidth * sc), H = Math.round(v.videoHeight * sc);
    if (++flip % 2) { cv.width = H; cv.height = W; cx.save(); cx.translate(H, 0); cx.rotate(Math.PI / 2); cx.drawImage(v, 0, 0, W, H); cx.restore(); }
    else { cv.width = W; cv.height = H; cx.drawImage(v, 0, 0, W, H); }
    try {
      const src = new ZXing.HTMLCanvasElementLuminanceSource(cv);
      onCode(reader.decode(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src))).getText());
    } catch {}
  }

  window.openScanner = async function (m) {
    buildUI(); mode = m; busy = false; setFoot();
    result('▦', 'En attente…', 'Le scan est automatique');
    document.getElementById('scanSheet').classList.add('on');
    try {
      await loadLib(); reader ||= makeReader();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      const v = document.getElementById('scanReader'); v.srcObject = stream; await v.play();
      try { await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch {}
      clearInterval(loop); loop = setInterval(tick, 180);
    } catch (e) {
      result('⚠', 'Caméra indisponible', 'Autorisez la caméra, ou saisissez à la main.');
    }
  };

  window.closeScanner = async function () {
    document.getElementById('scanSheet')?.classList.remove('on');
    clearInterval(loop); loop = null;
    stream?.getTracks().forEach(t => t.stop()); stream = null;
  };

  function feedback() {
    navigator.vibrate?.(80);
    const f = document.getElementById('scFlash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 220);
  }

  /* ── traitement d'un code lu ── */
  async function onCode(raw) {
    const code = String(raw).trim();
    if (busy || !code) return;
    busy = true; feedback();
    const m = findByCode(code);

    if (mode === 'sell') {
      if (m) {
        window.addToCart(m.id);
        result('✓', esc(m.name), `Ajouté au panier · ${esc(code)}`);
        setFoot();
        setTimeout(() => busy = false, 1400);
      } else {
        result('?', 'Article inconnu', esc(code),
          `<button class="sc-btn" onclick="scanUnknownAdd('${esc(code)}')">Créer la fiche</button>
           <button class="sc-btn y" onclick="closeScanner();openQuickSale()">Vente rapide</button>
           <button class="sc-btn" onclick="scanResume()">↻</button>`);
      }
      return;
    }

    // mode ajout
    if (m) {
      result('✓', 'Déjà au catalogue', esc(m.name),
        `<button class="sc-btn y" onclick="closeScanner();openAddMed(${JSON.stringify(m.id)})">Modifier</button>
         <button class="sc-btn" onclick="scanResume()">↻</button>`);
      return;
    }
    window.scanUnknownAdd(code);
  }

  window.scanResume = () => { busy = false; result('▦', 'En attente…', 'Le scan est automatique'); };

  window.scanUnknownAdd = async function (code) {
    await closeScanner();
    pendingCode = code;
    window.openAddMed();
    showChip();
    // Essai de pré-remplissage du nom (base publique, souvent vide pour les médicaments)
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands`);
      const d = await r.json(), n = document.getElementById('addName');
      if (d.status === 1 && d.product?.product_name && n && !n.value) n.value = d.product.product_name;
      const mf = document.getElementById('addManufacturer');
      if (d.status === 1 && d.product?.brands && mf && !mf.value) mf.value = d.product.brands.split(',')[0];
    } catch {}
  };

  function showChip() {
    const c = document.getElementById('scanCodeChip');
    if (!c) return;
    c.classList.toggle('on', !!pendingCode);
    if (pendingCode) document.getElementById('scanCodeVal').textContent = pendingCode;
  }
  window.clearPendingCode = () => { pendingCode = null; showChip(); };

  /* ── branchements sur l'existant ── */
  function wire() {
    buildUI();
    const addBtn = document.getElementById('catalogAddBtn');
    if (addBtn) addBtn.onclick = () => openScanner('add');
    const sellBtn = document.getElementById('quickSaleBtn');
    if (sellBtn) sellBtn.onclick = () => openScanner('sell');

    // ouverture manuelle de la fiche : on garde le code si on vient du scan
    const origOpen = window.openAddMed;
    window.openAddMed = function (id = null) {
      if (id != null) pendingCode = null;
      const r = origOpen.apply(this, arguments);
      const cur = id != null ? meds().find(x => String(x.id) === String(id)) : null;
      if (cur && !pendingCode) {
        const known = cur.barcode || Object.keys(loadMap()).find(k => String(loadMap()[k]) === String(cur.id));
        if (known) pendingCode = known;
      }
      showChip();
      return r;
    };

    // envoi du code à l'API : on l'ajoute au JSON des requêtes de sauvegarde
    const origFetch = window.fetch;
    window.fetch = function (url, opts) {
      try {
        if (pendingCode && opts?.body && typeof opts.body === 'string' && /POST|PUT|PATCH/i.test(opts.method || '')
            && /medic|product|stock/i.test(String(url))) {
          const b = JSON.parse(opts.body);
          if (b && typeof b === 'object' && 'name' in b && !('barcode' in b)) {
            b.barcode = pendingCode; opts = { ...opts, body: JSON.stringify(b) };
          }
        }
      } catch {}
      return origFetch.call(this, url, opts);
    };

    const origSave = window.saveMed;
    window.saveMed = async function () {
      const code = pendingCode, name = document.getElementById('addName')?.value.trim().toLowerCase();
      const r = await origSave.apply(this, arguments);
      const open = document.getElementById('modalAddMed')?.classList.contains('open') ||
                   document.getElementById('modalAddMed')?.classList.contains('show');
      if (code && !open) {
        const m = meds().find(x => String(x.name).toLowerCase() === name);
        if (m) { const map = loadMap(); map[code] = m.id; saveMap(map); m.barcode ||= code; }
        pendingCode = null; showChip();
      }
      return r;
    };
  }

  if (document.readyState === 'complete') wire();
  else window.addEventListener('load', wire);
})();

/* ── Vente manuelle : stepper de quantité + choix du paiement en boutons ── */
(function () {
  function enhance() {
    const q = document.getElementById('qsQty');
    if (q && !q.closest('.qs-step')) {
      const w = document.createElement('div'); w.className = 'qs-step';
      q.parentNode.insertBefore(w, q);
      const b = (t, d) => { const x = document.createElement('button'); x.type = 'button'; x.textContent = t;
        x.onclick = () => { q.value = Math.max(1, (parseInt(q.value) || 1) + d); q.dispatchEvent(new Event('input')); }; return x; };
      w.append(b('−', -1), q, b('+', 1));
    }
    const sel = document.getElementById('qsPay');
    if (sel && !sel.dataset.chips) {
      sel.dataset.chips = '1'; sel.style.display = 'none';
      const c = document.createElement('div'); c.className = 'qs-pay';
      [...sel.options].forEach(o => {
        const x = document.createElement('button'); x.type = 'button'; x.textContent = o.text;
        x.onclick = () => { sel.value = o.value; [...c.children].forEach(k => k.classList.toggle('on', k === x)); };
        if (o.value === sel.value) x.classList.add('on'); c.appendChild(x);
      });
      sel.after(c);
    }
  }
  window.addEventListener('load', () => {
    enhance();
    const o = window.openQuickSale;
    window.openQuickSale = function () {
      const r = o.apply(this, arguments);
      const sel = document.getElementById('qsPay'), c = sel?.nextElementSibling;
      if (c?.classList.contains('qs-pay')) [...c.children].forEach((k, i) => k.classList.toggle('on', sel.options[i].value === sel.value));
      return r;
    };
  });
})();

/* ── Feuille « Gestion » de la nav basse ── */
(function () {
  window.toggleGestion = () => (document.getElementById('gestionSheet').classList.contains('on') ? closeGestion() : openGestion());
  window.openGestion = () => {
    const cur = document.querySelector('.tab.active')?.dataset.tab;
    document.querySelectorAll('.gs-tile[data-g]').forEach(t => t.classList.toggle('cur', t.dataset.g === cur));
    ['gestionSheet', 'gestionOv'].forEach(i => document.getElementById(i).classList.add('on'));
    document.getElementById('bnGestion').classList.add('open');
  };
  window.closeGestion = () => {
    ['gestionSheet', 'gestionOv'].forEach(i => document.getElementById(i)?.classList.remove('on'));
    document.getElementById('bnGestion')?.classList.remove('open');
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('.gs-tile[data-g]');
    if (!t) return;
    closeGestion(); switchTab(t.dataset.g);
    // les onglets autres que Catalogue n'ont pas d'icône dédiée : on allume « Gestion »
    document.getElementById('bnGestion').classList.toggle('active', t.dataset.g !== 'catalog');
  });
})();

/* ── Pad du gros + ── */
(function () {
  window.togglePlusPad = () => (document.getElementById('plusPad').classList.contains('on') ? closePlusPad() : openPlusPad());
  window.openPlusPad = () => {
    closeGestion();
    document.getElementById('plusPad').classList.add('on');
    document.getElementById('bnPlus').classList.add('open');
    document.getElementById('gestionOv').classList.add('on');
  };
  window.closePlusPad = () => {
    document.getElementById('plusPad')?.classList.remove('on');
    document.getElementById('bnPlus')?.classList.remove('open');
    if (!document.getElementById('gestionSheet')?.classList.contains('on'))
      document.getElementById('gestionOv')?.classList.remove('on');
  };
  const og = window.openGestion;
  window.openGestion = function () { closePlusPad(); return og.apply(this, arguments); };
  const cg = window.closeGestion;
  window.closeGestion = function () { document.getElementById('plusPad')?.classList.remove('on'); document.getElementById('bnPlus')?.classList.remove('open'); return cg.apply(this, arguments); };
})();
