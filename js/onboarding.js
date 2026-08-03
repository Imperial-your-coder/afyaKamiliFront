/* ═══════════════════════════════════════════════════════════════
   AFYA KAMILI — VISITE GUIDÉE

   Bulles d'aide qui pointent un élément, s'effacent seules, et
   reviennent à la demande.

   À charger sur les pages concernées, APRÈS afya_api.js :
     <script src="./js/onboarding.js" defer></script>

   ═══════════════════════════════════════════════════════════════
   PRINCIPES
   ═══════════════════════════════════════════════════════════════

   · Jamais de voile noir sur la page. Un utilisateur qui découvre
     l'outil doit pouvoir continuer à cliquer partout ; une visite
     qui prend l'écran en otage se fait fermer sans être lue.

   · Une bulle à la fois, et seulement quand sa cible est visible.
     La bulle « créer un compte » n'apparaît qu'une fois le bouton
     défilé à l'écran — sinon elle pointerait dans le vide.

   · Disparition automatique après quelques secondes. Le message est
     court : s'il n'a pas été lu, il reviendra.

   · Rappel permanent par le « ? » en bas à droite. C'est ce qui
     rend l'effacement automatique acceptable : rien n'est perdu.

   · Chaque bulle vue est mémorisée dans localStorage. On ne répète
     pas indéfiniment la même chose à quelqu'un qui a compris.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SEEN_KEY = 'afya_tour_seen';
  const AUTO_HIDE_MS = 11000;   // assez pour lire deux phrases sans se presser

  /* ── Mémoire des bulles déjà vues ── */
  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function markSeen(id) {
    try {
      const s = seen();
      s[id] = Date.now();
      localStorage.setItem(SEEN_KEY, JSON.stringify(s));
    } catch (e) { /* mode privé : la bulle se réaffichera, sans gravité */ }
  }

  /* ── Styles, injectés une seule fois ── */
  function injectStyles() {
    if (document.getElementById('afyaTourStyles')) return;

    const css = document.createElement('style');
    css.id = 'afyaTourStyles';
    css.textContent = `
      .afya-tip{
        position:absolute;z-index:99999;max-width:290px;
        background:#12120F;color:#fff;border-radius:16px;
        padding:14px 16px 13px;
        box-shadow:0 18px 44px rgba(0,0,0,.3);
        font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        opacity:0;transform:translateY(6px);
        transition:opacity .26s ease,transform .26s ease;
        pointer-events:auto;
      }
      .afya-tip.in{opacity:1;transform:translateY(0)}
      .afya-tip-txt{font-size:13px;line-height:1.6;font-weight:600;padding-right:16px}
      .afya-tip-txt strong{color:#EFFF3A}
      .afya-tip-x{
        position:absolute;top:9px;right:10px;width:22px;height:22px;
        border:none;background:rgba(255,255,255,.12);border-radius:50%;
        color:#fff;font-size:14px;line-height:1;cursor:pointer;
        display:flex;align-items:center;justify-content:center;padding:0;
      }
      .afya-tip-x:hover{background:rgba(255,255,255,.24)}
      /* Petite flèche pointant la cible */
      .afya-tip::after{
        content:'';position:absolute;width:11px;height:11px;
        background:#12120F;transform:rotate(45deg);
      }
      .afya-tip[data-dir="top"]::after{bottom:-5px;left:26px}
      .afya-tip[data-dir="bottom"]::after{top:-5px;left:26px}

      /* Halo autour de la cible — attire l'œil sans masquer la page */
      .afya-target-glow{
        position:relative;z-index:99998;
        box-shadow:0 0 0 4px rgba(239,255,58,.55),0 0 0 11px rgba(239,255,58,.18)!important;
        border-radius:14px;
        animation:afyaPulse 1.9s ease-in-out infinite;
      }
      @keyframes afyaPulse{
        0%,100%{box-shadow:0 0 0 4px rgba(239,255,58,.55),0 0 0 11px rgba(239,255,58,.18)}
        50%    {box-shadow:0 0 0 4px rgba(239,255,58,.75),0 0 0 15px rgba(239,255,58,.06)}
      }

      /* Bouton de rappel */
      .afya-help{
        position:fixed;right:16px;bottom:78px;z-index:99997;
        width:42px;height:42px;border-radius:50%;
        background:#12120F;color:#EFFF3A;border:none;cursor:pointer;
        font-size:19px;font-weight:800;font-family:inherit;
        box-shadow:0 8px 22px rgba(0,0,0,.26);
        display:flex;align-items:center;justify-content:center;
      }
      .afya-help:active{transform:scale(.93)}
      @media(min-width:900px){.afya-help{bottom:22px}}

      @media(prefers-reduced-motion:reduce){
        .afya-tip{transition:none}
        .afya-target-glow{animation:none}
      }`;
    document.head.appendChild(css);
  }

  /* ── Affichage d'une bulle ── */
  let current = null;

  function dismiss() {
    if (!current) return;
    const { tip, target, timer } = current;
    clearTimeout(timer);
    tip.classList.remove('in');
    if (target) target.classList.remove('afya-target-glow');
    setTimeout(() => tip.remove(), 280);
    current = null;
  }

  /**
   * @param {string} id      identifiant mémorisé
   * @param {string} sel     sélecteur CSS de la cible
   * @param {string} html    texte de la bulle (strong autorisé)
   * @param {object} opts    { force: ignore la mémoire }
   */
  function show(id, sel, html, opts = {}) {
    injectStyles();

    const target = document.querySelector(sel);
    if (!target) return false;

    // Une cible invisible ne se pointe pas.
    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;

    if (!opts.force && seen()[id]) return false;

    dismiss();

    const tip = document.createElement('div');
    tip.className = 'afya-tip';
    tip.innerHTML =
      `<button class="afya-tip-x" type="button" aria-label="Fermer">&times;</button>
       <div class="afya-tip-txt">${html}</div>`;
    document.body.appendChild(tip);

    /* Placement : sous la cible par défaut, au-dessus si l'espace
       manque en bas. On mesure la bulle après insertion pour connaître
       sa hauteur réelle — elle dépend de la longueur du texte. */
    const th = tip.offsetHeight;
    const tw = tip.offsetWidth;
    const below = r.bottom + th + 14 < window.innerHeight;

    const top = below
      ? r.bottom + window.scrollY + 12
      : r.top + window.scrollY - th - 12;

    // Bornée pour ne jamais sortir de l'écran sur un petit téléphone
    let left = r.left + window.scrollX;
    left = Math.max(10, Math.min(left, window.innerWidth - tw - 10));

    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    tip.dataset.dir = below ? 'bottom' : 'top';

    target.classList.add('afya-target-glow');
    requestAnimationFrame(() => tip.classList.add('in'));

    markSeen(id);

    const timer = setTimeout(dismiss, opts.duration || AUTO_HIDE_MS);
    current = { tip, target, timer };

    tip.querySelector('.afya-tip-x').addEventListener('click', dismiss);

    // Toucher la cible vaut compréhension : on s'efface.
    target.addEventListener('click', dismiss, { once: true });

    return true;
  }

  /* ── Bouton de rappel ──
     Sans lui, l'effacement automatique serait une perte d'information.
     Avec lui, l'aide est toujours à un clic. */
  function addHelpButton(replay) {
    if (document.getElementById('afyaHelpBtn')) return;

    injectStyles();
    const b = document.createElement('button');
    b.id = 'afyaHelpBtn';
    b.className = 'afya-help';
    b.type = 'button';
    b.textContent = '?';
    b.title = "Revoir les conseils";
    b.addEventListener('click', () => { dismiss(); replay(); });
    document.body.appendChild(b);
  }

  /**
   * Affiche la première bulle dont la cible est visible à l'écran.
   * Utilisé au défilement : la bulle « créer un compte » n'apparaît
   * qu'une fois le bouton atteint.
   */
  function showFirstVisible(steps, force) {
    for (const s of steps) {
      const el = document.querySelector(s.sel);
      if (!el) continue;

      const r = el.getBoundingClientRect();
      const visible = r.top < window.innerHeight - 60 && r.bottom > 60;

      if (visible && show(s.id, s.sel, s.html, { force })) return true;
    }
    return false;
  }

  /** Lance une séquence sur la page courante. */
  function run(steps, opts = {}) {
    const start = () => {
      // Un court délai laisse la page finir de se dessiner : sans lui,
      // on mesure la position d'un élément qui va encore bouger.
      setTimeout(() => showFirstVisible(steps, false), opts.delay || 900);

      let t = null;
      window.addEventListener('scroll', () => {
        clearTimeout(t);
        t = setTimeout(() => { if (!current) showFirstVisible(steps, false); }, 220);
      }, { passive: true });

      addHelpButton(() => {
        // Au rappel, on repart de zéro et on force l'affichage.
        showFirstVisible(steps, true);
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  window.AfyaTour = { run, show, dismiss, markSeen, seen, addHelpButton, showFirstVisible };
})();