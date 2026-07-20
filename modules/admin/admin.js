/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — ADMINISTRATION DES UTILISATEURS
   Aucune donnée simulée : tout vient de l'API.

   Deux modes de formulaire, décidés par le serveur :
     · simple  → pharmacie seule ou période d'essai
     · full    → l'établissement a des modules cliniques
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  let STAFF    = [];
  let ROLES    = [];
  let MODULES  = [];
  let FORMMODE = 'simple';
  let editId   = null;      // null = création
  let pwdTarget = null;     // employé dont on change le mot de passe

  const $  = (id) => document.getElementById(id);
  const el = {
    drawer:   $('drawer'),
    backdrop: $('backdrop'),
    table:    $('tableArea'),
    search:   $('searchInput'),
    roleF:    $('roleFilter'),
    statusF:  $('statusFilter'),
    form:     $('userForm'),
    roleSel:  $('roleSelect'),
    modBoxes: $('moduleBoxes'),
  };

  /* ─── Notifications ─── */
  function toast(msg, isError) {
    let t = $('adminToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'adminToast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);' +
        'padding:13px 22px;border-radius:999px;font-size:13.5px;font-weight:700;' +
        'z-index:9999;opacity:0;transition:all .3s cubic-bezier(.22,1,.36,1);' +
        'box-shadow:0 12px 34px rgba(0,0,0,.18);max-width:88vw;text-align:center';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = isError ? '#dc2626' : '#12120f';
    t.style.color = '#fff';
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(t._h);
    t._h = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3400);
  }

  function errMsg(e) {
    if (e && e.validationErrors) {
      const first = Object.values(e.validationErrors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
    return (e && e.message) || 'Une erreur est survenue.';
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2)
      .map(w => w[0] || '').join('').toUpperCase() || '?';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /* ═══ TIROIR ═══ */
  function openDrawer(id) {
    editId = id || null;
    el.form.reset();
    document.querySelectorAll('#moduleBoxes input').forEach(c => { c.checked = false; });

    const title = document.querySelector('#drawer .drawer-title, #drawer h2');
    const submit = document.querySelector('#drawer button[type="submit"], #drawer .btn-primary');

    if (editId) {
      const u = STAFF.find(s => s.id === editId);
      if (u) {
        const parts = String(u.name || '').split(' ');
        el.form.first_name.value = parts[0] || '';
        el.form.last_name.value  = parts.slice(1).join(' ') || '';
        if (el.form.email)   el.form.email.value = u.email || '';
        if (el.form.phone)   el.form.phone.value = u.phone || '';
        if (el.form.status)  el.form.status.value = u.status || 'active';
        if (el.form.role_id) el.form.role_id.value = u.role_id || '';
        (u.modules || []).forEach(code => {
          const cb = document.querySelector('#moduleBoxes input[value="' + code + '"]');
          if (cb) cb.checked = true;
        });
        // En modification, le mot de passe n'est pas redemandé
        if (el.form.password) el.form.password.required = false;
        if (el.form.password_confirmation) el.form.password_confirmation.required = false;
      }
      if (title)  title.textContent = 'Modifier l\'utilisateur';
      if (submit) submit.textContent = 'Enregistrer les modifications';
    } else {
      if (el.form.password) el.form.password.required = true;
      if (el.form.password_confirmation) el.form.password_confirmation.required = true;
      if (title)  title.textContent = 'Créer un utilisateur';
      if (submit) submit.textContent = 'Créer l\'utilisateur';
    }

    el.drawer.classList.add('open');
    el.backdrop.classList.add('open');
  }

  function closeDrawer() {
    el.drawer.classList.remove('open');
    el.backdrop.classList.remove('open');
    editId = null;
  }

  /* ═══ CHARGEMENT DES RÉFÉRENCES ═══ */
  async function loadRefs() {
    const res = await AfyaAPI.admin.refs();
    ROLES    = res.roles   || [];
    MODULES  = res.modules || [];
    FORMMODE = res.form_mode || 'simple';

    // Rôles
    el.roleSel.innerHTML = '<option value="">Sélectionner…</option>' +
      ROLES.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('');

    // Filtre de rôle du tableau
    if (el.roleF) {
      el.roleF.innerHTML = '<option value="">Tous les rôles</option>' +
        ROLES.map(r => `<option value="${esc(r.name)}">${esc(r.name)}</option>`).join('');
    }

    // Cases à cocher des modules
    if (!MODULES.length) {
      el.modBoxes.innerHTML =
        '<span style="font-size:13px;color:#8B8D86">Aucun module actif sur votre abonnement.</span>';
    } else {
      el.modBoxes.innerHTML = MODULES.map(m => `
        <label style="display:inline-flex;align-items:center;gap:8px;padding:9px 15px;
                      border:1.5px solid rgba(0,0,0,.1);border-radius:999px;cursor:pointer;
                      font-size:13px;font-weight:600;background:#fff;user-select:none">
          <input type="checkbox" value="${esc(m.code)}" style="accent-color:#12120f;width:15px;height:15px">
          ${esc(m.name)}
        </label>`).join('');
    }

    // Champs cliniques : masqués pour une pharmacie
    document.querySelectorAll('[data-clinical]').forEach(node => {
      node.hidden = (FORMMODE === 'simple');
    });
  }

  /* ═══ LISTE DU PERSONNEL ═══ */
  async function loadStaff() {
    const res = await AfyaAPI.admin.staff({
      search: el.search ? el.search.value.trim() : '',
      status: el.statusF ? el.statusF.value : '',
    });
    STAFF = res.staff || [];
    if (res.form_mode) FORMMODE = res.form_mode;
    renderKpis(res.stats || {});
    renderTable();
  }

  function renderKpis(stats) {
    const put = (id, v) => { const n = $(id); if (n) n.textContent = v; };
    put('kpiUsers',     stats.total     != null ? stats.total     : STAFF.length);
    put('kpiActive',    stats.active    != null ? stats.active    : '—');
    put('kpiSuspended', stats.suspended != null ? stats.suspended : '—');
    put('kpiRoles',     ROLES.length);
  }

  function statusPill(st) {
    const map = {
      active:    ['Actif',     '#16a34a', 'rgba(22,163,74,.13)'],
      suspended: ['Suspendu',  '#dc2626', 'rgba(220,38,38,.13)'],
      inactive:  ['Inactif',   '#8B8D86', 'rgba(0,0,0,.06)'],
      pending:   ['En attente','#d97706', 'rgba(245,158,11,.15)'],
    };
    const [lbl, col, bg] = map[st] || map.inactive;
    return `<span style="font-size:11px;font-weight:800;padding:4px 11px;border-radius:999px;
            color:${col};background:${bg}">${lbl}</span>`;
  }

  function moduleChips(mods) {
    if (!mods || !mods.length) return '<span style="color:#8B8D86;font-size:12px">—</span>';
    if (mods.indexOf('*') !== -1) {
      return '<span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;' +
             'background:#EFFF3A;color:#12120f">Tous</span>';
    }
    const names = {};
    MODULES.forEach(m => { names[m.code] = m.name; });
    return mods.map(c =>
      `<span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;
       background:rgba(0,0,0,.05);margin-right:4px">${esc(names[c] || c)}</span>`).join('');
  }

  function renderTable() {
    const roleFilter = el.roleF ? el.roleF.value : '';
    const rows = STAFF.filter(u => !roleFilter || u.role === roleFilter);

    if (!rows.length) {
      el.table.innerHTML =
        '<div style="text-align:center;padding:52px 20px;color:#8B8D86;font-size:14px">' +
        'Aucun utilisateur ne correspond.</div>';
      return;
    }

    el.table.innerHTML = rows.map(u => `
      <div style="display:grid;grid-template-columns:2fr 1.4fr 1.2fr 1.4fr 1fr auto;
                  gap:14px;align-items:center;padding:15px 20px;
                  border-bottom:1px solid rgba(0,0,0,.06)">

        <div style="display:flex;align-items:center;gap:11px;min-width:0">
          <div style="width:38px;height:38px;border-radius:50%;background:#EFFF3A;
                      display:flex;align-items:center;justify-content:center;
                      font-weight:800;font-size:13px;flex-shrink:0">${initials(u.name)}</div>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:14px;white-space:nowrap;
                        overflow:hidden;text-overflow:ellipsis">${esc(u.name)}
              ${u.is_owner ? '<span style="font-size:10px;font-weight:800;color:#12120f;background:#EFFF3A;padding:2px 7px;border-radius:999px;margin-left:6px">Propriétaire</span>' : ''}
            </div>
            <div style="font-size:12px;color:#8B8D86">${esc(u.email || '—')}</div>
          </div>
        </div>

        <div style="font-size:13px">${esc(u.phone || '—')}</div>
        <div style="font-size:13px;font-weight:600">${esc(u.role)}</div>
        <div>${moduleChips(u.modules)}</div>
        <div>${statusPill(u.status)}</div>

        <div style="display:flex;gap:6px;justify-content:flex-end">
          ${u.is_owner ? '' : `
          <button data-act="edit" data-id="${u.id}" title="Modifier"
            style="width:32px;height:32px;border-radius:9px;border:1px solid rgba(0,0,0,.1);
                   background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#12120f" stroke-width="1.8"><path d="M11.5 2.5l2 2L6 12l-3 1 1-3 7.5-7.5z"/></svg>
          </button>
          <button data-act="pwd" data-id="${u.id}" title="Réinitialiser le mot de passe"
            style="width:32px;height:32px;border-radius:9px;border:1px solid rgba(0,0,0,.1);
                   background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#12120f" stroke-width="1.8"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>
          </button>
          <button data-act="toggle" data-id="${u.id}" title="${u.status === 'active' ? 'Suspendre' : 'Réactiver'}"
            style="width:32px;height:32px;border-radius:9px;border:1px solid rgba(0,0,0,.1);
                   background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="${u.status === 'active' ? '#dc2626' : '#16a34a'}" stroke-width="1.9">
              ${u.status === 'active'
                ? '<path d="M6 5v6M10 5v6"/>'
                : '<path d="M5 3.5l7 4.5-7 4.5z"/>'}
            </svg>
          </button>`}
        </div>
      </div>`).join('');
  }

  /* ═══ ACTIONS DU TABLEAU (délégation) ═══ */
  el.table.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id  = parseInt(btn.dataset.id, 10);
    const act = btn.dataset.act;
    const u   = STAFF.find(s => s.id === id);
    if (!u) return;

    if (act === 'edit') { openDrawer(id); return; }
    if (act === 'pwd')  { openPwdModal(u); return; }

    if (act === 'toggle') {
      const next = u.status === 'active' ? 'suspended' : 'active';
      const verb = next === 'active' ? 'réactiver' : 'suspendre';
      if (!confirm(`Voulez-vous ${verb} le compte de ${u.name} ?`)) return;
      try {
        await AfyaAPI.admin.setStatus(id, next);
        toast(next === 'active' ? 'Compte réactivé.' : 'Compte suspendu.');
        await loadStaff();
      } catch (err) { toast(errMsg(err), true); }
    }
  });

  /* ═══ MOT DE PASSE : le responsable en définit un nouveau ═══ */
  function buildPwdModal() {
    if ($('pwdModal')) return;
    const m = document.createElement('div');
    m.id = 'pwdModal';
    m.style.cssText =
      'position:fixed;inset:0;background:rgba(15,20,30,.45);backdrop-filter:blur(8px);' +
      'display:none;align-items:center;justify-content:center;z-index:9000;padding:24px';
    m.innerHTML = `
      <div style="background:#F8F8F3;border-radius:26px;padding:28px;max-width:430px;width:100%;
                  box-shadow:0 30px 70px rgba(0,0,0,.3)">
        <h3 style="font-size:19px;font-weight:800;letter-spacing:-.4px;margin-bottom:6px">
          Réinitialiser le mot de passe</h3>
        <p style="font-size:13.5px;color:#55554f;margin-bottom:20px" id="pwdWho"></p>

        <label style="display:block;margin-bottom:14px">
          <span style="display:block;font-size:11px;font-weight:800;letter-spacing:.7px;
                       text-transform:uppercase;color:#8B8D86;margin-bottom:7px">Nouveau mot de passe</span>
          <input id="pwdNew" type="password" placeholder="6 caractères minimum"
            style="width:100%;padding:13px 15px;border:1.5px solid rgba(0,0,0,.1);
                   border-radius:13px;font-family:inherit;font-size:14px;outline:none">
        </label>

        <label style="display:block;margin-bottom:18px">
          <span style="display:block;font-size:11px;font-weight:800;letter-spacing:.7px;
                       text-transform:uppercase;color:#8B8D86;margin-bottom:7px">Confirmation</span>
          <input id="pwdConfirm" type="password" placeholder="Retapez le mot de passe"
            style="width:100%;padding:13px 15px;border:1.5px solid rgba(0,0,0,.1);
                   border-radius:13px;font-family:inherit;font-size:14px;outline:none">
        </label>

        <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.28);
                    border-radius:13px;padding:12px 14px;font-size:12.5px;color:#92400e;
                    font-weight:600;margin-bottom:20px">
          L'employé sera déconnecté de toutes ses sessions.
          Communiquez-lui le nouveau mot de passe.
        </div>

        <div style="display:flex;gap:10px">
          <button id="pwdCancel" style="flex:1;padding:13px;border-radius:999px;
            border:1.5px solid rgba(0,0,0,.1);background:#fff;font-family:inherit;
            font-size:13.5px;font-weight:700;cursor:pointer">Annuler</button>
          <button id="pwdSave" style="flex:1.3;padding:13px;border-radius:999px;border:none;
            background:#12120f;color:#fff;font-family:inherit;font-size:13.5px;
            font-weight:700;cursor:pointer">Enregistrer</button>
        </div>
      </div>`;
    document.body.appendChild(m);

    $('pwdCancel').addEventListener('click', closePwdModal);
    m.addEventListener('click', (e) => { if (e.target === m) closePwdModal(); });

    $('pwdSave').addEventListener('click', async () => {
      const p1 = $('pwdNew').value;
      const p2 = $('pwdConfirm').value;
      if (p1.length < 6)  { toast('6 caractères minimum.', true); return; }
      if (p1 !== p2)      { toast('Les deux mots de passe diffèrent.', true); return; }

      const btn = $('pwdSave');
      btn.disabled = true; btn.textContent = 'Patientez…';
      try {
        const res = await AfyaAPI.admin.resetPassword(pwdTarget.id, p1, p2);
        toast(res.message || 'Mot de passe modifié.');
        closePwdModal();
      } catch (err) {
        toast(errMsg(err), true);
      } finally {
        btn.disabled = false; btn.textContent = 'Enregistrer';
      }
    });
  }

  function openPwdModal(u) {
    buildPwdModal();
    pwdTarget = u;
    $('pwdWho').textContent = `Compte de ${u.name} — ${u.phone || ''}`;
    $('pwdNew').value = '';
    $('pwdConfirm').value = '';
    $('pwdModal').style.display = 'flex';
    setTimeout(() => $('pwdNew').focus(), 80);
  }

  function closePwdModal() {
    const m = $('pwdModal');
    if (m) m.style.display = 'none';
    pwdTarget = null;
  }

  /* ═══ ENREGISTREMENT ═══ */
  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(el.form);
    const first = (fd.get('first_name') || '').trim();
    const last  = (fd.get('last_name')  || '').trim();

    const modules = [...document.querySelectorAll('#moduleBoxes input:checked')]
      .map(c => c.value);

    if (!modules.length) {
      toast('Cochez au moins un module autorisé.', true);
      return;
    }

    const pwd  = fd.get('password') || '';
    const pwd2 = fd.get('password_confirmation') || '';
    if (!editId) {
      if (pwd.length < 6) { toast('Mot de passe : 6 caractères minimum.', true); return; }
      if (pwd !== pwd2)   { toast('Les deux mots de passe diffèrent.', true); return; }
    }

    const payload = {
      name:         (first + ' ' + last).trim(),
      first_name:   first,
      last_name:    last,
      email:        (fd.get('email') || '').trim() || null,
      phone:        (fd.get('phone') || '').trim(),
      country_iso:  fd.get('country_iso') || 'CD',
      role_id:      parseInt(fd.get('role_id'), 10),
      status:       fd.get('status') || 'active',
      module_codes: modules,
    };

    if (!editId) payload.password = pwd;

    // Champs cliniques : uniquement si le formulaire complet est affiché
    if (FORMMODE !== 'simple') {
      ['title', 'gender', 'middle_name', 'date_of_birth', 'national_id',
       'hire_date', 'specialty', 'medical_license_number', 'bio'].forEach(k => {
        const v = (fd.get(k) || '').trim();
        if (v) payload[k] = v;
      });
      ['department_id', 'service_id'].forEach(k => {
        const v = fd.get(k);
        if (v) payload[k] = parseInt(v, 10);
      });
    }

    const submit = document.querySelector('#drawer button[type="submit"], #drawer .btn-primary');
    const label  = submit ? submit.textContent : '';
    if (submit) { submit.disabled = true; submit.textContent = 'Patientez…'; }

    try {
      if (editId) {
        await AfyaAPI.admin.updateStaff(editId, payload);
        toast('Utilisateur mis à jour.');
      } else {
        const res = await AfyaAPI.admin.createStaff(payload);
        toast(res.message || 'Utilisateur créé.');
      }
      closeDrawer();
      await loadStaff();
    } catch (err) {
      toast(errMsg(err), true);
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = label; }
    }
  });

  /* ═══ FILTRES ═══ */
  let searchTimer = null;
  if (el.search) {
    el.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadStaff, 320);
    });
  }
  if (el.statusF) el.statusF.addEventListener('change', loadStaff);
  if (el.roleF)   el.roleF.addEventListener('change', renderTable);

  /* ═══ OUVERTURE / FERMETURE DU TIROIR ═══ */
  ['openCreate', 'openCreateTable'].forEach(id => {
    const b = $(id);
    if (b) b.addEventListener('click', () => openDrawer(null));
  });
  ['closeDrawer', 'cancelBtn'].forEach(id => {
    const b = $(id);
    if (b) b.addEventListener('click', closeDrawer);
  });
  if (el.backdrop) el.backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDrawer(); closePwdModal(); }
  });

  /* ═══ DÉMARRAGE ═══ */
  async function init() {
    if (!window.AfyaAPI) { setTimeout(init, 60); return; }
    if (!AfyaAPI.Token.exists()) { window.location.href = '../../login'; return; }

    try {
      await loadRefs();
      await loadStaff();
      console.log('✅ Administration prête —', STAFF.length, 'utilisateur(s) ·',
                  'formulaire', FORMMODE);
    } catch (e) {
      console.error('Init admin :', e);
      toast(errMsg(e), true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();