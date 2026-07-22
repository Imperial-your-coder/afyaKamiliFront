/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — MODULE PHARMACIE : CÂBLAGE API

   index.js n'est PAS modifié : on surcharge ses fonctions.

   Ordre dans index.html :
     <script src="../../js/afya_api.js" defer></script>
     <script src="./index.js"           defer></script>
     <script src="./pharmacy.js"        defer></script>

   Fonctions surchargées (noms EXACTS des onclick du HTML) :
     confirmSale · confirmExpense · saveMed · saveAjust
     deleteMed · previewRx · saveSettingsForm · handlePhoto
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══ 0. AUTHENTIFICATION ═══ */
  AfyaAPI.setAuthExpiredHandler(() => {
    toast('Session expirée, reconnectez-vous', 'error');
    setTimeout(() => { window.location.href = '../../login.html'; }, 1500);
  });

  if (!AfyaAPI.auth.isLoggedIn()) {
    window.location.href = '../../login.html';
    return;
  }

  let REFS = { categories: [], forms: [], sale_units: [] };
  let uploadedImagePath = null;   // chemin serveur de la photo en cours
  let saleDiscount = 0;           // remise sur la vente en cours

  /* ═══ HELPERS ═══ */
  const toast = (msg, type) =>
    (typeof showToast === 'function') ? showToast(msg, type) : console.log(`[${type}] ${msg}`);

  const errMsg = e =>
    (e && typeof e.firstError === 'function') ? e.firstError()
      : (e?.message || 'Une erreur est survenue.');

  function setLoading(on) {
    let el = document.getElementById('afyaLoader');

    if (on) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'afyaLoader';
        el.innerHTML = `
          <div class="afya-loader-box">
            <div class="afya-spinner">
              <svg viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="5"/>
                <circle cx="25" cy="25" r="20" fill="none" stroke="#EFFF3A" stroke-width="5"
                        stroke-linecap="round" stroke-dasharray="90 150"/>
              </svg>
              <span class="afya-plus">+</span>
            </div>
            <div class="afya-loader-txt">Traitement…</div>
          </div>`;

        const st = document.createElement('style');
        st.id = 'afyaLoaderStyle';
        st.textContent = `
          #afyaLoader{
            position:fixed;inset:0;z-index:100001;
            display:flex;align-items:center;justify-content:center;
            background:rgba(17,17,17,.42);backdrop-filter:blur(3px);
            animation:afyaFade .18s ease;
          }
          @keyframes afyaFade{from{opacity:0}to{opacity:1}}
          .afya-loader-box{
            display:flex;flex-direction:column;align-items:center;gap:16px;
            background:#fff;padding:30px 40px;border-radius:24px;
            box-shadow:0 24px 70px rgba(0,0,0,.28);
          }
          .afya-spinner{position:relative;width:56px;height:56px}
          .afya-spinner svg{width:56px;height:56px;animation:afyaSpin .9s linear infinite}
          @keyframes afyaSpin{to{transform:rotate(360deg)}}
          .afya-plus{
            position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            font-size:22px;font-weight:800;color:#111;font-family:Manrope,sans-serif;
          }
          .afya-loader-txt{
            font-size:13px;font-weight:700;color:#5a5a55;
            font-family:Manrope,sans-serif;letter-spacing:.2px;
          }`;
        document.head.appendChild(st);
        document.body.appendChild(el);
      }
      el.style.display = 'flex';
    } else if (el) {
      el.style.display = 'none';
    }
  }

  /** Indicateur DISCRET pour les rechargements de fond (navigation).
     Ne bloque PAS l'écran — juste une fine barre animée en haut.
     Les grandes applis ne bloquent que pour les ACTIONS, pas pour
     réafficher des données déjà là. */
  let busyCount = 0;
  function setBusy(on) {
    busyCount = Math.max(0, busyCount + (on ? 1 : -1));
    let bar = document.getElementById('afyaBusyBar');
    if (busyCount > 0) {
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'afyaBusyBar';
        bar.style.cssText =
          'position:fixed;top:0;left:0;right:0;height:2.5px;z-index:99998;' +
          'background:linear-gradient(90deg,transparent,#EFFF3A,#EFFF3A,transparent);' +
          'background-size:40% 100%;background-repeat:no-repeat;' +
          'animation:afyaBusy 1.1s ease-in-out infinite';
        if (!document.getElementById('afyaBusyStyle')) {
          const st = document.createElement('style');
          st.id = 'afyaBusyStyle';
          st.textContent =
            '@keyframes afyaBusy{0%{background-position:-40% 0}100%{background-position:140% 0}}';
          document.head.appendChild(st);
        }
        document.body.appendChild(bar);
      }
      bar.style.display = 'block';
    } else if (bar) {
      bar.style.display = 'none';
    }
  }

  /** Change le texte sous le spinner (optionnel) */
  function setLoadingText(txt) {
    const t = document.querySelector('#afyaLoader .afya-loader-txt');
    if (t) t.textContent = txt || 'Traitement…';
  }

  /* ═══ 1. PURGE  /* ═══ 1. PURGE DES DONNÉES SIMULÉES ═══
     index.js initialise MEDICATIONS/JOURNAL/ORDERS avec des exemples.
     On les vide TOUT DE SUITE, avant même le premier rendu, pour
     qu'aucune fausse donnée n'apparaisse à l'écran. */
  function purgeMocks() {
    if (typeof MEDICATIONS !== 'undefined') MEDICATIONS.length = 0;
    if (typeof JOURNAL     !== 'undefined') JOURNAL.length = 0;
    if (typeof ORDERS      !== 'undefined') ORDERS.length = 0;
    if (typeof FREE_PRESCRIPTIONS !== 'undefined') FREE_PRESCRIPTIONS.length = 0;

    ['renderCatalog', 'renderJournal', 'renderOrders', 'renderStock',
     'renderAlerts', 'updateKpis'].forEach(fn => {
      if (typeof window[fn] === 'function') { try { window[fn](); } catch (e) {} }
    });
  }
  purgeMocks();

  /* ═══ 2. RÉFÉRENCES (catégories, formes) ═══ */
  async function loadRefs() {
    try {
      REFS = await AfyaAPI.medications.refs();

      const cat = document.getElementById('addCategory');
      if (cat && REFS.categories?.length) {
        cat.innerHTML = '<option value="">—</option>' +
          REFS.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }

      const form = document.getElementById('addForm');
      if (form && REFS.forms?.length) {
        form.innerHTML = '<option value="">—</option>' +
          REFS.forms.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
      }
    } catch (e) {
      console.error('Références :', e);
    }
  }

  /* ═══ 3. PHOTO — compression + appareil photo ═══ */

  /**
   * Redimensionne et compresse une image avant l'envoi.
   * Une photo de téléphone (4-8 Mo) devient ~150 Ko.
   */
  function compressImage(file, maxSize = 900, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.onload = e => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image illisible'));
        img.onload = () => {
          let { width: w, height: h } = img;
          if (w > maxSize || h > maxSize) {
            const r = Math.min(maxSize / w, maxSize / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';           // fond blanc (PNG transparent → JPEG)
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Compression échouée'));
            blob.name = 'photo.jpg';
            resolve(blob);
          }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Surcharge de handlePhoto : compresse → upload → garde le CHEMIN */
  window.handlePhoto = async function (input) {
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Choisissez une image', 'error');
      return;
    }

    const wrap = document.getElementById('photoWrap');
    const img  = document.getElementById('photoPreviewImg');

    // ── 1. APERÇU IMMÉDIAT — aucun blocage ──
    let blob;
    try {
      blob = await compressImage(file);
    } catch (e) {
      toast('Image illisible', 'error');
      input.value = '';
      return;
    }

    if (img && wrap) {
      if (img.dataset.blobUrl) URL.revokeObjectURL(img.dataset.blobUrl);
      const blobUrl = URL.createObjectURL(blob);
      img.dataset.blobUrl = blobUrl;
      img.src = blobUrl;
      img.style.display = 'block';
      wrap.classList.add('has-photo');
    }
    input.value = '';   // réautorise la re-sélection du même fichier

    // ── 2. UPLOAD EN ARRIÈRE-PLAN — l'utilisateur continue à remplir ──
    // Petit indicateur discret sur la vignette (pas de blocage d'écran).
    uploadedImagePath = null;
    let badge = document.getElementById('photoUpBadge');
    if (!badge && wrap) {
      badge = document.createElement('div');
      badge.id = 'photoUpBadge';
      badge.style.cssText =
        'position:absolute;bottom:6px;left:6px;right:6px;padding:4px 8px;border-radius:8px;' +
        'font-size:10px;font-weight:700;text-align:center;backdrop-filter:blur(4px);z-index:5';
      wrap.style.position = 'relative';
      wrap.appendChild(badge);
    }
    const setBadge = (txt, color, bg) => {
      if (!badge) return;
      badge.textContent = txt;
      badge.style.color = color;
      badge.style.background = bg;
      badge.style.display = 'block';
    };

    setBadge('Envoi en cours…', '#111', 'rgba(239,255,58,.9)');

    // On n'attend PAS : la promesse tourne en fond
    AfyaAPI.uploads.medicationImage(blob)
      .then(res => {
        uploadedImagePath = res.path;
        const kb = Math.round(blob.size / 1024);
        setBadge(`✓ Photo prête (${kb} Ko)`, '#fff', 'rgba(22,163,74,.85)');
        setTimeout(() => { if (badge) badge.style.display = 'none'; }, 2500);
      })
      .catch(e => {
        console.error('Upload photo :', e);
        setBadge('✗ Échec — réessayez', '#fff', 'rgba(220,38,38,.85)');
        uploadedImagePath = null;
      });
  };

  const _removePhoto = window.removePhoto;
  window.removePhoto = function () {
    if (typeof _removePhoto === 'function') _removePhoto();
    uploadedImagePath = null;
  };

  /* ── CAMÉRA ──
     Sur mobile : l'attribut `capture` ouvre l'appareil photo natif.
     Sur PC : `capture` ne fait rien → on ouvre la webcam via getUserMedia.
     (getUserMedia exige HTTPS… ou localhost, donc OK en développement.) */

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let camStream = null;

  /** Bouton « Prendre une photo », inséré JUSTE SOUS la zone d'upload */
  function injectCameraButton() {
    const wrap = document.getElementById('photoWrap');
    if (!wrap || document.getElementById('camBtn')) return;

    // Met à jour le texte : la limite est maintenant de 8 Mo
    const span = wrap.querySelector('span');
    if (span) span.textContent = 'Cliquez pour choisir une photo (JPG/PNG/WEBP · 8 Mo max)';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'camBtn';
    btn.className = 'tb-btn';
    btn.style.cssText = 'width:100%;justify-content:center;margin-top:8px;gap:8px';
    btn.innerHTML =
      '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7"><path d="M2 5.5h2.5L5.5 4h5l1 1.5H14v8H2v-8z"/>' +
      '<circle cx="8" cy="9" r="2.5"/></svg>Prendre une photo';
    btn.onclick = openCamera;

    // ⬇ insertAdjacentElement, PAS appendChild :
    //   appendChild aurait collé le bouton tout en bas de la modale.
    wrap.insertAdjacentElement('afterend', btn);

    // Input caché avec capture native (mobile)
    if (isMobile && !document.getElementById('camInput')) {
      const cam = document.createElement('input');
      cam.type = 'file';
      cam.accept = 'image/*';
      cam.capture = 'environment';
      cam.id = 'camInput';
      cam.style.display = 'none';
      cam.addEventListener('change', () => window.handlePhoto(cam));
      wrap.parentNode.appendChild(cam);
    }
  }

  /** Ouvre la caméra : natif sur mobile, webcam sur PC */
  async function openCamera() {
    if (isMobile) {
      document.getElementById('camInput')?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast('Caméra non disponible — choisissez un fichier', 'error');
      document.getElementById('photoInput')?.click();
      return;
    }

    buildCameraModal();
    const modal = document.getElementById('camModal');
    const video = document.getElementById('camVideo');

    // Contraintes progressives : la webcam PC refuse souvent facingMode,
    // ce qui provoque « AbortError: Timeout starting video source ».
    const attempts = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false },
      { video: { width: { ideal: 1280 } }, audio: false },
      { video: true, audio: false },        // le plus permissif
    ];

    let lastErr = null;

    for (const constraints of attempts) {
      try {
        camStream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (e) {
        lastErr = e;
        camStream = null;
      }
    }

    if (!camStream) {
      console.error('Caméra :', lastErr);
      const msg = lastErr?.name === 'NotAllowedError'
        ? "Accès caméra refusé — autorisez-le dans le navigateur"
        : lastErr?.name === 'NotFoundError'
          ? "Aucune caméra détectée sur cet appareil"
          : "Caméra occupée par une autre application";
      toast(msg + ' — choisissez plutôt un fichier', 'error');
      closeCamera();
      document.getElementById('photoInput')?.click();
      return;
    }

    try {
      video.srcObject = camStream;
      await video.play();
      modal.style.display = 'flex';
    } catch (e) {
      console.error('Lecture vidéo :', e);
      toast('Impossible de démarrer la caméra', 'error');
      closeCamera();
    }
  }

  function closeCamera() {
    camStream?.getTracks().forEach(t => t.stop());
    camStream = null;
    const modal = document.getElementById('camModal');
    if (modal) modal.style.display = 'none';
  }

  /** Capture l'image affichée par la webcam */
  function snapPhoto() {
    const video = document.getElementById('camVideo');
    if (!video?.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async blob => {
      closeCamera();
      if (!blob) { toast('Capture échouée', 'error'); return; }

      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const fake = { files: [file], value: '' };
      await window.handlePhoto(fake);
    }, 'image/jpeg', 0.92);
  }

  /** Construit la modale caméra (une seule fois) */
  function buildCameraModal() {
    if (document.getElementById('camModal')) return;

    const m = document.createElement('div');
    m.id = 'camModal';
    m.style.cssText =
      'display:none;position:fixed;inset:0;z-index:100000;' +
      'background:rgba(0,0,0,.82);backdrop-filter:blur(6px);' +
      'align-items:center;justify-content:center;padding:20px';

    m.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:18px;max-width:640px;width:100%;
                  box-shadow:0 30px 90px rgba(0,0,0,.4)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-size:15px;font-weight:800;letter-spacing:-.2px">Prendre une photo</div>
          <button type="button" id="camClose"
                  style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,0,0,.1);
                         background:#fff;cursor:pointer;display:flex;align-items:center;
                         justify-content:center;font-size:16px;line-height:1">×</button>
        </div>

        <video id="camVideo" autoplay playsinline muted
               style="width:100%;border-radius:16px;background:#111;
                      aspect-ratio:4/3;object-fit:cover"></video>

        <div style="display:flex;gap:10px;margin-top:14px">
          <button type="button" id="camSnap" class="tb-btn primary"
                  style="flex:1;justify-content:center;gap:8px">
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor"
                 stroke-width="1.8"><circle cx="8" cy="8" r="4"/></svg>
            Capturer
          </button>
          <button type="button" id="camCancel" class="tb-btn">Annuler</button>
        </div>
      </div>`;

    document.body.appendChild(m);

    m.querySelector('#camSnap').onclick   = snapPhoto;
    m.querySelector('#camClose').onclick  = closeCamera;
    m.querySelector('#camCancel').onclick = closeCamera;
    m.addEventListener('click', e => { if (e.target === m) closeCamera(); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && camStream) closeCamera();
    });
  }

  /* Le bouton vit dans la modale « Ajouter un médicament » :
     on l'injecte à chaque ouverture, au cas où le DOM aurait bougé. */
  const _openAddMed = window.openAddMed;
  window.openAddMed = function (id = null) {
    uploadedImagePath = null;
    if (typeof _openAddMed === 'function') _openAddMed(id);

    injectCameraButton();

    // ── Pré-remplissage CORRECT en mode édition ──
    // index.js remplit les anciens champs ; on corrige ceux qui ont changé.
    if (id != null && typeof editMedId !== 'undefined' && editMedId) {
      const m = MEDICATIONS.find(x => x.id === editMedId);
      if (m) {
        const set = (elId, v) => { const e = document.getElementById(elId); if (e) e.value = (v ?? ''); };

        // Catégorie / forme : par ID (les <select> ont des id en value)
        set('addCategory', m.category_id);
        set('addForm', m.form_id);

        // Conditionnement : nouveaux champs
        const perStrip = m.units_per_strip || '';
        const strips = (m.pack_size && m.units_per_strip)
          ? Math.round(m.pack_size / m.units_per_strip) : '';
        set('addUnitsPerStrip', perStrip);
        set('addStripsPerBox', strips);

        // Prix : boîte + détail SAISIS
        set('addPrice', m.price);
        set('addPriceStrip', m.price_per_strip);
        set('addPriceUnit', m.price_per_unit);

        // Emplacement
        set('addLocation', m.location && m.location !== '—' ? m.location : '');

        // ── Image existante : on la garde ──
        if (m.photo) {
          uploadedImagePath = m.photo_raw || null;
          const wrap = document.getElementById('photoWrap');
          const img  = document.getElementById('photoPreviewImg');
          if (img && wrap) {
            img.src = m.photo;               // URL absolue déjà construite
            img.style.display = 'block';
            wrap.classList.add('has-photo');
          }
        }
      }
    }

    renderPackagingBlock();   // (re)construit le formulaire selon la forme galénique
    onPackagingInput();
  };



  /* ═══════════════════════════════════════════════════════════
     CONDITIONNEMENT & PRIX — formulaire adapté à la forme galénique

     Hiérarchie réelle :  BOÎTE → PLAQUETTES → COMPRIMÉS
     Mais un sirop n'a pas de plaquette, une crème est en tube…
     Les champs changent donc selon la forme choisie.

     Règle d'or : les prix DÉTAIL sont SAISIS par le pharmacien.
     On propose une valeur au prorata, il la modifie s'il veut
     appliquer une marge sur la vente au détail.
  ═══════════════════════════════════════════════════════════ */

  /** Schémas de conditionnement, par code de forme galénique */
  const SCHEMES = {
    blister: {
      forms: ['CP', 'GEL', 'CPE', 'SUP', 'OVU'],
      baseUnit: 'comprimé',
      baseLabel: 'Comprimé',
      basePlural: 'comprimés',
      hasStrip: true,
      stripLabel: 'Plaquette',
      saleUnits: ['boite', 'plaquette', 'unite'],
      example: 'Boîte de 5 plaquettes × 10 comprimés = 50 comprimés',
    },
    flacon: {
      forms: ['SIR', 'SUS', 'COL', 'AER'],
      baseUnit: 'flacon',
      baseLabel: 'Flacon',
      basePlural: 'flacons',
      hasStrip: false,
      saleUnits: ['boite', 'flacon'],
      example: 'Boîte contenant 1 flacon de sirop',
    },
    ampoule: {
      forms: ['INJ', 'AMP'],
      baseUnit: 'ampoule',
      baseLabel: 'Ampoule',
      basePlural: 'ampoules',
      hasStrip: false,
      saleUnits: ['boite', 'ampoule'],
      example: 'Boîte de 6 ampoules injectables',
    },
    tube: {
      forms: ['CRE', 'POM', 'GEL2'],
      baseUnit: 'tube',
      baseLabel: 'Tube',
      basePlural: 'tubes',
      hasStrip: false,
      saleUnits: ['boite', 'tube'],
      example: 'Boîte contenant 1 tube de crème/baume',
    },
    sachet: {
      forms: ['POU', 'PAT'],
      baseUnit: 'sachet',
      baseLabel: 'Sachet',
      basePlural: 'sachets',
      hasStrip: false,
      saleUnits: ['boite', 'sachet'],
      example: 'Boîte de 20 sachets de poudre',
    },
    perfusion: {
      forms: ['PERF'],
      baseUnit: 'flacon',
      baseLabel: 'Flacon de perfusion',
      basePlural: 'flacons',
      hasStrip: false,
      saleUnits: ['perfusion', 'carton'],
      example: 'Flacon de perfusion vendu à l\'unité',
    },
  };

  const UNIT_LABELS = {
    boite: 'Boîte', plaquette: 'Plaquette', unite: 'Unité',
    flacon: 'Flacon', sachet: 'Sachet', tube: 'Tube',
    ampoule: 'Ampoule', perfusion: 'Flacon perf.', carton: 'Carton',
  };

  /** Quel schéma pour la forme sélectionnée ? */
  function schemeForForm(formId) {
    const form = REFS.forms?.find(f => String(f.id) === String(formId));
    const code = form?.code;
    if (code) {
      for (const key of Object.keys(SCHEMES)) {
        if (SCHEMES[key].forms.includes(code)) return SCHEMES[key];
      }
    }
    return SCHEMES.blister;   // défaut : le cas le plus courant
  }

  /** Génère le bloc « Conditionnement & Prix » selon la forme */
  function renderPackagingBlock() {
    const host = document.getElementById('packagingBlock');
    if (!host) return;

    const scheme = schemeForForm(document.getElementById('addForm')?.value);
    const c = sym();

    // ── Conditionnement : les champs dépendent du schéma ──
    const packagingFields = scheme.hasStrip
      ? `
      <div class="field-row">
        <div class="field">
          <label class="field-lbl">Nombre de plaquettes dans une boîte</label>
          <input class="ph-input" id="addStripsPerBox" type="number" min="1" placeholder="Ex : 5">
        </div>
        <div class="field">
          <label class="field-lbl">Nombre de ${scheme.basePlural} dans une plaquette</label>
          <input class="ph-input" id="addUnitsPerStrip" type="number" min="1" placeholder="Ex : 10">
        </div>
      </div>`
      : `
      <div class="field-row">
        <div class="field">
          <label class="field-lbl">Nombre de ${scheme.basePlural} dans une boîte</label>
          <input class="ph-input" id="addUnitsPerBox" type="number" min="1" value="1" placeholder="Ex : 1">
        </div>
        <div class="field"></div>
      </div>`;

    // ── Prix : boîte, plaquette (si applicable), unité de base ──
    const stripPriceField = scheme.hasStrip ? `
        <div class="field">
          <label class="field-lbl">Prix d'une plaquette
            <span class="opt-tag">Vous fixez</span>
          </label>
          <input class="ph-input" id="addPriceStrip" type="number" step="0.01" min="0" placeholder="0.00">
        </div>` : '<div class="field"></div>';

    host.innerHTML = `
      <div class="sec-divider">Conditionnement — ${scheme.baseLabel}</div>

      <div style="padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.03);
                  font-size:11.5px;color:#9A9A95;font-weight:600;margin-bottom:12px">
        ${scheme.example}
      </div>

      ${packagingFields}

      <div class="sec-divider">Prix de vente</div>

      <div style="padding:10px 12px;border-radius:12px;background:rgba(239,255,58,.12);
                  border:1px solid rgba(239,255,58,.45);font-size:11.5px;color:#5a5a55;
                  font-weight:600;margin-bottom:12px;line-height:1.6">
        Vous fixez <strong>chaque prix librement</strong>. Une suggestion au prorata
        s'affiche, mais vous pouvez vendre le détail plus cher — c'est votre marge.
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-lbl">Prix d'une boîte *</label>
          <input class="ph-input" id="addPrice" type="number" step="0.01" min="0" placeholder="0.00">
        </div>
        ${stripPriceField}
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field-lbl">Prix d'${scheme.baseUnit === 'ampoule' ? 'une' : 'un'} ${scheme.baseUnit}
            <span class="opt-tag">Vous fixez</span>
          </label>
          <input class="ph-input" id="addPriceUnit" type="number" step="0.0001" min="0" placeholder="0.00">
        </div>
        <div class="field">
          <label class="field-lbl">Prix d'achat <span class="opt-tag">Optionnel</span></label>
          <input class="ph-input" id="addPurchasePrice" type="number" step="0.01" min="0" placeholder="0.00">
        </div>
      </div>

      <div id="priceHint" style="margin-top:2px;padding:10px 12px;border-radius:12px;
           background:rgba(0,0,0,.03);font-size:12px;font-weight:600;color:#5a5a55;
           display:none;line-height:1.7"></div>

      <div class="sec-divider">Stock</div>

      <div class="field-row">
        <div class="field">
          <label class="field-lbl">Stock initial</label>
          <div style="display:flex;gap:6px">
            <input class="ph-input" id="addStock" type="number" min="0" placeholder="0" style="flex:1">
            <select class="ph-select" id="addStockUnit" style="flex:0 0 120px">
              <option value="boite">Boîtes</option>
              ${scheme.hasStrip ? '<option value="plaquette">Plaquettes</option>' : ''}
              <option value="unite">${scheme.basePlural.charAt(0).toUpperCase() + scheme.basePlural.slice(1)}</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-lbl">Seuil d'alerte
            <span style="font-size:9px;color:var(--mid)">(en ${scheme.basePlural})</span>
          </label>
          <input class="ph-input" id="addMinStock" type="number" min="0" placeholder="10">
        </div>
      </div>

      <div id="stockHint" style="font-size:11.5px;color:#9A9A95;font-weight:600;
           margin-top:-6px;margin-bottom:10px;display:none"></div>

      <div class="field-row">
        <div class="field">
          <label class="field-lbl">Date de péremption <span class="opt-tag">Optionnel</span></label>
          <input class="ph-input" id="addExpiry" type="date">
        </div>
        <div class="field"></div>
      </div>

      <div class="sec-divider">Ventes autorisées</div>

      <div class="field">
        <div id="saleUnitsWrap" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:2px">
          ${scheme.saleUnits.map((u, i) => `
            <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;
                          padding:6px 12px;border:1.5px solid var(--border);border-radius:999px;
                          background:var(--card)">
              <input type="checkbox" class="sale-unit-cb" value="${u}"
                     ${i === 0 ? 'checked' : ''} style="accent-color:var(--ink)">
              ${UNIT_LABELS[u] || u}
            </label>`).join('')}
        </div>
      </div>`;

    // Recalcul en direct
    ['addPrice', 'addStripsPerBox', 'addUnitsPerStrip', 'addUnitsPerBox',
     'addPriceStrip', 'addPriceUnit', 'addStock', 'addStockUnit'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input',  onPackagingInput);
        el.addEventListener('change', onPackagingInput);
      }
    });
  }

  /** Combien de comprimés dans une boîte ? (comprimés/plaquette × plaquettes/boîte) */
  function packSize() {
    const perStrip = parseInt(document.getElementById('addUnitsPerStrip')?.value) || 0;
    const strips   = parseInt(document.getElementById('addStripsPerBox')?.value) || 0;
    return (perStrip > 0 && strips > 0) ? perStrip * strips : 0;
  }

  /** Suggestions de prix + aperçu du stock converti */
  window.onPackagingInput = function () {
    const scheme = schemeForForm(document.getElementById('addForm')?.value);
    const c    = sym();
    const box  = parseFloat(document.getElementById('addPrice')?.value) || 0;
    const pack = packSize();

    const strip    = parseInt(document.getElementById('addUnitsPerStrip')?.value) || 0;
    const elStrip  = document.getElementById('addPriceStrip');
    const elUnit   = document.getElementById('addPriceUnit');

    // ── Suggestions (placeholder uniquement — on n'écrase JAMAIS la saisie) ──
    if (box > 0 && pack > 0) {
      const perUnit = box / pack;
      if (elUnit)  elUnit.placeholder  = `Suggéré : ${perUnit.toFixed(2)}`;
      if (elStrip && strip > 0) elStrip.placeholder = `Suggéré : ${(perUnit * strip).toFixed(2)}`;
    }

    // ── Récapitulatif des prix réellement appliqués ──
    const hint = document.getElementById('priceHint');
    if (hint) {
      if (box <= 0 || pack <= 0) {
        hint.style.display = 'none';
      } else {
        const perUnit = box / pack;
        const uPrice  = parseFloat(elUnit?.value)  || perUnit;
        const sPrice  = parseFloat(elStrip?.value) || perUnit * strip;

        const rows = [`<strong>Boîte</strong> (${pack} ${scheme.basePlural}) : ${c}${box.toFixed(2)}`];

        if (scheme.hasStrip && strip > 0) {
          const marge = sPrice - perUnit * strip;
          rows.push(
            `<strong>Plaquette</strong> (${strip} ${scheme.basePlural}) : ${c}${sPrice.toFixed(2)}` +
            (Math.abs(marge) > 0.001
              ? ` <span style="color:${marge > 0 ? '#16a34a' : '#dc2626'}">
                   (${marge > 0 ? '+' : ''}${c}${marge.toFixed(2)} vs prorata)</span>` : '')
          );
        }

        const margeU = uPrice - perUnit;
        rows.push(
          `<strong>${scheme.baseLabel}</strong> : ${c}${uPrice.toFixed(2)}` +
          (Math.abs(margeU) > 0.001
            ? ` <span style="color:${margeU > 0 ? '#16a34a' : '#dc2626'}">
                 (${margeU > 0 ? '+' : ''}${c}${margeU.toFixed(2)} vs prorata)</span>` : '')
        );

        hint.innerHTML = rows.join('<br>');
        hint.style.display = 'block';
      }
    }

    // ── Stock converti en unités de base ──
    const sHint = document.getElementById('stockHint');
    const qty   = parseInt(document.getElementById('addStock')?.value) || 0;
    const unit  = document.getElementById('addStockUnit')?.value || 'boite';

    if (sHint) {
      if (qty <= 0 || pack <= 0) {
        sHint.style.display = 'none';
      } else {
        const base = stockToBaseUnits(qty, unit, pack, strip);
        sHint.textContent =
          `= ${base} ${scheme.basePlural} en stock` +
          (unit !== 'boite' ? ` (${(base / pack).toFixed(2)} boîte(s))` : '');
        sHint.style.display = 'block';
      }
    }
  }

  /** Conversion de la saisie de stock en unités de base */
  function stockToBaseUnits(qty, unit, pack, strip) {
    if (unit === 'boite')     return qty * pack;
    if (unit === 'plaquette') return qty * (strip || 1);
    return qty;   // déjà en unités de base
  }



  /* ═══ PRIX À LA VENTE — surcharge unitPrice de index.js ═══

     index.js calculait :  prix plaquette = price × units_per_strip / pack_size
     C'est FAUX dès que le pharmacien fixe son propre prix détail.
     Ici, le prix SAISI fait autorité ; le prorata n'est qu'un repli. */

  window.unitPrice = function (m, unitCode) {
    const box  = parseFloat(m.price) || 0;
    const pack = m.pack_size || 1;
    const prorata = pack > 0 ? box / pack : box;

    switch (unitCode) {
      case 'boite':
        return box;

      case 'carton':
        return box * 12;

      case 'plaquette':
        return (m.price_per_strip != null)
          ? m.price_per_strip                                   // prix SAISI
          : prorata * (m.units_per_strip || 1);                 // repli

      case 'unite':
      case 'flacon':
      case 'tube':
      case 'sachet':
      case 'ampoule':
      case 'perfusion':
        return (m.price_per_unit != null)
          ? m.price_per_unit                                    // prix SAISI
          : prorata;                                            // repli

      default:
        return box;
    }
  };

  /* ═══ 4. CATALOGUE ═══ */
  async function loadMedications() {
    setBusy(true);
    try {
      const { items } = await AfyaAPI.medications.list({ per_page: 200 });
      MEDICATIONS.length = 0;
      items.forEach(m => MEDICATIONS.push(m));

      ['renderCatalog', 'renderStock', 'updateKpis', 'renderAlerts']
        .forEach(fn => { if (typeof window[fn] === 'function') window[fn](); });
    } catch (e) {
      toast(errMsg(e), 'error');
      console.error('Catalogue :', e);
    } finally {
      setBusy(false);
    }
  }

  /* ═══ 5. MÉDICAMENT ═══ */
  window.saveMed = async function () {
    const scheme = schemeForForm(document.getElementById('addForm')?.value);

    const name = document.getElementById('addName').value.trim();
    const box  = parseFloat(document.getElementById('addPrice')?.value);

    if (!name)            { toast('Le nom est requis', 'error'); return; }
    if (!box || box <= 0) { toast("Le prix d'une boîte est requis", 'error'); return; }

    const pack  = packSize();
    const strip = parseInt(document.getElementById('addUnitsPerStrip')?.value) || null;

    if (pack <= 0) {
      toast(scheme.hasStrip
        ? 'Indiquez les plaquettes par boîte et les unités par plaquette'
        : `Indiquez le nombre de ${scheme.basePlural} par boîte`, 'error');
      return;
    }

    // Prix SAISIS — vides = l'API proposera le prorata
    const priceUnit  = parseFloat(document.getElementById('addPriceUnit')?.value);
    const priceStrip = parseFloat(document.getElementById('addPriceStrip')?.value);

    // Stock : converti en unités de base
    const stockQty  = parseInt(document.getElementById('addStock')?.value) || 0;
    const stockUnit = document.getElementById('addStockUnit')?.value || 'boite';
    const stockBase = stockToBaseUnits(stockQty, stockUnit, pack, strip);

    const saleUnits = [...document.querySelectorAll('.sale-unit-cb:checked')].map(cb => cb.value);

    const payload = {
      name,
      generic_name:    document.getElementById('addGeneric').value.trim() || null,
      category_id:     parseInt(document.getElementById('addCategory').value) || null,
      form_id:         parseInt(document.getElementById('addForm').value) || null,
      strength:        document.getElementById('addStrength').value.trim() || null,
      manufacturer:    document.getElementById('addManufacturer').value.trim() || null,
      location:        document.getElementById('addLocation')?.value.trim() || null,
      description:     document.getElementById('addNotes').value.trim() || null,
      image_path:      uploadedImagePath,

      // ── Conditionnement ──
      base_unit:       scheme.baseUnit,
      pack_size:       pack,                         // unités de base par boîte
      units_per_strip: scheme.hasStrip ? strip : null,

      // ── Prix : ce que le pharmacien a saisi fait autorité ──
      unit_price:      box,
      price_per_unit:  Number.isFinite(priceUnit)  ? priceUnit  : null,
      price_per_strip: (scheme.hasStrip && Number.isFinite(priceStrip)) ? priceStrip : null,
      purchase_price:  parseFloat(document.getElementById('addPurchasePrice')?.value) || null,

      min_stock_level: parseInt(document.getElementById('addMinStock')?.value) || 10,
      sale_units:      saleUnits.length ? saleUnits : [scheme.saleUnits[0]],

      requires_prescription: document.getElementById('tglPrescription').classList.contains('on'),
      is_controlled:         document.getElementById('tglControlled').classList.contains('on'),

      // ── Stock initial, en unités de base ──
      initial_stock:   editMedId ? 0 : stockBase,
      expiry_date:     document.getElementById('addExpiry')?.value || null,
    };

    setLoading(true);
    try {
      if (editMedId) {
        await AfyaAPI.medications.updateRaw(editMedId, payload);
        toast('Médicament modifié', 'success');
      } else {
        await AfyaAPI.medications.createRaw(payload);
        toast('Médicament ajouté', 'success');
      }
      uploadedImagePath = null;
      closeModal('modalAddMed');
      invalidate('meds', 'alerts');
      await loadMedications();
      markLoaded('meds');
    } catch (e) {
      toast(errMsg(e), 'error');
      console.error('Médicament :', e);
    } finally {
      setLoading(false);
    }
  };

  window.deleteMed = async function (id) {
    if (!confirm('Supprimer ce médicament ?')) return;
    setLoading(true);
    try {
      await AfyaAPI.medications.remove(id);
      closeModal('modalMed');
      toast('Médicament supprimé', 'success');
      invalidate('meds', 'alerts');
      await loadMedications();
      markLoaded('meds');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ═══ 6. VENTE avec REMISE ═══ */

  /** Injecte le bloc « remise » dans la modale de vente */
  function injectDiscountUI() {
    if (document.getElementById('discountBlock')) return;

    const total = document.getElementById('sellTotal');
    const host  = total?.closest('.sell-total') || total?.parentElement;
    if (!host) return;

    const block = document.createElement('div');
    block.id = 'discountBlock';
    block.style.cssText = 'margin-top:10px';
    block.innerHTML = `
      <button type="button" id="discountToggle"
              style="background:none;border:none;padding:0;cursor:pointer;
                     font:inherit;font-size:12.5px;font-weight:700;
                     color:var(--accent-ink,#111);text-decoration:underline;
                     display:flex;align-items:center;gap:6px">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M8 3.5v9M3.5 8h9"/>
        </svg>
        Ajouter une réduction
      </button>

      <div id="discountRow" style="display:none;margin-top:8px">
        <label style="display:block;font-size:11px;font-weight:700;
                      text-transform:uppercase;letter-spacing:.5px;
                      color:#9A9A95;margin-bottom:5px">
          Montant à déduire
        </label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="number" id="discountInput" min="0" step="0.01" value="0"
                 style="flex:1;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);
                        border-radius:12px;font:inherit;font-size:14px;outline:none">
          <button type="button" id="discountClear"
                  style="padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);
                         border-radius:12px;background:#fff;cursor:pointer;
                         font:inherit;font-size:12px;font-weight:700">
            Annuler
          </button>
        </div>
        <div id="discountHint" style="font-size:11.5px;color:#9A9A95;margin-top:5px"></div>
      </div>`;

    host.appendChild(block);

    const row    = block.querySelector('#discountRow');
    const input  = block.querySelector('#discountInput');
    const toggle = block.querySelector('#discountToggle');

    toggle.onclick = () => {
      const open = row.style.display === 'none';
      row.style.display = open ? 'block' : 'none';
      if (open) input.focus();
    };

    block.querySelector('#discountClear').onclick = () => {
      input.value = 0;
      saleDiscount = 0;
      row.style.display = 'none';
      refreshSellTotal();
    };

    input.addEventListener('input', () => {
      saleDiscount = Math.max(0, parseFloat(input.value) || 0);
      refreshSellTotal();
    });
  }

  /** Recalcule le total affiché en tenant compte de la remise */
  function refreshSellTotal() {
    const m = MEDICATIONS.find(x => x.id === currentMedId);
    if (!m) return;

    const up   = unitPrice(m, currentSellUnit);
    const sub  = currentSellQty * up;
    const cap  = Math.min(saleDiscount, sub);          // la remise ne dépasse pas le sous-total
    const base = sub - cap;
    const tva  = S.tva_enabled ? base * S.tva_rate / 100 : 0;
    const tot  = base + tva;

    const el = document.getElementById('sellTotal');
    if (el) el.textContent = `${sym()}${tot.toFixed(2)}`;

    const hint = document.getElementById('discountHint');
    if (hint) {
      hint.textContent = cap > 0
        ? `Sous-total ${sym()}${sub.toFixed(2)} — remise ${sym()}${cap.toFixed(2)}`
        : '';
      hint.style.color = cap > 0 ? '#16a34a' : '#9A9A95';
    }

    if (saleDiscount > sub) {
      const i = document.getElementById('discountInput');
      if (i) i.value = sub.toFixed(2);
      saleDiscount = sub;
    }
  }

  /* Réinitialise la remise à chaque ouverture de la modale de vente */
  const _openSellModal = window.openSellModal;
  window.openSellModal = function () {
    saleDiscount = 0;
    if (typeof _openSellModal === 'function') _openSellModal();
    injectDiscountUI();
    const i = document.getElementById('discountInput');
    const r = document.getElementById('discountRow');
    if (i) i.value = 0;
    if (r) r.style.display = 'none';
    refreshSellTotal();
  };

  /* Quantité / unité changent → recalculer avec la remise */
  ['updateQty', 'selectUnit', 'onQtyInput'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
      orig.apply(this, args);
      refreshSellTotal();
    };
  });

  /** Vente — surcharge confirmSale (le nom appelé par le HTML) */
  window.confirmSale = async function () {
    const m = MEDICATIONS.find(x => x.id === currentMedId);
    if (!m) return;

    const method   = document.getElementById('sellPayMethod').value;
    const customer = document.getElementById('sellCustomer').value.trim();
    const qty      = currentSellQty;
    const unitCode = currentSellUnit;
    const up       = unitPrice(m, unitCode);
    const discount = Math.min(saleDiscount, qty * up);

    setLoading(true);
    try {
      const res = await AfyaAPI.sales.create({
        items: [{
          medication_id:  m.id,
          quantity:       qty,
          sale_unit_code: unitCode,
          unit_price:     up,
        }],
        payment_method:  method,
        customer_name:   customer,
        discount_amount: discount,
        tax_rate:        S.tva_enabled ? S.tva_rate : 0,
      });

      const sale = res.sale;
      closeModal('modalSell');

      // Montants VALIDÉS PAR LE SERVEUR (pas recalculés côté client)
      const sub   = parseFloat(sale.subtotal)     || qty * up;
      const tva   = parseFloat(sale.tax_amount)   || 0;
      const total = parseFloat(sale.total_amount) || sub + tva;
      const now   = new Date();

      setTimeout(() => showInvoice({
        m, qty,
        ulabel:  unitLabel(unitCode),
        up, sub, tva, total,
        method, customer,
        ref:     sale.sale_number,
        dateStr: now.toLocaleDateString('fr-FR'),
        timeStr: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'),
      }), 200);

      saleDiscount = 0;
      invalidate('meds', 'journal', 'alerts');
      await loadMedications();
      await loadJournal();
      markLoaded('meds'); markLoaded('journal');
    } catch (e) {
      toast(errMsg(e), 'error');
      console.error('Vente :', e);
    } finally {
      setLoading(false);
    }
  };

  /* ═══ 7. AJUSTEMENT DE STOCK ═══ */
  window.saveAjust = async function () {
    const id  = parseInt(document.getElementById('ajustMedSel').value);
    const typ = document.getElementById('ajustType').value;
    const qty = parseInt(document.getElementById('ajustQty').value) || 0;

    if (!id || qty <= 0) { toast('Renseignez tous les champs', 'error'); return; }

    const reason = document.getElementById('ajustReason')?.value.trim()
                || "Ajustement d'inventaire";

    setLoading(true);
    try {
      await AfyaAPI.stock.adjust({ medication_id: id, type: typ, quantity: qty, reason });
      closeModal('modalAjust');
      toast('Ajustement enregistré', 'success');
      invalidate('meds', 'alerts');
      await loadMedications();
      markLoaded('meds');
    } catch (e) {
      toast(errMsg(e), 'error');
      console.error('Ajustement :', e);
    } finally {
      setLoading(false);
    }
  };

  /* ═══ 8. COMPTABILITÉ ═══ */
  async function loadPaymentBreakdown() {
    try {
      const data = await AfyaAPI.accounting.chart('day').catch(() => null);
      // Répartition simple depuis le journal du jour
      const host = document.getElementById('payMethodBars');
      if (!host) return;

      const journal = await AfyaAPI.accounting.journal({ period: 'day' });
      const incomes = (journal.entries?.data || []).filter(e => e.entry_type === 'income');
      const byMethod = {};
      let total = 0;
      incomes.forEach(e => {
        const m = e.payment_method || 'cash';
        const amt = parseFloat(e.amount) || 0;
        byMethod[m] = (byMethod[m] || 0) + amt;
        total += amt;
      });

      const labels = { cash:'Espèces', mobile_money:'Mobile money', card:'Carte',
                       bank_transfer:'Virement', other:'Autre' };
      const colors = { cash:'var(--green)', mobile_money:'var(--blue)', card:'#8b5cf6',
                       bank_transfer:'var(--orange)', other:'var(--mid)' };

      if (total === 0) {
        host.innerHTML = '<div style="text-align:center;color:var(--mid);font-size:12px;padding:10px">Aucune entrée aujourd\'hui</div>';
        return;
      }

      host.innerHTML = Object.entries(byMethod)
        .sort((a,b) => b[1]-a[1])
        .map(([m, amt]) => {
          const pct = Math.round(amt / total * 100);
          return `<div style="display:flex;align-items:center;gap:8px;font-size:12px">
            <div style="flex:1;font-weight:600">${labels[m] || m}</div>
            <div style="width:80px;height:6px;background:var(--light);border-radius:999px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${colors[m] || 'var(--mid)'};border-radius:999px"></div></div>
            <div style="font-weight:800;min-width:28px;text-align:right">${pct}%</div></div>`;
        }).join('');
    } catch (e) { console.error('Modes paiement :', e); }
  }

  async function loadLastClosure() {
    try {
      const res = await AfyaAPI.accounting.closures({ per_page: 1 });
      const last = (res.data || [])[0];
      const dEl = document.getElementById('lastClosureDate');
      const bEl = document.getElementById('lastClosureBalance');
      if (last) {
        if (dEl) dEl.textContent = new Date(last.closure_date).toLocaleDateString('fr-FR');
        if (bEl) bEl.textContent = `${sym()}${parseFloat(last.actual_closing_balance||0).toFixed(2)}`;
      } else {
        if (dEl) dEl.textContent = 'Aucune';
        if (bEl) bEl.textContent = '—';
      }
    } catch (e) { console.error('Dernière clôture :', e); }
  }

  async function loadJournal() {
    try {
      const { entries, summary } = await AfyaAPI.accounting.journal({
        period: (typeof currentPeriod !== 'undefined' ? currentPeriod : 'day'),
      });

      JOURNAL.length = 0;
      entries.forEach(e => JOURNAL.push(e));

      if (typeof window.renderJournal === 'function') window.renderJournal();

      if (summary) {
        const put = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.textContent = `${sym()}${(v || 0).toFixed(2)}`;
        };
        put('acctIn',  summary.total_income);
        put('acctOut', summary.total_expense);
        put('acctNet', summary.net_balance);
      }
    } catch (e) {
      console.error('Journal :', e);
    }
  }

  window.confirmExpense = async function () {
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const motif  = document.getElementById('expenseMotif').value.trim();
    const method = document.getElementById('expenseMethod').value;

    if (!amount || amount <= 0) { toast('Saisissez un montant valide', 'error'); return; }
    if (!motif)                 { toast('Le motif est requis', 'error'); return; }

    setLoading(true);
    try {
      await AfyaAPI.accounting.addExpense({ amount, description: motif, payment_method: method });
      closeModal('modalExpense');
      toast(`Dépense de ${sym()}${amount.toFixed(2)} enregistrée`, 'success');
      await loadJournal();
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  const _setPeriod = window.setPeriod;
  window.setPeriod = function (p) {
    if (typeof _setPeriod === 'function') _setPeriod(p);
    loadJournal();
  };

  /* ═══ 9. ORDONNANCE LIBRE ═══ */
  const _previewRx = window.previewRx;
  window.previewRx = async function () {
    if (typeof _previewRx === 'function') _previewRx();

    const items = [];
    document.querySelectorAll('.rx-item').forEach(el => {
      const n      = el.id.replace('rxItem', '');
      const name   = document.getElementById(`rxName${n}`)?.value.trim();
      const dosage = document.getElementById(`rxDosage${n}`)?.value.trim();
      const qty    = document.getElementById(`rxQty${n}`)?.value.trim();
      const dur    = document.getElementById(`rxDuration${n}`)?.value.trim();

      if (name) items.push({
        medication_name:     name,
        dosage_instructions: dosage || 'Selon prescription',
        quantity:            qty || null,
        duration:            dur || null,
      });
    });

    if (!items.length) return;

    try {
      const res = await AfyaAPI.prescriptions.create({
        patient_name:    document.getElementById('rxPatient')?.value.trim() || null,
        patient_age:     document.getElementById('rxAge')?.value.trim() || null,
        prescriber_name: document.getElementById('rxPrescriber')?.value.trim() || null,
        items,
      });
      console.log('Ordonnance enregistrée :', res.prescription?.prescription_number);
    } catch (e) {
      toast('Ordonnance affichée mais non enregistrée : ' + errMsg(e), 'error');
    }
  };

  /* ═══ 10. COMMANDES ═══ */
  async function loadOrders() {
    try {
      const { items } = await AfyaAPI.orders.list({ per_page: 50 });
      ORDERS.length = 0;
      items.forEach(o => ORDERS.push(o));
      if (typeof renderOrders === 'function') renderOrders();
    } catch (e) {
      ORDERS.length = 0;                       // ne JAMAIS retomber sur les exemples
      if (typeof renderOrders === 'function') renderOrders();
      console.error('Commandes :', e);
    }
  }

  /* ═══ 11. ALERTES ═══ */
  async function loadAlerts() {
    try {
      const data  = await AfyaAPI.alerts.list();
      const badge = document.getElementById('alertBadge');
      const total = (data.counts?.out_of_stock || 0)
                  + (data.counts?.low_stock    || 0)
                  + (data.counts?.expiry       || 0);
      if (badge) {
        badge.textContent   = total;
        badge.style.display = total > 0 ? 'inline-flex' : 'none';
      }
      const bn = document.getElementById('bnAlertBadge');
      if (bn) { bn.textContent = total; bn.style.display = total > 0 ? 'flex' : 'none'; }
    } catch (e) {
      console.error('Alertes :', e);
    }
  }

  /* ═══ 12. PARAMÈTRES ═══ */
  const _saveSettingsForm = window.saveSettingsForm;
  window.saveSettingsForm = async function () {
    if (typeof _saveSettingsForm === 'function') _saveSettingsForm();

    // Le symbole n'est jamais saisi : il découle de la devise
    S.currency_symbol = symbolFor(S.currency);

    setLoading(true);
    try {
      await AfyaAPI.settings.update({
        establishment_name:  S.pharmacy_name,
        currency:            S.currency,
        currency_symbol:     S.currency_symbol,
        invoice_format:      S.invoice_format,
        show_tva:            !!S.tva_enabled,
        tva_rate:            parseFloat(S.tva_rate) || 0,
        footer_text:         S.footer_text || null,
        prescription_footer: S.prescription_footer || null,
      });
      toast('Paramètres synchronisés', 'success');
    } catch (e) {
      toast('Enregistrés localement seulement', 'error');
      console.error('Paramètres :', e);
    } finally {
      setLoading(false);
    }
  };

  async function loadSettings() {
    try {
      const { settings, tenant } = await AfyaAPI.settings.get();

      if (tenant) {
        S.pharmacy_name = tenant.establishment_name || S.pharmacy_name;
        S.currency      = tenant.currency || S.currency;
      }
      // Le symbole se déduit toujours de la devise
      S.currency_symbol = symbolFor(S.currency);
      if (settings) {
        S.invoice_format      = settings.invoice_format || S.invoice_format;
        S.tva_rate            = parseFloat(settings.tva_rate) || S.tva_rate || 0;
        S.tva_enabled         = !!settings.show_tva;
        S.footer_text         = settings.footer_text || S.footer_text;
        S.prescription_footer = settings.prescription_footer || S.prescription_footer;
      }

      saveSettings(S);
      if (typeof initBrand === 'function') initBrand();
    } catch (e) {
      console.error('Paramètres :', e);
    }
  }

  /* ═══ 13. ONGLETS ═══
     On ne recharge PAS à chaque clic. On garde en mémoire la dernière
     mise à jour de chaque onglet et on ne rafraîchit que si les données
     ont plus de 30 s — comme le font les vraies applis. */

  const lastLoad = {};                 // { catalog: timestamp, ... }
  const FRESH_MS = 30000;              // 30 s

  function isFresh(key) {
    return lastLoad[key] && (Date.now() - lastLoad[key] < FRESH_MS);
  }
  function markLoaded(key) { lastLoad[key] = Date.now(); }

  /** Force le rechargement d'un onglet (après une action qui change les données) */
  function invalidate(...keys) {
    keys.forEach(k => delete lastLoad[k]);
  }

  const _switchTab = window.switchTab;
  window.switchTab = function (name) {
    if (typeof _switchTab === 'function') _switchTab(name);
    syncBottomNav(name);

    // Le symbole doit refléter la devise dès l'ouverture des paramètres
    if (name === 'settings') setTimeout(syncCurrencySymbol, 30);

    if ((name === 'catalog' || name === 'stock')) {
      if (!isFresh('meds')) { loadMedications().then(() => markLoaded('meds')); }
    }
    if (name === 'accounting') {
      if (!isFresh('journal')) loadJournal().then(() => markLoaded('journal'));
      loadPaymentBreakdown();
      loadLastClosure();
      // Toujours (re)brancher la délégation + décorer, car index.js a pu
      // réécrire le journal via son propre renderJournal().
      setTimeout(() => { bindJournalDelegation(); decorateJournalRows(); }, 60);
    }
    if (name === 'orders' && !isFresh('orders')) {
      loadOrders().then(() => markLoaded('orders'));
    }
    if (name === 'alerts' && !isFresh('alerts')) {
      loadAlerts().then(() => markLoaded('alerts'));
    }
  };


  /** Élargit les types acceptés par l'input photo (JPEG/PNG/WEBP) */
  function widenFileInput() {
    const inp = document.getElementById('photoInput');
    if (inp) inp.accept = 'image/jpeg,image/png,image/webp,image/heic';
  }



  /* ═══ ANNULATION DEPUIS LE JOURNAL (vente OU dépense) ═══
     Technique : DÉLÉGATION D'ÉVÉNEMENT.
     index.js réécrit tout le innerHTML du journal à chaque rendu, ce qui
     efface les listeners posés sur les lignes. On pose donc UN SEUL listener
     sur le conteneur parent (#journalRows), qui survit aux re-rendus. */

  let journalDelegationBound = false;

  function bindJournalDelegation() {
    const wrap = document.getElementById('journalRows');
    if (!wrap || journalDelegationBound) return;
    journalDelegationBound = true;

    wrap.style.cursor = 'default';
    wrap.addEventListener('click', (e) => {
      const row = e.target.closest('.jrow');
      if (!row) return;

      // Retrouver la donnée par la description affichée
      const descEl = row.querySelector('.jdesc');
      if (!descEl) return;
      const descText = descEl.childNodes[0]?.textContent?.trim() || descEl.textContent.trim();

      const j = JOURNAL.find(x => x.desc === descText);
      console.log('[Journal] clic sur ligne :', descText, '→ donnée trouvée :', j);

      if (!j) { console.warn('[Journal] aucune donnée JOURNAL ne correspond'); return; }
      if (j.cancelled) { toast('Cette écriture est déjà annulée', 'error'); return; }
      if (!j.cancellable) {
        console.log('[Journal] ligne non annulable. cancellable =', j.cancellable,
                    '| cancel_kind =', j.cancel_kind);
        toast('Cette écriture ne peut pas être annulée', 'error');
        return;
      }

      openJournalCancel(j);
    });

    console.log('[Journal] délégation de clic activée sur #journalRows');
  }

  /** Badges "ANNULÉE" + curseur main sur les lignes annulables */
  function decorateJournalRows() {
    const wrap = document.getElementById('journalRows');
    if (!wrap) return;
    bindJournalDelegation();

    wrap.querySelectorAll('.jrow').forEach(row => {
      const descEl = row.querySelector('.jdesc');
      if (!descEl || row.dataset.decorated) return;

      const descText = descEl.childNodes[0]?.textContent?.trim() || descEl.textContent.trim();
      const j = JOURNAL.find(x => x.desc === descText);
      if (!j) return;
      row.dataset.decorated = '1';

      if (j.cancelled) {
        row.style.opacity = '.5';
        const badge = document.createElement('span');
        badge.textContent = 'ANNULÉE';
        badge.style.cssText = 'font-size:10px;font-weight:800;color:var(--red,#dc2626);' +
          'background:var(--red-bg,rgba(220,38,38,.1));padding:1px 7px;border-radius:999px;margin-left:6px';
        descEl.appendChild(badge);
      } else if (j.cancellable) {
        row.style.cursor = 'pointer';
        row.title = 'Cliquer pour annuler';
      }
    });
  }

  // Re-décorer après chaque rendu du journal (quel que soit le chemin)
  const _renderJournal = window.renderJournal;
  window.renderJournal = function () {
    if (typeof _renderJournal === 'function') _renderJournal();
    setTimeout(decorateJournalRows, 10);
  };

  let cancelTarget = null;

  function openJournalCancel(j) {
    cancelTarget = { kind: j.cancel_kind, id: j.cancel_target, label: j.desc, amount: j.amount };
    console.log('[Journal] ouverture modale annulation :', cancelTarget);

    const c = sym();
    const isSale = j.cancel_kind === 'sale';
    document.getElementById('jcTitle').textContent = isSale ? 'Annuler la vente' : 'Annuler la dépense';
    document.getElementById('jcInfo').innerHTML =
      `<strong>${j.desc}</strong><br><span style="color:var(--mid)">Montant : ${c}${j.amount.toFixed(2)}</span>`;
    document.getElementById('jcWarn').textContent = isSale
      ? "Le stock sera remis et l'encaissement contre-passé. Irréversible."
      : "La dépense sera contre-passée dans le journal. Irréversible.";
    document.getElementById('jcReason').value = '';
    openModal('modalJournalCancel');
  }

  window.confirmJournalCancel = async function () {
    const reason = document.getElementById('jcReason').value.trim();
    if (reason.length < 3) { toast('Indiquez un motif (min. 3 caractères)', 'error'); return; }
    if (!cancelTarget) return;

    setLoading(true);
    try {
      if (cancelTarget.kind === 'sale') {
        await AfyaAPI.sales.cancel(cancelTarget.id, reason);
        toast('Vente annulée, stock rétabli', 'success');
        invalidate('meds', 'alerts');
        await loadMedications();
      } else {
        await AfyaAPI.accounting.cancelExpense(cancelTarget.id, reason);
        toast('Dépense annulée', 'success');
      }
      closeModal('modalJournalCancel');
      invalidate('journal');
      await loadJournal();
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ═══ MENU UTILISATEUR  /* ═══ MENU UTILISATEUR + DÉCONNEXION ═══ */
  function setupUserMenu(user) {
    const avatar = document.querySelector('.tb-avatar');
    if (!avatar) return;

    const initials = (user?.name || '')
      .trim().split(/\s+/).slice(0, 2)
      .map(w => w[0] || '').join('').toUpperCase() || 'PH';
    avatar.textContent = initials;
    avatar.title = user?.name || '';
    avatar.style.cursor = 'pointer';

    const actions = avatar.closest('.tb-actions') || avatar.parentElement;
    if (actions) actions.style.position = 'relative';

    if (document.getElementById('phUserMenu')) return;
    const menu = document.createElement('div');
    menu.id = 'phUserMenu';
    menu.style.cssText =
      'position:absolute;top:calc(100% + 10px);right:0;min-width:220px;z-index:9000;' +
      'background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;' +
      'box-shadow:0 18px 50px rgba(0,0,0,.16);padding:8px;' +
      'opacity:0;visibility:hidden;transform:translateY(-8px);' +
      'transition:opacity .18s,transform .18s,visibility .18s;font-family:Manrope,sans-serif';

    menu.innerHTML = `
      <div style="padding:10px 12px 12px;border-bottom:1px solid rgba(0,0,0,.07);margin-bottom:6px">
        <div style="font-size:14px;font-weight:800;color:#111">${user?.name || 'Utilisateur'}</div>
        <div style="font-size:11.5px;color:#9A9A95;font-weight:600;margin-top:2px">
          ${user?.tenant?.establishment_name || ''}</div>
      </div>
      <a href="../../index.html" style="display:flex;align-items:center;gap:10px;padding:10px 12px;
         border-radius:10px;font-size:13px;font-weight:600;color:#111;text-decoration:none">
        Tableau de bord</a>
      <div style="height:1px;background:rgba(0,0,0,.07);margin:6px 4px"></div>
      <button type="button" id="phLogout" style="display:flex;align-items:center;gap:10px;
              padding:10px 12px;border-radius:10px;font-size:13px;font-weight:600;color:#dc2626;
              background:none;border:none;cursor:pointer;width:100%;text-align:left;font-family:inherit">
        Se déconnecter</button>`;

    (actions || document.body).appendChild(menu);

    menu.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = 'rgba(0,0,0,.05)');
      el.addEventListener('mouseleave', () => el.style.background = 'none');
    });

    avatar.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.style.visibility === 'visible';
      menu.style.opacity = open ? '0' : '1';
      menu.style.visibility = open ? 'hidden' : 'visible';
      menu.style.transform = open ? 'translateY(-8px)' : 'translateY(0)';
    });
    document.addEventListener('click', e => {
      if (!menu.contains(e.target) && e.target !== avatar) {
        menu.style.opacity = '0'; menu.style.visibility = 'hidden';
        menu.style.transform = 'translateY(-8px)';
      }
    });

    menu.querySelector('#phLogout').addEventListener('click', async () => {
      setLoading(true);
      try { await AfyaAPI.auth.logout(); } catch (e) {}
      finally {
        localStorage.removeItem('afya_modules');
        localStorage.removeItem('afya_user');
        window.location.href = '../../login.html';
      }
    });
  }

  /* ═══ CLÔTURE DE CAISSE ═══ */
  let closureData = null;

  window.openClosureModal = async function () {
    openModal('modalClosure');
    document.getElementById('closureLoading').style.display = 'block';
    document.getElementById('closureContent').style.display = 'none';
    document.getElementById('closureAlready').style.display = 'none';

    try {
      closureData = await AfyaAPI.accounting.closurePreview();
      const c = sym();

      document.getElementById('closureLoading').style.display = 'none';

      if (closureData.already_closed) {
        document.getElementById('closureAlready').style.display = 'block';
        document.getElementById('clConfirmBtn').style.display = 'none';
        return;
      }

      document.getElementById('closureContent').style.display = 'block';
      document.getElementById('clConfirmBtn').style.display = '';

      const put = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = c + (v || 0).toFixed(2); };
      put('clOpening',  closureData.opening_balance);
      put('clIncome',   closureData.total_income);
      put('clExpense',  closureData.total_expense);
      put('clExpected', closureData.expected_balance);
      put('clCash',     closureData.cash_income);
      document.getElementById('clSalesCount').textContent = closureData.sales_count || 0;

      document.getElementById('clActual').value = '';
      document.getElementById('clDiffBox').style.display = 'none';
    } catch (e) {
      document.getElementById('closureLoading').textContent = errMsg(e);
    }
  };

  window.updateClosureDiff = function () {
    if (!closureData) return;
    const actual = parseFloat(document.getElementById('clActual').value);
    const box = document.getElementById('clDiffBox');
    if (!Number.isFinite(actual)) { box.style.display = 'none'; return; }

    const diff = actual - closureData.expected_balance;
    const c = sym();
    box.style.display = 'block';

    if (Math.abs(diff) < 0.01) {
      box.style.background = 'rgba(22,163,74,.12)';
      box.style.color = '#16a34a';
      box.textContent = '✓ Caisse équilibrée';
    } else if (diff > 0) {
      box.style.background = 'rgba(59,130,246,.12)';
      box.style.color = '#2563eb';
      box.textContent = `Excédent de ${c}${diff.toFixed(2)}`;
    } else {
      box.style.background = 'rgba(220,38,38,.12)';
      box.style.color = '#dc2626';
      box.textContent = `Manquant de ${c}${Math.abs(diff).toFixed(2)}`;
    }
  };

  window.confirmClosure = async function () {
    const actual = parseFloat(document.getElementById('clActual').value);
    if (!Number.isFinite(actual) || actual < 0) {
      toast('Saisissez le montant réel compté', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await AfyaAPI.accounting.close({
        actual_closing_balance: actual,
        notes: document.getElementById('clNotes').value.trim() || null,
      });
      closeModal('modalClosure');
      const c = sym();
      toast(res.balanced
        ? 'Caisse clôturée — équilibrée'
        : `Caisse clôturée — écart de ${c}${Math.abs(res.discrepancy).toFixed(2)}`,
        res.balanced ? 'success' : 'error');
      invalidate('journal');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  };


  /* ═══ UI MOBILE : hero organes + profil + nav bar ═══ */
  const AFYA_ORGANS = [
    { img:'../../media/lung2.png',    bg:'radial-gradient(ellipse at 62% 45%, #123456 0%, #0a1f38 55%, #061424 100%)' },
    { img:'../../media/heart.png',    bg:'radial-gradient(ellipse at 62% 45%, #4a1010 0%, #2a0808 55%, #140404 100%)' },
    { img:'../../media/brain.png',    bg:'radial-gradient(ellipse at 62% 45%, #2a1040 0%, #180828 55%, #0c0418 100%)' },
    { img:'../../media/stomach.png',  bg:'radial-gradient(ellipse at 62% 45%, #3a2a00 0%, #241a00 55%, #120d00 100%)' },
    { img:'../../media/skeleton.png', bg:'radial-gradient(ellipse at 62% 45%, #103020 0%, #081810 55%, #040c08 100%)' },
  ];
  let afyaOrganIdx = 0;
  let afyaOrganTimer = null;

  function rotateAfyaOrgan() {
    const hero = document.getElementById('afyaHero');
    const img  = document.getElementById('afyaHeroOrgan');
    if (!hero || !img) return;
    hero.style.background = AFYA_ORGANS[afyaOrganIdx].bg;
    img.src = AFYA_ORGANS[afyaOrganIdx].img;
    document.querySelectorAll('#afyaHeroDots span')
      .forEach((d, i) => d.classList.toggle('on', i === afyaOrganIdx));
    afyaOrganIdx = (afyaOrganIdx + 1) % AFYA_ORGANS.length;
  }

  function startHeroOrgans() {
    if (afyaOrganTimer) return;
    rotateAfyaOrgan();
    afyaOrganTimer = setInterval(rotateAfyaOrgan, 4000);
  }

  function fillMobileProfile(user) {
    const nm = document.getElementById('afyaProfileName');
    const rl = document.getElementById('afyaProfileRole');
    const av = document.getElementById('afyaProfileAv');
    const initials = (user?.name || '').trim().split(/\s+/).slice(0,2)
      .map(w => w[0]||'').join('').toUpperCase() || 'PH';
    if (nm) nm.textContent = user?.name || 'Pharmacien';
    if (rl) rl.textContent = (user?.is_owner ? 'Propriétaire' : 'Pharmacien')
      + (user?.tenant?.establishment_name ? ' · ' + user.tenant.establishment_name : '');
    if (av) av.textContent = initials;

    const sub = document.getElementById('afyaHeroSub');
    if (sub) sub.textContent = `${MEDICATIONS.length} référence(s) en stock`;
  }

  /* Synchronise l'état actif de la nav bar basse avec l'onglet courant */
  function syncBottomNav(name) {
    document.querySelectorAll('.bottom-nav-item[data-tab]').forEach(i =>
      i.classList.toggle('active', i.dataset.tab === name));
  }

  
  /* ═══ DEVISE : le symbole découle du choix, on ne le saisit plus ═══ */
  const CURRENCY_SYMBOLS = {
    USD: '$',   CDF: 'FC',  EUR: '€',   XOF: 'CFA', XAF: 'FCFA',
    NGN: '₦',   KES: 'KSh', ZAR: 'R',   GHS: '₵',   TZS: 'TSh',
    UGX: 'USh', RWF: 'FRw', ZMW: 'ZK',  AOA: 'Kz',  GBP: '£',
  };

  function symbolFor(code) {
    return CURRENCY_SYMBOLS[String(code || '').toUpperCase()] || '$';
  }

  /** Aligne le champ symbole (et l'affichage) sur la devise choisie */
  function syncCurrencySymbol() {
    const sel = document.getElementById('setCurrency');
    const box = document.getElementById('setCurrencySymbol');
    if (!sel) return;
    const symbol = symbolFor(sel.value);
    S.currency_symbol = symbol;
    if (box) {
      box.value = symbol;
      box.readOnly = true;
      box.style.background = 'rgba(0,0,0,.04)';
      box.style.cursor = 'not-allowed';
      box.title = 'Défini automatiquement par la devise';
    }
  }


  /* ═══════════════════════════════════════════════════════════
     PANIER DE VENTE — plusieurs médicaments, une seule facture

     Le panier vit côté navigateur (sessionStorage) : tant que la
     vente n'est pas validée, elle n'a rien à faire en base. Un
     rafraîchissement accidentel ne fait pas perdre la saisie du
     comptoir, mais rien ne traîne côté serveur.
  ═══════════════════════════════════════════════════════════ */

  let CART = [];
  const CART_KEY = 'afya_cart';

  function cartLoad() {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      CART = raw ? JSON.parse(raw) : [];
    } catch (e) { CART = []; }
  }

  function cartSave() {
    try { sessionStorage.setItem(CART_KEY, JSON.stringify(CART)); }
    catch (e) { /* stockage plein ou bloqué : le panier reste en mémoire */ }
  }

  /** Unité de vente proposée par défaut pour ce médicament */
  function defaultUnit(m) {
    const units = (m.sale_units && m.sale_units.length) ? m.sale_units : ['boite'];
    return units.includes('boite') ? 'boite' : units[0];
  }

  /** Combien d'unités de base représente une quantité dans cette unité ? */
  function toBaseUnits(m, unitCode, qty) {
    const pack  = m.pack_size || 1;
    const strip = m.units_per_strip || 1;
    switch (unitCode) {
      case 'carton':    return qty * pack * 12;
      case 'boite':     return qty * pack;
      case 'plaquette': return qty * strip;
      default:          return qty;
    }
  }

  window.addToCart = function (medId) {
    const m = MEDICATIONS.find(x => x.id === medId);
    if (!m) return;

    if (m.stock <= 0) {
      toast(`${m.name} est en rupture de stock`, 'error');
      return;
    }

    const unit = defaultUnit(m);
    const line = CART.find(l => l.id === medId && l.unit === unit);

    if (line) {
      line.qty += 1;
      toast(`${m.name} — ${line.qty} ${UNIT_LABELS[unit] || unit}`, 'success');
    } else {
      CART.push({ id: medId, unit, qty: 1 });
      toast(`${m.name} ajouté au panier`, 'success');
    }

    cartSave();
    updateCartBadge();
  };

  window.removeCartLine = function (index) {
    CART.splice(index, 1);
    cartSave();
    updateCartBadge();
    renderCart();
  };

  window.setCartQty = function (index, qty) {
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n < 1) return;
    CART[index].qty = n;
    cartSave();
    updateCartBadge();
    renderCart();
  };

  window.bumpCartQty = function (index, delta) {
    const next = (CART[index].qty || 1) + delta;
    if (next < 1) { removeCartLine(index); return; }
    CART[index].qty = next;
    cartSave();
    updateCartBadge();
    renderCart();
  };

  window.setCartUnit = function (index, unitCode) {
    CART[index].unit = unitCode;
    cartSave();
    renderCart();
  };

  window.clearCart = function () {
    if (!CART.length) return;
    if (!confirm('Vider le panier ?')) return;
    CART = [];
    cartSave();
    updateCartBadge();
    renderCart();
  };

  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const n = CART.reduce((s, l) => s + (l.qty || 0), 0);
    badge.textContent = n;
    badge.style.display = n > 0 ? 'inline-flex' : 'none';
  }

  window.openCart = function () {
    renderCart();
    openModal('modalCart');
  };

  /** Totaux du panier : sous-total, remise, net */
  function cartTotals() {
    let sub = 0;
    CART.forEach(l => {
      const m = MEDICATIONS.find(x => x.id === l.id);
      if (m) sub += unitPrice(m, l.unit) * l.qty;
    });
    const raw      = parseFloat(document.getElementById('cartDiscount')?.value) || 0;
    const discount = Math.min(Math.max(raw, 0), sub);
    return { sub, discount, total: sub - discount };
  }

  window.renderCart = function () {
    const host   = document.getElementById('cartLines');
    const empty  = document.getElementById('cartEmpty');
    const form   = document.getElementById('cartForm');
    const clear  = document.getElementById('cartClearBtn');
    const submit = document.getElementById('cartConfirmBtn');
    if (!host) return;

    const c = sym();

    if (!CART.length) {
      host.innerHTML = '';
      if (empty)  empty.style.display  = 'block';
      if (form)   form.style.display   = 'none';
      if (clear)  clear.style.display  = 'none';
      if (submit) submit.style.display = 'none';
      return;
    }

    if (empty)  empty.style.display  = 'none';
    if (form)   form.style.display   = 'block';
    if (clear)  clear.style.display  = '';
    if (submit) submit.style.display = '';

    host.innerHTML = CART.map((l, i) => {
      const m = MEDICATIONS.find(x => x.id === l.id);
      if (!m) return '';

      const units   = (m.sale_units && m.sale_units.length) ? m.sale_units : ['boite'];
      const up      = unitPrice(m, l.unit);
      const lineSum = up * l.qty;
      const needed  = toBaseUnits(m, l.unit, l.qty);
      const short   = needed > m.stock;

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:13px 2px;
                    border-bottom:1px solid var(--border)">

          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px">${m.name}
              ${m.strength ? `<span style="font-weight:500;color:var(--mid)">${m.strength}</span>` : ''}
            </div>
            <div style="font-size:11.5px;color:var(--mid);margin-top:2px">
              ${c}${up.toFixed(2)} / ${UNIT_LABELS[l.unit] || l.unit}
              ${short ? `<span style="color:var(--red,#e53e3e);font-weight:700"> · stock insuffisant (${m.stock} ${m.base_unit})</span>` : ''}
            </div>
          </div>

          <select class="ph-select" style="flex:0 0 128px;padding:8px 10px;font-size:12.5px"
                  onchange="setCartUnit(${i}, this.value)">
            ${units.map(u => `<option value="${u}" ${u === l.unit ? 'selected' : ''}>${UNIT_LABELS[u] || u}</option>`).join('')}
          </select>

          <div style="display:flex;align-items:center;gap:4px;flex:0 0 auto">
            <button class="qty-btn" style="width:30px;height:30px" onclick="bumpCartQty(${i},-1)">−</button>
            <input class="qty-input" style="width:52px;height:30px;font-size:13px" type="number" min="1"
                   value="${l.qty}" onchange="setCartQty(${i}, this.value)">
            <button class="qty-btn" style="width:30px;height:30px" onclick="bumpCartQty(${i},1)">+</button>
          </div>

          <div style="flex:0 0 86px;text-align:right;font-weight:800;font-size:14px">
            ${c}${lineSum.toFixed(2)}
          </div>

          <button onclick="removeCartLine(${i})" title="Retirer"
                  style="flex:0 0 auto;width:28px;height:28px;border-radius:8px;
                         border:1px solid var(--border);background:var(--card);cursor:pointer;
                         display:flex;align-items:center;justify-content:center;color:var(--red,#e53e3e)">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 12L12 2M2 2l10 10"/></svg>
          </button>
        </div>`;
    }).join('');

    const { sub, discount, total } = cartTotals();
    const totalEl = document.getElementById('cartTotal');
    const brk     = document.getElementById('cartBreakdown');
    if (totalEl) totalEl.textContent = `${c}${total.toFixed(2)}`;
    if (brk) {
      const nb = CART.reduce((s, l) => s + l.qty, 0);
      brk.textContent = discount > 0
        ? `${nb} article(s) — sous-total ${c}${sub.toFixed(2)}, remise ${c}${discount.toFixed(2)}`
        : `${nb} article(s) dans le panier`;
    }
  };

  window.confirmCartSale = async function () {
    if (!CART.length) return;

    // Contrôle du stock avant d'appeler le serveur
    const problems = [];
    CART.forEach(l => {
      const m = MEDICATIONS.find(x => x.id === l.id);
      if (!m) return;
      if (toBaseUnits(m, l.unit, l.qty) > m.stock) problems.push(m.name);
    });
    if (problems.length) {
      toast(`Stock insuffisant : ${problems.join(', ')}`, 'error');
      return;
    }

    const { discount } = cartTotals();
    const rx = document.getElementById('cartRxRef')?.value.trim();

    const items = CART.map(l => {
      const m = MEDICATIONS.find(x => x.id === l.id);
      return {
        medication_id:  l.id,
        quantity:       l.qty,
        sale_unit_code: l.unit,
        unit_price:     unitPrice(m, l.unit),
      };
    });

    setLoading(true);
    try {
      const res = await AfyaAPI.sales.create({
        items,
        payment_method:  document.getElementById('cartPayMethod').value,
        customer_name:   document.getElementById('cartCustomer').value.trim() || null,
        discount_amount: discount,
        notes:           rx ? `Ordonnance : ${rx}` : null,
      });

      CART = [];
      cartSave();
      updateCartBadge();
      closeModal('modalCart');
      toast('Vente enregistrée', 'success');

      invalidate('meds', 'journal', 'alerts', 'sales');
      await loadMedications();

      // Une seule facture pour toute la commande
      if (typeof showCartInvoice === 'function') showCartInvoice(res.sale, items);
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  /** Facture unique reprenant toutes les lignes du panier.
     Utilise la même structure que showInvoice() d'index.js pour
     que l'impression garde exactement la même mise en page. */
  function showCartInvoice(sale, items) {
    const body = document.getElementById('invoiceBody');
    if (!body || !sale) return;

    const c  = sym();
    const now = new Date();

    const rows = (items || []).map(it => {
      const m    = MEDICATIONS.find(x => x.id === it.medication_id);
      const name = m ? `${m.name} ${m.strength || ''}`.trim() : 'Article';
      const qty  = it.quantity || 0;
      const up   = parseFloat(it.unit_price || 0);
      const unit = UNIT_LABELS[it.sale_unit_code] || it.sale_unit_code || '';
      return `<div class="inv-row">
                <span>${name} × ${qty} ${unit}${qty > 1 ? 's' : ''}</span>
                <span>${c}${(qty * up).toFixed(2)}</span>
              </div>`;
    }).join('');

    const disc  = parseFloat(sale.discount_amount || 0);
    const tva   = parseFloat(sale.tax_amount || 0);
    const total = parseFloat(sale.total_amount || 0);

    body.innerHTML = `
      <div class="inv-preview">
        <div class="inv-hd">
          <div class="inv-pharma">${S.pharmacy_name || 'Pharmacie'}</div>
          <div class="inv-meta">Reçu de vente · Format ${S.invoice_format || 'A4'}</div>
        </div>
        <div class="inv-row"><span>N° Reçu</span><strong>${sale.sale_number || '—'}</strong></div>
        <div class="inv-row"><span>Date</span><span>${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
        ${sale.customer_name ? `<div class="inv-row"><span>Client</span><span>${sale.customer_name}</span></div>` : ''}
        <div class="inv-row"><span>Paiement</span><span>${sale.payment_method || ''}</span></div>
        <div style="font-weight:700;margin:10px 0 5px">Détail (${items.length} article${items.length > 1 ? 's' : ''})</div>
        ${rows}
        ${disc > 0 ? `<div class="inv-row"><span>Remise</span><span>− ${c}${disc.toFixed(2)}</span></div>` : ''}
        ${tva  > 0 ? `<div class="inv-row"><span>TVA (${S.tva_rate}%)</span><span>${c}${tva.toFixed(2)}</span></div>` : ''}
        <div class="inv-row total"><span>TOTAL</span><span>${c}${total.toFixed(2)}</span></div>
        <div class="inv-ft">${S.footer_text || 'Merci de votre confiance.'}</div>
      </div>`;

    openModal('modalInvoice');
  }

  /** Bouton + sur chaque carte du catalogue */
  function decorateCatalogCards() {
    document.querySelectorAll('#medGrid .med-card, #stockGrid .med-card').forEach(card => {
      if (card.dataset.cartBtn) return;
      const oc = card.getAttribute('onclick') || '';
      const hit = oc.match(/openMedModal\((\d+)\)/);
      const id = hit ? parseInt(hit[1], 10) : NaN;
      if (!Number.isFinite(id)) return;
      card.dataset.cartBtn = '1';
      card.style.position = 'relative';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = 'Ajouter au panier';
      btn.style.cssText =
        'position:absolute;bottom:10px;right:10px;z-index:4;width:32px;height:32px;' +
        'border-radius:10px;border:none;background:var(--accent,#EFFF3A);cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;' +
        'box-shadow:0 4px 12px rgba(239,255,58,.5);transition:transform .18s';
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#12120f" ' +
        'stroke-width="2.4" stroke-linecap="round"><path d="M8 2v12M2 8h12"/></svg>';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();          // ne pas ouvrir la fiche
        addToCart(id);
        btn.style.transform = 'scale(1.25)';
        setTimeout(() => { btn.style.transform = ''; }, 180);
      });

      card.appendChild(btn);
    });
  }



  /* Le + doit réapparaître après chaque rendu, car index.js
     réécrit entièrement la grille. */
  ['renderCatalog', 'renderStock'].forEach(function (fnName) {
    const original = window[fnName];
    if (typeof original !== 'function') return;
    window[fnName] = function () {
      original.apply(this, arguments);
      setTimeout(decorateCatalogCards, 10);
    };
  });

  /* ═══ 14. INIT ═══ */
  async function init() {
    setLoading(true);
    try {
      const user = await AfyaAPI.auth.me();
      setupUserMenu(user);
      startHeroOrgans();
      window.__afyaUser = user;

      if (user.tenant?.modules && !user.tenant.modules.includes('pharmacy')) {
        toast('Module Pharmacie non actif', 'error');
        setTimeout(() => { window.location.href = '../../pricing.html'; }, 2000);
        return;
      }

      widenFileInput();

      await loadRefs();

      // La devise pilote le symbole : on écoute son changement
      const curSel = document.getElementById('setCurrency');
      if (curSel) curSel.addEventListener('change', syncCurrencySymbol);

      // Le formulaire de conditionnement se reconstruit quand on change
      // la forme galénique (comprimé, gel, sirop, ampoule…)
      document.getElementById('addForm')?.addEventListener('change', () => {
        renderPackagingBlock();
        onPackagingInput();
      });

      // On charge le CATALOGUE en priorité (c'est l'écran affiché).
      // Le reste (settings, alertes) se charge en arrière-plan sans bloquer,
      // pour ne pas saturer le serveur de dev mono-processus.
      await loadMedications();  markLoaded('meds');
      cartLoad();
      updateCartBadge();
      decorateCatalogCards();
      fillMobileProfile(window.__afyaUser);

      loadSettings();
      loadAlerts().then(() => markLoaded('alerts'));
      // journal & orders : chargés à l'ouverture de leur onglet

      console.log('✅ Pharmacie prête —', MEDICATIONS.length, 'médicament(s)');
    } catch (e) {
      if (e.status === 401) return;
      toast(errMsg(e), 'error');
      console.error('Init :', e);
    } finally {
      setLoading(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 120));
  } else {
    setTimeout(init, 120);
  }

  window._afya = { loadMedications, loadJournal, loadOrders, loadAlerts, refs: () => REFS };

})();