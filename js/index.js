/* ══════════════════════════════════════════════════════════
   Afya Kamili — Dashboard JS
   Gestion SaaS : abonnements, modules, état par plan
══════════════════════════════════════════════════════════ */

/* ── DATE ── */
const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const now = new Date();
document.getElementById('heroDate').textContent =
  `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;


/* ── ORGAN SWITCHER ── */
const heroOrgan = document.getElementById('heroOrgan');
const organLabel = document.getElementById('organLabel');
let organTimer;

function switchOrgan(dot) {
  document.querySelectorAll('.osw-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  heroOrgan.style.opacity = '0';
  heroOrgan.style.filter = 'drop-shadow(0 0 28px rgba(0,180,255,0)) blur(4px)';
  setTimeout(() => {
    heroOrgan.src = dot.dataset.organ;
    heroOrgan.style.opacity = '0.92';
    heroOrgan.style.filter = 'drop-shadow(0 0 28px rgba(0,180,255,0.5)) drop-shadow(0 0 70px rgba(0,100,200,0.25))';
    organLabel.textContent = dot.dataset.label;
  }, 500);
}
document.querySelectorAll('.osw-dot').forEach(dot => {
  dot.addEventListener('click', () => { clearInterval(organTimer); switchOrgan(dot); startOrganCycle(); });
});
function startOrganCycle() {
  clearInterval(organTimer);
  organTimer = setInterval(() => {
    const dots = [...document.querySelectorAll('.osw-dot')];
    const cur = dots.findIndex(d => d.classList.contains('active'));
    switchOrgan(dots[(cur + 1) % dots.length]);
  }, 8000);
}
startOrganCycle();


/* ══════════════════════════════════════════════════════════
   PLANS & ABONNEMENTS
   Source de vérité : quel plan ce tenant a souscrit
   En production → remplacé par un appel API Laravel
══════════════════════════════════════════════════════════ */

// Simulation : peut être 'none' | 'starter' | 'clinic' | 'diagno' | 'enterprise'
// Modifier ici pour tester les différents états du dashboard
const CURRENT_PLAN = (function() {
  // Priority : URL param > localStorage > default
  const p = new URLSearchParams(location.search).get('plan');
  if (p) return p;
  return localStorage.getItem('afya_plan') || 'starter';
})();

// Ce que chaque plan déverrouille
const PLAN_MODULES = {
  none:       ['admin'],
  starter:    ['admin', 'pharmacy'],
  clinic:     ['admin', 'pharmacy', 'medical', 'hospitalization', 'emergency', 'accounting'],
  diagno:     ['admin', 'pharmacy', 'medical', 'laboratory', 'imaging'],
  enterprise: ['admin', 'pharmacy', 'medical', 'hospitalization', 'emergency',
               'accounting', 'laboratory', 'imaging', 'appointments', 'reports']
};

const unlockedModules = new Set(PLAN_MODULES[CURRENT_PLAN] || PLAN_MODULES['none']);

/* ══════════════════════════════════════════════════════════
   CATALOGUE DES MODULES
══════════════════════════════════════════════════════════ */
const ALL_MODULES = [
  /* ─── GRATUIT ─── */
  {
    id: 'admin',
    name: 'Administration & RH',
    desc: 'Utilisateurs, rôles, permissions, personnel et congés.',
    link: './modules/admin/index.html',
    free: true,
    plan: null,
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <circle cx="10" cy="10" r="2.5"/>
      <path d="M16.7 12.8a1.5 1.5 0 00.3 1.65l.05.05a1.8 1.8 0 01-2.55 2.55l-.05-.05A1.5 1.5 0 0012.8 16.7a1.5 1.5 0 00-.9 1.37V18a1.8 1.8 0 01-3.6 0v-.09a1.5 1.5 0 00-.9-1.38 1.5 1.5 0 00-1.65.3l-.05.05a1.8 1.8 0 01-2.55-2.55l.05-.05A1.5 1.5 0 003.3 12.8a1.5 1.5 0 00-1.37-.9H2a1.8 1.8 0 010-3.6h.09a1.5 1.5 0 001.37-.9 1.5 1.5 0 00-.3-1.65l-.05-.05A1.8 1.8 0 015.65 3.15l.05.05A1.5 1.5 0 007.35 3.48a1.5 1.5 0 00.9-1.37V2a1.8 1.8 0 013.6 0v.09a1.5 1.5 0 001.37.9 1.5 1.5 0 001.65-.3l.05-.05a1.8 1.8 0 012.55 2.55l-.05.05A1.5 1.5 0 0016.52 7.2a1.5 1.5 0 001.37.9H18a1.8 1.8 0 010 3.6h-.09a1.5 1.5 0 00-1.22.85z"/>
    </svg>`
  },

  /* ─── STARTER ─── */
  {
    id: 'pharmacy',
    name: 'Pharmacie',
    desc: 'Stock, ventes comptoir, OHADA, alertes péremption.',
    link: './modules/pharmacy/index.html',
    free: false,
    plan: 'starter',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <rect x="4" y="3" width="12" height="14" rx="2.5"/>
      <path d="M8 9h4M10 7v4M7.5 13h5"/>
    </svg>`
  },

  /* ─── CLINIC ─── */
  {
    id: 'medical',
    name: 'Gestion médicale',
    desc: 'Dossiers, consultations, prescriptions, workspace anatomique.',
    link: './modules/medical/index.html',
    free: false,
    plan: 'clinic',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <circle cx="10" cy="7.5" r="3.5"/>
      <path d="M3 18c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5"/>
      <path d="M10 4.5v6M7 7.5h6" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'hospitalization',
    name: 'Hospitalisation',
    desc: 'Admission, lits, séjour, transferts de patients.',
    link: './modules/hospitalization/index.html',
    free: false,
    plan: 'clinic',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <path d="M3 19V8L10 3l7 5v11"/>
      <rect x="7.5" y="11" width="5" height="8" rx="1"/>
    </svg>`
  },
  {
    id: 'emergency',
    name: 'Urgences',
    desc: 'Triage, priorités, prise en charge rapide.',
    link: './modules/emergency/index.html',
    free: false,
    plan: 'clinic',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <path d="M10 2l2.4 7H18l-5.1 3.7 1.9 5.9L10 15.4l-4.8 3.2 1.9-5.9L2 9h5.6L10 2z"/>
    </svg>`
  },
  {
    id: 'accounting',
    name: 'Comptabilité & Caisse',
    desc: 'Grand livre, journaux OHADA, encaissements, clôtures.',
    link: './modules/accounting/index.html',
    free: false,
    plan: 'clinic',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <rect x="3" y="3" width="14" height="14" rx="2.5"/>
      <path d="M7 7.5h6M7 10.5h6M7 13.5h4"/>
    </svg>`
  },

  /* ─── DIAGNO ─── */
  {
    id: 'laboratory',
    name: 'Laboratoire',
    desc: 'Analyses, résultats, certificats d\'examens.',
    link: './modules/laboratory/index.html',
    free: false,
    plan: 'diagno',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <path d="M8 3v9.5L3.5 18a1.7 1.7 0 001.6 2h9.8a1.7 1.7 0 001.6-2L12 12.5V3"/>
      <path d="M8 8h4M5 3h10"/>
    </svg>`
  },
  {
    id: 'imaging',
    name: 'Imagerie médicale',
    desc: 'Radio, IRM, scanner, archivage DICOM.',
    link: './modules/imaging/index.html',
    free: false,
    plan: 'diagno',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <rect x="2" y="4" width="16" height="12" rx="2.5"/>
      <circle cx="10" cy="10" r="3.5"/>
      <circle cx="10" cy="10" r="1.2" fill="currentColor"/>
    </svg>`
  },

  /* ─── ENTERPRISE ─── */
  {
    id: 'appointments',
    name: 'Rendez-vous',
    desc: 'Planification, agenda, rappels automatiques.',
    link: './modules/appointments/index.html',
    free: false,
    plan: 'enterprise',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <rect x="3" y="4.5" width="14" height="13" rx="2.5"/>
      <path d="M7 4.5V2.5M13 4.5V2.5M3 9h14"/>
    </svg>`
  },
  {
    id: 'reports',
    name: 'Rapports & Analytics',
    desc: 'Tableaux de bord, KPIs, analyses avancées.',
    link: './modules/reports/index.html',
    free: false,
    plan: 'enterprise',
    icon: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7">
      <path d="M4 17V12M8.5 17V7M13 17V9.5M17.5 17V3"/>
    </svg>`
  }
];

