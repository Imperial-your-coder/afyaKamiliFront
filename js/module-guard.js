/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — GARDE DU TABLEAU DE BORD

   Un employé qui n'a accès qu'à un seul module métier n'a rien
   à faire sur le tableau de bord : il n'y verrait que des cartes
   verrouillées. Cette garde le renvoie dans son module, y compris
   s'il tape l'adresse à la main ou clique un lien.

   À charger EN PREMIER dans le <head> du tableau de bord :
     <script src="./js/module-guard.js"></script>

   Le script s'exécute avant le rendu pour éviter que la page
   n'apparaisse une fraction de seconde avant la redirection.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MODULE_PATHS = {
    pharmacy:       './modules/pharmacy/index',
    patients:       './modules/patients/index',
    consultations:  './modules/patients/index',
    administration: './modules/admin/index',
    laboratory:     './modules/laboratory/index',
    imaging:        './modules/imaging/index'
  };

  /* L'administration accompagne un métier sans en être un :
     elle ne compte pas pour décider d'une redirection. */
  function businessModules(list) {
    return (list || []).filter(function (m) { return m !== 'administration'; });
  }

  function readModules() {
    try {
      var raw = localStorage.getItem('afya_user_modules');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* stockage illisible : on laisse passer */ }
    return null;
  }

  function redirectIfSingleModule(mods) {
    var business = businessModules(mods);
    if (business.length !== 1) return false;

    var path = MODULE_PATHS[business[0]];
    if (!path) return false;

    window.location.replace(path);
    return true;
  }

  var mods = readModules();

  if (mods) {
    redirectIfSingleModule(mods);
    return;
  }

  /* Pas de modules en mémoire (session ancienne, autre navigateur) :
     on demande à l'API, sans bloquer l'affichage. */
  var token = localStorage.getItem('afya_auth_token');
  if (!token) return;

  var base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : 'https://api.afyakamili.com/api';

  fetch(base + '/auth/me', {
    headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var user = data && (data.user || data);
      if (!user || !user.modules) return;
      try {
        localStorage.setItem('afya_user_modules', JSON.stringify(user.modules));
      } catch (e) { /* peu importe */ }
      redirectIfSingleModule(user.modules);
    })
    .catch(function () { /* hors ligne : on laisse la page s'afficher */ });
})();