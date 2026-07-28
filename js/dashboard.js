/* ══════════════════════════════════════════════════════════
   AFYA KAMILI — DASHBOARD (câblage API)

   Remplit depuis GET /auth/me :
   - identité utilisateur (nom, initiales, établissement)
   - dernière connexion
   - bandeau de plan (essai / abonnements réels)
   - modules déverrouillés (remplace la simulation de index.js)
   - menu avatar + déconnexion

   Ordre dans index :  afya_api.js → index.js → dashboard.js
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Garde d'authentification ── */
  if (!AfyaAPI.auth.isLoggedIn()) {
    window.location.href = './login';
    return;
  }
  AfyaAPI.setAuthExpiredHandler(() => { window.location.href = './login'; });

  /* Codes API → ids du front */
  const API_TO_FRONT = {
    administration:  'admin',
    hr:              'admin',
    pharmacy:        'pharmacy',
    medical:         'medical',
    patients:        'medical',
    hospitalization: 'hospitalization',
    emergency:       'emergency',
    accounting:      'accounting',
    billing:         'accounting',
    laboratory:      'laboratory',
    imaging:         'imaging',
    appointments:    'appointments',
    reports:         'reports',
  };

  const PLAN_LABEL = {
    starter: 'Starter', clinic: 'Clinic', diagno: 'Diagno', enterprise: 'Enterprise',
  };

  /* ═══ helpers ═══ */
  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function initials(name) {
    return (name || '').trim().split(/\s+/).slice(0, 2)
      .map(w => w[0] || '').join('').toUpperCase() || '—';
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "à l'instant";
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === new Date().toDateString()) return `aujourd'hui à ${hh}:${mm}`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ` à ${hh}:${mm}`;
  }

  /* ═══ 1. IDENTITÉ ═══ */
  function fillIdentity(user) {
    const tenant = user.tenant || {};

    setText('heroUserName',   user.name || 'Utilisateur');
    setText('heroTenantName', tenant.establishment_name || '');
    setText('menuUserName',   user.name || '');
    setText('menuTenantName', tenant.establishment_name || '');

    const av = document.getElementById('userAvatar');
    if (av) {
      av.textContent = initials(user.name);
      av.title = user.name + (user.is_owner ? ' — Propriétaire' : '');
    }

    const ll = document.getElementById('lastLogin');
    if (ll) {
      ll.textContent = user.last_login_at ? formatDateTime(user.last_login_at) : "à l'instant";
    }
  }

  /* ═══ 2. BANDEAU DE PLAN (réel) ═══ */

  /**
   * Transforme le lien « S'abonner » en déclencheur du modal Orange Money.
   *
   * Le modal existe déjà (js/billing.js expose window.AfyaBilling), mais
   * rien ne l'ouvrait : le bouton restait un simple lien vers la page des
   * tarifs. Le client voyait donc les prix sans jamais voir COMMENT payer.
   *
   * Le lien vers ./pricing reste le comportement de repli si billing.js
   * n'a pas pu se charger — mieux vaut une page de tarifs qu'un clic mort.
   */
  function openBillingOnClick(el) {
    if (el.dataset.billingBound) return;   // évite d'empiler les écouteurs
    el.dataset.billingBound = '1';

    el.addEventListener('click', (e) => {
      if (window.AfyaBilling && typeof AfyaBilling.show === 'function') {
        e.preventDefault();
        AfyaBilling.show();
      }
    });
  }

  function fillPlanBanner(tenant) {
    const pill    = document.getElementById('planPill');
    const text    = document.getElementById('planText');
    const upgrade = document.getElementById('planUpgrade');
    if (!pill || !text) return;

    // Essai gratuit
    if (tenant.status === 'trial' && tenant.trial_ends_at) {
      const days = Math.max(0, Math.ceil((new Date(tenant.trial_ends_at) - new Date()) / 86400000));
      pill.textContent = 'Essai gratuit';
      pill.className   = 'pb-plan-pill trial';
      text.innerHTML   = days > 0
        ? `Tous les modules débloqués — <strong>${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}</strong>`
        : 'Votre essai a expiré — <strong>choisissez une formule</strong>';
      if (upgrade) {
        upgrade.textContent = "S'abonner →";
        upgrade.classList.remove('hide');
        openBillingOnClick(upgrade);
      }
      return;
    }

    // Abonnement actif : déduire la formule des modules payants
    const paid = (tenant.modules || []).filter(c => c !== 'administration' && c !== 'hr');

    let plan = 'none', price = '';
    if (paid.length === 0)                                { plan = 'none'; }
    else if (paid.length === 1 && paid[0] === 'pharmacy') { plan = 'starter';    price = '15 $/mois'; }
    else if (paid.includes('laboratory') && paid.includes('imaging')
             && !paid.includes('hospitalization'))        { plan = 'diagno';     price = '60 $/mois'; }
    else if (paid.length >= 8)                            { plan = 'enterprise'; price = '150 $/mois'; }
    else                                                  { plan = 'clinic';     price = '80 $/mois'; }

    const DESC = {
      none:       'Aucun module payant actif',
      starter:    'Pharmacie standalone activée',
      clinic:     'Gestion clinique complète',
      diagno:     'Labo & Imagerie médicale',
      enterprise: 'Accès complet à tous les modules',
    };

    pill.textContent = PLAN_LABEL[plan] || 'Aucun plan';
    pill.className   = 'pb-plan-pill ' + plan;
    text.innerHTML   = DESC[plan] + (price ? ` — <strong>${price}</strong>` : '');

    if (upgrade) {
      upgrade.textContent = plan === 'none' ? "S'abonner →" : 'Changer de formule →';
      upgrade.classList.toggle('hide', plan === 'enterprise');
      openBillingOnClick(upgrade);
    }
  }

  /* ═══ 3. MODULES ═══ */
  function renderModules(activeCodes) {
    const unlocked = new Set(activeCodes.map(c => API_TO_FRONT[c]).filter(Boolean));
    unlocked.add('admin');   // gratuit, toujours accessible

    const gridActive = document.getElementById('gridActive');
    const gridLocked = document.getElementById('gridLocked');
    if (!gridActive || !gridLocked || typeof ALL_MODULES === 'undefined') return;

    gridActive.innerHTML = '';
    gridLocked.innerHTML = '';

    ALL_MODULES.forEach(m => {
      const ok = unlocked.has(m.id);
      (ok ? gridActive : gridLocked).appendChild(buildCard(m, ok));
    });

    const n = ALL_MODULES.filter(m => unlocked.has(m.id)).length;
    setText('activeCount', `${n} actif${n > 1 ? 's' : ''}`);

    const lockedCount = ALL_MODULES.length - n;
    const sec = document.getElementById('sectionLocked');
    if (sec) sec.style.display = lockedCount === 0 ? 'none' : '';

    animateCards();
  }

  function buildCard(m, isUnlocked) {
    const el = document.createElement(isUnlocked && m.link ? 'a' : 'div');
    if (isUnlocked && m.link) el.href = m.link;
    el.className = `mcard ${isUnlocked ? 'avail' : 'locked'}`;
    el.style.textDecoration = 'none';
    el.style.color = 'inherit';

    const badge = m.free
      ? '<span class="mpill free">Gratuit</span>'
      : isUnlocked
        ? '<span class="mpill a">Disponible</span>'
        : `<span class="mpill locked-pill">${PLAN_LABEL[m.plan] || ''}</span>`;

    const action = isUnlocked
      ? '<div class="marrow"><svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M2 9L9 2M9 2H3.5M9 2V7.5"/></svg></div>'
      : '<div class="marrow lock"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="7" width="9" height="7.5" rx="2"/><path d="M5.5 7V5.5a2.5 2.5 0 015 0V7"/></svg></div>';

    el.innerHTML = `
      <div class="micon">${m.icon}</div>
      <div>
        <div class="mname">${m.name}</div>
        <div class="mdesc">${m.desc}</div>
      </div>
      <div class="mfoot">${badge}${action}</div>`;

    if (!isUnlocked) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        window.location.href = `./pricing?highlight=${m.plan || 'starter'}`;
      });
    }
    return el;
  }

  function animateCards() {
    document.querySelectorAll('.mcard').forEach((c, i) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(14px)';
      c.style.transition = `opacity .38s ease ${i * 0.035}s, transform .38s ease ${i * 0.035}s, box-shadow .22s, border-color .22s, background .22s`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        c.style.opacity = c.classList.contains('locked') ? '0.72' : '1';
        c.style.transform = 'translateY(0)';
      }));
    });
  }

  /* ═══ 4. MENU AVATAR + DÉCONNEXION ═══ */
  function bindUserMenu() {
    const avatar = document.getElementById('userAvatar');
    const menu   = document.getElementById('userMenu');
    const logout = document.getElementById('logoutBtn');

    if (avatar && menu) {
      avatar.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', e => {
        if (!menu.contains(e.target) && e.target !== avatar) menu.classList.remove('open');
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') menu.classList.remove('open');
      });
    }

    if (logout) {
      logout.addEventListener('click', async () => {
        logout.disabled = true;
        logout.innerHTML = 'Déconnexion…';
        try { await AfyaAPI.auth.logout(); }
        catch (e) { /* on déconnecte quand même côté client */ }
        finally {
          localStorage.removeItem('afya_modules');
          localStorage.removeItem('afya_user');
          localStorage.removeItem('afya_plan');
          window.location.href = './login';
        }
      });
    }
  }

  /* ═══ 5. INIT ═══ */
  async function init() {
    bindUserMenu();

    try {
      const user   = await AfyaAPI.auth.me();
      const tenant = user.tenant || {};

      fillIdentity(user);
      fillPlanBanner(tenant);
      renderModules(tenant.modules || []);

      localStorage.setItem('afya_modules', JSON.stringify(tenant.modules || []));
      localStorage.setItem('afya_user', JSON.stringify({
        name: user.name,
        is_owner: user.is_owner,
        establishment: tenant.establishment_name,
        status: tenant.status,
        trial_ends_at: tenant.trial_ends_at,
      }));

      console.log('✅ Connecté :', user.name, '| Modules :', tenant.modules);
    } catch (e) {
      if (e.status === 401) return;
      console.error('Dashboard :', e);
      const t = document.getElementById('planText');
      if (t) t.textContent = 'Impossible de joindre le serveur';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 30));
  } else {
    setTimeout(init, 30);
  }

})();