/* Plan labels pour l'affichage */
const PLAN_LABEL = {
  starter:    'Starter',
  clinic:     'Clinic',
  diagno:     'Diagno',
  enterprise: 'Enterprise'
};


/* ══════════════════════════════════════════════════════════
   BUILD MODULE CARD
══════════════════════════════════════════════════════════ */
function buildCard(m) {
  const isUnlocked = unlockedModules.has(m.id);
  const el = document.createElement(isUnlocked ? 'a' : 'div');

  if (isUnlocked && m.link) el.href = m.link;
  el.className = `mcard ${isUnlocked ? 'avail' : 'locked'}`;
  el.style.textDecoration = 'none';
  el.style.color = 'inherit';

  // Badge bottom-left
  let badgeHtml;
  if (m.free) {
    badgeHtml = `<span class="mpill free">Gratuit</span>`;
  } else if (isUnlocked) {
    badgeHtml = `<span class="mpill a">Disponible</span>`;
  } else {
    badgeHtml = `<span class="mpill locked-pill">${PLAN_LABEL[m.plan] || ''}</span>`;
  }

  // Arrow or lock icon
  const actionHtml = isUnlocked
    ? `<div class="marrow">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
          <path d="M2 9L9 2M9 2H3.5M9 2V7.5"/>
        </svg>
      </div>`
    : `<div class="marrow lock"
         onclick="event.preventDefault();window.location.href='./pricing.html?highlight=${m.plan}'">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3.5" y="7" width="9" height="7.5" rx="2"/>
          <path d="M5.5 7V5.5a2.5 2.5 0 015 0V7"/>
        </svg>
      </div>`;

  el.innerHTML = `
    <div class="micon">${m.icon}</div>
    <div>
      <div class="mname">${m.name}</div>
      <div class="mdesc">${m.desc}</div>
    </div>
    <div class="mfoot">
      ${badgeHtml}
      ${actionHtml}
    </div>
  `;

  // Clic sur une carte verrouillée → pricing
  if (!isUnlocked) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      window.location.href = `./pricing.html?highlight=${m.plan}`;
    });
  }

  return el;
}


