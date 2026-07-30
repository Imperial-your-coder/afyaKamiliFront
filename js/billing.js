/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — PAIEMENT MOBILE MONEY

   Le client dépose sur le numéro indiqué, relève la référence
   du SMS de confirmation, et la déclare ici. Un administrateur
   vérifie puis active l'abonnement.

   À charger sur le tableau de bord :
     <script src="./js/afya_api.js" defer></script>
     <script src="./js/billing.js" defer></script>
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const OM = {
    orange: '#FF7900',
    dark:   '#0B0B0B',
    beige:  '#F0EEE6',
    card:   '#F8F8F3',
    mid:    '#8B8D86',
    line:   'rgba(0,0,0,.09)',
    green:  '#16a34a',
    red:    '#dc2626',
  };

  let INFO   = null;
  let PLANS  = [];
  let picked = { plan: 'starter', cycle: 'monthly' };
  let file   = null;

  const $ = (id) => document.getElementById(id);

  function money(n) {
    return '$' + Number(n || 0).toFixed(2).replace(/\.00$/, '');
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function toast(msg, isError) {
    let t = $('billingToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'billingToast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);' +
        'padding:13px 22px;border-radius:999px;font-size:13.5px;font-weight:700;color:#fff;' +
        'z-index:100000;opacity:0;transition:all .3s cubic-bezier(.22,1,.36,1);' +
        'box-shadow:0 12px 34px rgba(0,0,0,.22);max-width:88vw;text-align:center';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = isError ? OM.red : OM.dark;
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(t._h);
    t._h = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 4000);
  }

  function errMsg(e) {
    if (e && e.validationErrors) {
      const first = Object.values(e.validationErrors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
    return (e && e.message) || 'Une erreur est survenue.';
  }

  /* ═══ STRUCTURE ═══ */

  function build() {
    if ($('billingModal')) return;

    const wrap = document.createElement('div');
    wrap.id = 'billingModal';
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;' +
      'background:rgba(11,11,11,.55);backdrop-filter:blur(10px);padding:20px';

    wrap.innerHTML = `
      <div id="billingSheet" style="background:${OM.card};border-radius:28px;max-width:520px;width:100%;
           max-height:92vh;overflow-y:auto;box-shadow:0 34px 80px rgba(0,0,0,.36);
           font-family:Manrope,system-ui,sans-serif;color:${OM.dark}">

        <!-- Bandeau opérateur -->
        <div style="background:${OM.orange};padding:22px 26px;border-radius:28px 28px 0 0;position:relative">
          <button id="billingClose" style="position:absolute;top:18px;right:18px;width:30px;height:30px;
                  border:none;border-radius:50%;background:rgba(0,0,0,.18);color:#fff;cursor:pointer;
                  font-size:17px;line-height:1;display:flex;align-items:center;justify-content:center">&times;</button>
          <div style="font-size:10.5px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;
                      color:rgba(255,255,255,.85)">Paiement mobile money</div>
          <div id="billingTitle" style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;
                      margin-top:5px">Activer mon abonnement</div>
          <div id="billingSub" style="font-size:13px;color:rgba(255,255,255,.9);margin-top:3px"></div>
        </div>

        <div style="padding:24px 26px 26px">
          <div id="billingBody"></div>
        </div>
      </div>`;

    document.body.appendChild(wrap);

    // Les trois voies de fermeture passent toutes par close(), qui
    // refuse d'agir quand le modal est verrouillé. Une seule règle à
    // maintenir, impossible d'en oublier une.
    $('billingClose').addEventListener('click', close);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrap.style.display === 'flex') close();
    });
  }

  /* Modal impossible à fermer : accès expiré. */
  let LOCKED = false;

  function setLocked(on) {
    LOCKED = !!on;
    const x = $('billingClose');
    if (x) x.style.display = on ? 'none' : 'flex';
  }

  function open()  { build(); $('billingModal').style.display = 'flex'; }

  function close() {
    if (LOCKED) return;                 // expiré : aucune sortie
    const m = $('billingModal');
    if (m) m.style.display = 'none';
  }

  /* ═══ ÉCRANS ═══ */

  /** Dossier en cours de vérification */
  function viewPending(p) {
    $('billingTitle').textContent = 'Vérification en cours';
    $('billingSub').textContent   = 'Nous contrôlons votre dépôt';

    $('billingBody').innerHTML = `
      <div style="text-align:center;padding:8px 0 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,121,0,.12);
                    display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${OM.orange}"
               stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
        </div>
        <div style="font-size:16px;font-weight:800;margin-bottom:6px">Votre déclaration est enregistrée</div>
        <div style="font-size:13.5px;color:#55554f;line-height:1.6;max-width:380px;margin:0 auto">
          Nous vérifions le dépôt et activons votre formule dès confirmation.
          <strong>Votre accès reste ouvert</strong> pendant ce temps.
        </div>
      </div>

      <div style="background:${OM.beige};border-radius:16px;padding:16px;font-size:13px">
        <div style="display:flex;justify-content:space-between;padding:5px 0">
          <span style="color:${OM.mid}">Référence</span>
          <strong style="font-family:ui-monospace,monospace">${esc(p.reference)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 0">
          <span style="color:${OM.mid}">Formule</span>
          <strong>${esc(planLabel(p.plan_code))} · ${p.billing_cycle === 'yearly' ? 'annuel' : 'mensuel'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 0">
          <span style="color:${OM.mid}">Montant</span>
          <strong>${money(p.amount)}</strong>
        </div>
      </div>

      ${INFO.payment.whatsapp ? `
      <a href="https://wa.me/${String(INFO.payment.whatsapp).replace(/[^0-9]/g,'')}"
         target="_blank" rel="noopener"
         style="display:flex;align-items:center;justify-content:center;gap:9px;margin-top:16px;
                padding:14px;border-radius:999px;background:#25D366;color:#fff;font-weight:700;
                font-size:14px;text-decoration:none">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1112 20z"/></svg>
        Envoyer la capture par WhatsApp
      </a>` : ''}

      <button onclick="AfyaBilling.close()" style="width:100%;margin-top:12px;padding:14px;
              border-radius:999px;border:1.5px solid ${OM.line};background:#fff;
              font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">
        Continuer à utiliser Afya Kamili
      </button>`;
  }

  /** Formulaire de déclaration */
  function viewForm() {
    const t = INFO.tenant;
    const expired = t.days_left <= 0;

    $('billingTitle').textContent = expired ? 'Votre essai est terminé' : 'Activer mon abonnement';
    $('billingSub').textContent   = expired
      ? 'Activez votre formule pour continuer'
      : `${t.days_left} jour${t.days_left > 1 ? 's' : ''} d'essai restant${t.days_left > 1 ? 's' : ''}`;

    const rejected = INFO.last_rejected;

    $('billingBody').innerHTML = `
      ${rejected ? `
        <div style="background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.22);
                    border-radius:14px;padding:13px 15px;margin-bottom:18px">
          <div style="font-size:12.5px;font-weight:800;color:${OM.red};margin-bottom:4px">
            Déclaration précédente refusée</div>
          <div style="font-size:12.5px;color:#7f1d1d">${esc(rejected.review_note || '')}</div>
        </div>` : ''}

      <!-- 1. Choix de la formule -->
      <div style="font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;
                  color:${OM.mid};margin-bottom:10px">1 · Choisissez votre formule</div>

      <div id="planList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px"></div>

      <div style="display:flex;gap:8px;margin-bottom:22px">
        <button class="cyc" data-cycle="monthly" style="flex:1;padding:11px;border-radius:12px;
                border:1.5px solid ${OM.line};background:#fff;font-family:inherit;font-size:13px;
                font-weight:700;cursor:pointer">Mensuel</button>
        <button class="cyc" data-cycle="yearly" style="flex:1;padding:11px;border-radius:12px;
                border:1.5px solid ${OM.line};background:#fff;font-family:inherit;font-size:13px;
                font-weight:700;cursor:pointer">Annuel <span style="color:${OM.green}">−15 %</span></button>
      </div>

      <!-- 2. Instructions de dépôt -->
      <div style="font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;
                  color:${OM.mid};margin-bottom:10px">2 · Effectuez le dépôt</div>

      <div style="background:${OM.dark};border-radius:18px;padding:20px;margin-bottom:22px">
        <div style="font-size:11.5px;color:rgba(255,255,255,.55);margin-bottom:5px">
          Déposez <strong id="dueAmount" style="color:${OM.orange}">—</strong> sur ce numéro
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
          <div style="flex:1;font-size:23px;font-weight:800;color:#fff;letter-spacing:.5px;
                      font-family:ui-monospace,monospace" id="payNumber">—</div>
          <button id="copyNumber" style="padding:9px 15px;border-radius:10px;border:none;
                  background:${OM.orange};color:#fff;font-family:inherit;font-size:12.5px;
                  font-weight:700;cursor:pointer;flex-shrink:0">Copier</button>
        </div>
        <div id="payHolder" style="font-size:12px;color:rgba(255,255,255,.6);margin-top:8px"></div>
      </div>

      <!-- 3. Déclaration -->
      <div style="font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;
                  color:${OM.mid};margin-bottom:6px">3 · Déclarez votre paiement</div>
      <div style="font-size:12.5px;color:#55554f;margin-bottom:14px;line-height:1.55">
        Après le dépôt, vous recevez un SMS contenant une référence
        (<span style="font-family:ui-monospace,monospace;background:rgba(0,0,0,.05);
         padding:1px 6px;border-radius:5px">Ref: CI260711.0746.B11205</span>). Recopiez-la ici.
      </div>

      <label style="display:block;margin-bottom:12px">
        <span style="display:block;font-size:11px;font-weight:800;letter-spacing:.6px;
                     text-transform:uppercase;color:${OM.mid};margin-bottom:6px">Référence du SMS</span>
        <input id="bRef" placeholder="CI260711.0746.B11205"
               style="width:100%;padding:13px 15px;border:1.5px solid ${OM.line};border-radius:13px;
                      font-family:ui-monospace,monospace;font-size:14px;outline:none;background:#fff;
                      text-transform:uppercase">
      </label>

      <!-- Le sélecteur d'opérateur a été retiré : un seul canal est
           ouvert aujourd'hui, et proposer quatre choix inutilisables
           promettait des moyens de paiement qui n'existent pas. La
           valeur 'orange' est envoyée en dur ; le jour où d'autres
           opérateurs s'ajouteront, le select reviendra ici et
           l'enum de la base l'accepte déjà. -->
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <label style="flex:1">
          <span style="display:block;font-size:11px;font-weight:800;letter-spacing:.6px;
                       text-transform:uppercase;color:${OM.mid};margin-bottom:6px">Votre numéro</span>
          <input id="bPhone" placeholder="0990 000 000"
                 style="width:100%;padding:13px 15px;border:1.5px solid ${OM.line};border-radius:13px;
                        font-family:inherit;font-size:13.5px;outline:none;background:#fff">
        </label>
      </div>

      <!-- Deux façons de prouver le dépôt : la référence recopiée
           ci-dessus, OU une image du SMS. L'une suffit — la référence
           est de toute façon lisible sur la photo. On n'impose donc
           ni l'une ni l'autre, mais on refuse un envoi sans aucune. -->
      <div style="display:flex;gap:9px;margin-bottom:10px">
        <button type="button" id="bCam" style="flex:1;padding:13px 10px;border-radius:13px;
                border:1.5px solid ${OM.line};background:#fff;cursor:pointer;
                font-family:inherit;font-size:12.5px;font-weight:700;color:${OM.dark};
                display:flex;align-items:center;justify-content:center;gap:7px">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/></svg>
          Prendre en photo
        </button>
        <button type="button" id="bPick" style="flex:1;padding:13px 10px;border-radius:13px;
                border:1.5px solid ${OM.line};background:#fff;cursor:pointer;
                font-family:inherit;font-size:12.5px;font-weight:700;color:${OM.dark};
                display:flex;align-items:center;justify-content:center;gap:7px">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          Importer
        </button>
      </div>

      <div id="dropZone" style="border:1.5px dashed ${OM.line};border-radius:14px;padding:14px;
           text-align:center;margin-bottom:18px;background:#fff;transition:all .2s">
        <div id="dropLabel" style="font-size:12.5px;color:${OM.mid};font-weight:600">
          Aucune image jointe</div>
      </div>

      <!-- capture="environment" ouvre l'appareil photo arrière
           directement sur téléphone ; sans cet attribut, le second
           champ laisse choisir dans la galerie. -->
      <input type="file" id="bShotCam" accept="image/*" capture="environment" style="display:none">
      <input type="file" id="bShot" accept="image/jpeg,image/png,image/webp" style="display:none">

      <button id="bSubmit" style="width:100%;padding:16px;border-radius:999px;border:none;
              background:${OM.orange};color:#fff;font-family:inherit;font-size:15px;
              font-weight:800;cursor:pointer;transition:transform .18s">
        J'ai payé — déclarer mon dépôt
      </button>

      <div style="font-size:11.5px;color:${OM.mid};text-align:center;margin-top:12px;line-height:1.5">
        Votre accès reste ouvert pendant la vérification.
      </div>

      <!-- Sortie pour les structures qui ne sont pas des pharmacies :
           hôpitaux, cliniques, laboratoires. Leurs besoins et leurs
           tarifs diffèrent, la page des formules les oriente mieux
           qu'un formulaire de dépôt. -->
      <div style="border-top:1px solid ${OM.line};margin-top:20px;padding-top:16px;text-align:center">
        <a href="/pricing" id="bNotPharmacy"
           style="font-size:12.5px;font-weight:700;color:${OM.mid};text-decoration:none">
          Je ne suis pas une pharmacie →
        </a>
      </div>`;

    renderPlans();
    bindForm();
  }

  function planLabel(code) {
    const p = PLANS.find(x => x.code === code);
    return p ? p.label : code;
  }

  function renderPlans() {
    const host = $('planList');
    if (!host) return;

    host.innerHTML = PLANS.map(p => {
      const on    = p.code === picked.plan;
      const price = picked.cycle === 'yearly' ? p.yearly_price : p.monthly_price;
      const per   = picked.cycle === 'yearly' ? '/an' : '/mois';
      return `
        <button class="plan-opt" data-plan="${p.code}"
          style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;
                 border:1.5px solid ${on ? OM.orange : OM.line};
                 background:${on ? 'rgba(255,121,0,.06)' : '#fff'};
                 cursor:pointer;font-family:inherit;text-align:left;width:100%;transition:all .18s">
          <span style="width:18px;height:18px;border-radius:50%;flex-shrink:0;
                border:2px solid ${on ? OM.orange : 'rgba(0,0,0,.18)'};
                background:${on ? OM.orange : 'transparent'};
                box-shadow:${on ? 'inset 0 0 0 3px #fff' : 'none'}"></span>
          <span style="flex:1">
            <span style="display:block;font-size:14.5px;font-weight:800">${esc(p.label)}</span>
            <span style="display:block;font-size:11.5px;color:${OM.mid}">
              ${p.modules.length} module${p.modules.length > 1 ? 's' : ''}</span>
          </span>
          <span style="font-size:17px;font-weight:800">${money(price)}<span
                style="font-size:11px;font-weight:600;color:${OM.mid}">${per}</span></span>
        </button>`;
    }).join('');

    host.querySelectorAll('.plan-opt').forEach(b => {
      b.addEventListener('click', () => {
        picked.plan = b.dataset.plan;
        renderPlans();
        refreshDue();
      });
    });

    document.querySelectorAll('.cyc').forEach(b => {
      const on = b.dataset.cycle === picked.cycle;
      b.style.borderColor = on ? OM.orange : OM.line;
      b.style.background  = on ? 'rgba(255,121,0,.06)' : '#fff';
      b.onclick = () => { picked.cycle = b.dataset.cycle; renderPlans(); refreshDue(); };
    });

    refreshDue();
  }

  function refreshDue() {
    const p = PLANS.find(x => x.code === picked.plan);
    if (!p) return;
    const due = picked.cycle === 'yearly' ? p.yearly_price : p.monthly_price;
    const el = $('dueAmount');
    if (el) el.textContent = money(due);

    const num = $('payNumber');
    if (num) num.textContent = INFO.payment.number || '—';

    const holder = $('payHolder');
    if (holder && INFO.payment.holder) {
      holder.textContent = 'Compte : ' + INFO.payment.holder;
    }
  }

  function bindForm() {
    const copy = $('copyNumber');
    if (copy) {
      copy.addEventListener('click', () => {
        const n = (INFO.payment.number || '').replace(/\s/g, '');
        navigator.clipboard?.writeText(n)
          .then(() => { copy.textContent = 'Copié'; setTimeout(() => copy.textContent = 'Copier', 1600); })
          .catch(() => toast('Copie impossible — notez le numéro', true));
      });
    }

    /* Les deux champs alimentent la même variable `file`. */
    const zone = $('dropZone');

    function accept(f) {
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) {
        toast('Image trop lourde (4 Mo maximum)', true);
        return;
      }
      file = f;
      const label = $('dropLabel');
      if (label) {
        label.innerHTML =
          `<span style="color:${OM.green};font-weight:700">✓ image jointe</span>` +
          ` <button type="button" id="bDrop" style="margin-left:8px;border:none;background:none;` +
          `color:${OM.mid};font-family:inherit;font-size:12px;font-weight:700;` +
          `text-decoration:underline;cursor:pointer">retirer</button>`;
        const rm = $('bDrop');
        if (rm) rm.addEventListener('click', clearFile);
      }
      if (zone) { zone.style.borderColor = OM.green; zone.style.borderStyle = 'solid'; }
    }

    function clearFile() {
      file = null;
      ['bShot', 'bShotCam'].forEach(id => { const i = $(id); if (i) i.value = ''; });
      const label = $('dropLabel');
      if (label) label.textContent = 'Aucune image jointe';
      if (zone) { zone.style.borderColor = OM.line; zone.style.borderStyle = 'dashed'; }
    }

    ['bShot', 'bShotCam'].forEach(id => {
      const i = $(id);
      if (i) i.addEventListener('change', () => accept(i.files?.[0] || null));
    });

    const cam  = $('bCam');
    const pick = $('bPick');
    if (cam)  cam.addEventListener('click',  () => $('bShotCam').click());
    if (pick) pick.addEventListener('click', () => $('bShot').click());

    const btn = $('bSubmit');
    if (btn) btn.addEventListener('click', submit);
  }

  async function submit() {
    const ref = ($('bRef').value || '').trim().toUpperCase();

    // Une preuve suffit. Ni référence ni image : rien à vérifier.
    if (!ref && !file) {
      toast("Recopiez la référence du SMS ou joignez-en une image", true);
      $('bRef').focus();
      return;
    }

    // Une référence commencée mais tronquée est pire que pas de
    // référence du tout : elle donne l'illusion d'une preuve.
    if (ref && ref.length < 6 && !file) {
      toast('Cette référence semble incomplète', true);
      $('bRef').focus();
      return;
    }

    const btn = $('bSubmit');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';
    btn.style.opacity = '.7';

    const fd = new FormData();
    if (ref) fd.append('reference', ref);
    fd.append('plan_code',     picked.plan);
    fd.append('billing_cycle', picked.cycle);
    fd.append('operator',      'orange');   // seul canal ouvert à ce jour
    const phone = ($('bPhone').value || '').trim();
    if (phone) fd.append('sender_phone', phone);
    if (file)  fd.append('screenshot', file);

    try {
      const res = await AfyaAPI.billing.declare(fd);
      toast(res.message || 'Déclaration enregistrée');
      INFO.pending_payment = res.payment;
      viewPending(res.payment);
    } catch (e) {
      toast(errMsg(e), true);
      btn.disabled = false;
      btn.textContent = "J'ai payé — déclarer mon dépôt";
      btn.style.opacity = '1';
    }
  }

  /* ═══ DÉMARRAGE ═══ */

  /**
   * Bandeau « Afya Kamili × Orange Money ».
   *
   * Sans lui, un encart plein écran aux couleurs d'un opérateur
   * télécom ressemble à une publicité, et l'utilisateur le referme
   * par réflexe. Voir sa propre application à côté du moyen de
   * paiement dit en une seconde : c'est bien nous, et voici comment.
   *
   * Le carré Orange est un simple aplat aux couleurs de l'opérateur
   * avec son nom — pas une copie de son logo officiel. Si tu obtiens
   * un accord de marque avec Orange RDC, remplace-le par leur fichier.
   */
  function brandRow() {
    return `
      <div style="display:flex;align-items:center;justify-content:center;gap:14px;
                  margin-bottom:18px">

        <!-- Afya Kamili -->
        <div style="display:flex;align-items:center;gap:7px">
          <div style="width:34px;height:34px;border-radius:50%;background:#EFFF3A;
                      display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#111"
                 stroke-width="2.4" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg>
          </div>
          <div style="font-size:13.5px;font-weight:800;color:${OM.dark};line-height:1.1">
            Afya<br><span style="color:${OM.mid};font-weight:700">Kamili</span>
          </div>
        </div>

        <div style="font-size:19px">&#129309;</div>

        <!-- Opérateur -->
        <div style="display:flex;align-items:center;gap:7px">
          <div style="width:34px;height:34px;border-radius:9px;background:${OM.orange};
                      display:flex;align-items:center;justify-content:center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="3"/><path d="M10 18.5h4"/></svg>
          </div>
          <div style="font-size:13.5px;font-weight:800;color:${OM.dark};line-height:1.1">
            Orange<br><span style="color:${OM.mid};font-weight:700">Money</span>
          </div>
        </div>
      </div>`;
  }

  /* ═══ RAPPEL AMICAL (fermable) ═══ */

  function viewReminder(t) {
    setLocked(false);

    const d = t.days_left;
    const jours = d > 1 ? `${d} jours` : (d === 1 ? 'demain' : "aujourd'hui");

    $('billingTitle').textContent = "Votre essai touche à sa fin";
    $('billingSub').textContent   = d > 0 ? `Il vous reste ${jours}` : 'Dernier jour';

    $('billingBody').innerHTML = `
      ${brandRow()}
      <div style="font-size:14.5px;line-height:1.65;margin-bottom:6px">
        Votre période d'essai prend fin <strong>${esc(jours)}</strong>.
        Pensez à régler votre abonnement pour ne pas interrompre
        l'activité de votre pharmacie.
      </div>
      <div style="font-size:13px;color:${OM.mid};line-height:1.6;margin-bottom:22px">
        Le paiement se fait par ${esc(INFO.payment.operator || 'Orange Money')},
        en quelques secondes depuis votre téléphone.
      </div>

      <button id="bPayNow" style="width:100%;padding:16px;border-radius:999px;border:none;
              background:${OM.orange};color:#fff;font-family:inherit;font-size:15px;
              font-weight:800;cursor:pointer">Payer tout de suite</button>

      <button id="bLater" style="width:100%;padding:14px;border-radius:999px;margin-top:10px;
              border:1.5px solid ${OM.line};background:transparent;color:${OM.mid};
              font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">
        Je le ferai plus tard</button>`;

    $('bPayNow').onclick = () => viewForm();
    $('bLater').onclick  = close;
  }

  /* ═══ ACCÈS COUPÉ (non fermable) ═══ */

  function viewExpired(t) {
    setLocked(true);

    const wasTrial = t.status === 'trial';

    $('billingTitle').textContent = wasTrial
      ? "Votre période d'essai est terminée"
      : 'Votre abonnement a expiré';
    $('billingSub').textContent = 'Réglez votre abonnement pour continuer';

    $('billingBody').innerHTML = `
      ${brandRow()}
      <div style="font-size:14.5px;line-height:1.65;margin-bottom:8px">
        ${wasTrial ? "Votre essai gratuit est arrivé à son terme."
                   : 'Votre abonnement est arrivé à échéance.'}
        L'accès à l'application est suspendu jusqu'au règlement.
      </div>
      <div style="font-size:13px;color:${OM.mid};line-height:1.6;margin-bottom:22px">
        Vos données sont conservées intactes. Dès votre déclaration de
        paiement, l'accès rouvre immédiatement, sans attendre notre
        vérification.
      </div>

      <button id="bPayNow" style="width:100%;padding:16px;border-radius:999px;border:none;
              background:${OM.orange};color:#fff;font-family:inherit;font-size:15px;
              font-weight:800;cursor:pointer">Payer mon abonnement</button>

      <div style="border-top:1px solid ${OM.line};margin-top:20px;padding-top:16px;text-align:center">
        <a href="/login" id="bLogout"
           style="font-size:12.5px;font-weight:700;color:${OM.mid};text-decoration:none">
          Se déconnecter
        </a>
      </div>`;

    $('bPayNow').onclick = () => viewForm();

    // Le verrou ne doit jamais devenir un piège : on peut toujours
    // quitter son compte, même sans payer.
    $('bLogout').onclick = async (e) => {
      e.preventDefault();
      try { await AfyaAPI.auth.logout(); } catch (err) { AfyaAPI.Token.clear(); }
      window.location.replace('/login');
    };
  }

  async function load() {
    INFO  = await AfyaAPI.billing.info();
    PLANS = INFO.plans || [];
    if (PLANS.length && !PLANS.find(p => p.code === picked.plan)) {
      picked.plan = PLANS[0].code;
    }
    return INFO;
  }

  /**
   * Ouvre le modal.
   *   show()                   → formulaire (clic sur « S'abonner »)
   *   show({ mode:'reminder' }) → rappel amical, fermable
   *   show({ mode:'expired' })  → accès coupé, non fermable
   */
  async function show(opts = {}) {
    try {
      if (!INFO) await load();
      build();

      const t = INFO.tenant || {};

      if (opts.mode === 'expired') {
        viewExpired(t);
      } else if (INFO.pending_payment) {
        // Un dossier en attente prime sur tout le reste : inutile de
        // réclamer un paiement à quelqu'un qui vient de le déclarer.
        setLocked(false);
        viewPending(INFO.pending_payment);
      } else if (opts.mode === 'reminder') {
        viewReminder(t);
      } else {
        setLocked(false);
        viewForm();
      }

      open();
    } catch (e) {
      toast(errMsg(e), true);
    }
  }

  /** Clé de rappel : une seule apparition par jour calendaire */
  function todayKey() {
    return 'afya_billing_reminded_' + new Date().toISOString().slice(0, 10);
  }

  /**
   * Décide seul s'il faut ouvrir le modal au chargement d'une page.
   *
   * Trois cas, dans cet ordre :
   *
   *   1. Accès coupé   → modal verrouillé, à chaque page, sans exception.
   *   2. Jour 2 et +   → un rappel fermable, une fois par jour.
   *   3. Sinon         → rien.
   *
   * Le jour de l'inscription est délibérément épargné : quelqu'un qui
   * découvre l'outil ne doit pas être accueilli par une demande d'argent.
   * D'où le test sur days_since_signup, et non sur days_left seul.
   */
  async function autoCheck() {
    try {
      await load();
      const t = INFO.tenant || {};

      // ── 1. Accès coupé ──
      if (t.is_expired && !INFO.pending_payment) {
        show({ mode: 'expired' });
        return;
      }

      // Au-delà, on ne dérange pas :
      if (t.status === 'active') return;   // abonné à jour
      if (INFO.pending_payment)  return;   // déclaration en cours
      if (t.in_grace)            return;   // vient de payer

      // ── 2. Rappel quotidien, à partir du deuxième jour ──
      if ((t.days_since_signup || 0) < 1) return;

      // localStorage et non sessionStorage : le rappel doit tenir sur la
      // journée entière, pas se rouvrir à chaque nouvel onglet.
      const key = todayKey();
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');

      show({ mode: 'reminder' });
    } catch (e) { /* silencieux : ne jamais bloquer le tableau de bord */ }
  }

  window.AfyaBilling = { show, close, load };

  function init() {
    if (!window.AfyaAPI) { setTimeout(init, 80); return; }
    if (!AfyaAPI.Token.exists()) return;
    setTimeout(autoCheck, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();