/* ── RENDER ── */
const gridActive   = document.getElementById('gridActive');
const gridLocked   = document.getElementById('gridLocked');

gridActive.innerHTML = '';
gridLocked.innerHTML = '';

ALL_MODULES.forEach(m => {
  const isUnlocked = unlockedModules.has(m.id);
  (isUnlocked ? gridActive : gridLocked).appendChild(buildCard(m));
});

// Mettre à jour le compteur
const activeCount = ALL_MODULES.filter(m => unlockedModules.has(m.id)).length;
const el = document.getElementById('activeCount');
if (el) el.textContent = `${activeCount} actif${activeCount > 1 ? 's' : ''}`;


/* ── STAGGER ENTRANCE ── */
document.querySelectorAll('.mcard').forEach((c, i) => {
  c.style.opacity = '0';
  c.style.transform = 'translateY(14px)';
  c.style.transition = `opacity 0.38s ease ${i * 0.035}s, transform 0.38s ease ${i * 0.035}s, box-shadow 0.22s, border-color 0.22s, background 0.22s`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      c.style.opacity = c.classList.contains('locked') ? '0.72' : '1';
      c.style.transform = 'translateY(0)';
    });
  });
});


/* ── IMAGE FALLBACK ── */
heroOrgan.addEventListener('error', () => { heroOrgan.style.display = 'none'; });