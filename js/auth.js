/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — CÂBLAGE AUTHENTIFICATION
   Branche login sur l'API (login + inscription wizard).

   À charger APRÈS afya_api.js, à la fin de login :
     <script src="./js/afya_api.js"></script>
     <script src="./js/auth.js"></script>

   ⚠️ UNE MODIF requise dans login (ligne ~374) :
      Remplace  onclick="window.location.href='./index'"
      par       id="loginBtn"
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Si déjà connecté → va direct au dashboard */
  if (AfyaAPI.auth.isLoggedIn()) {
    // Décommente si tu veux la redirection auto :
    // window.location.href = './index';
  }

  /* ───────────────────────────────────────────────
     Helpers UI (réutilise showToast de login)
  ─────────────────────────────────────────────── */
  function toast(msg, isError = false) {
    if (typeof showToast === 'function') showToast(msg, isError);
    else alert(msg);
  }

  function setBtnLoading(btn, loading, originalHtml) {
    if (!btn) return;
    if (loading) {
      btn.dataset.original = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'wait';
      btn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite"></span> Patientez…';
      if (!document.getElementById('spinStyle')) {
        const st = document.createElement('style');
        st.id = 'spinStyle';
        st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(st);
      }
    } else {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.innerHTML = btn.dataset.original || originalHtml || 'Continuer';
    }
  }

  /** Normalise un numéro : "+243 990 000 000" → "+243990000000" */
  function cleanPhone(raw) {
    return (raw || '').replace(/[\s\-().]/g, '');
  }

  /** Extrait le message d'erreur le plus utile */
  function errorMessage(e) {
    if (e instanceof AfyaAPI.ApiError) return e.firstError();
    return e?.message || 'Une erreur est survenue.';
  }

  /* ═══════════════════════════════════════════
     1. CONNEXION
  ═══════════════════════════════════════════ */
  async function doLogin() {
    const phoneEl = document.getElementById('loginPhone');
    const pwEl    = document.getElementById('pwInput');
    const btn     = document.getElementById('loginBtn');

    const phone    = cleanPhone(phoneEl?.value);
    const password = pwEl?.value || '';

    if (!phone) {
      toast('Saisissez votre numéro de téléphone.', true);
      phoneEl?.focus();
      return;
    }
    if (!password) {
      toast('Saisissez votre mot de passe.', true);
      pwEl?.focus();
      return;
    }

    setBtnLoading(btn, true);
    try {
      const res = await AfyaAPI.auth.login(phone, password);
      // Stocke les modules actifs pour le dashboard
      if (res.user?.tenant?.modules) {
        localStorage.setItem('afya_modules', JSON.stringify(res.user.tenant.modules));
      }
      localStorage.setItem('afya_user', JSON.stringify({
        name: res.user.name,
        is_owner: res.user.is_owner,
        establishment: res.user.tenant?.establishment_name,
      }));

      toast(`Bienvenue ${res.user.name} !`, false);
      setTimeout(() => { window.location.href = './index'; }, 900);
    } catch (e) {
      setBtnLoading(btn, false);
      toast(errorMessage(e), true);
      console.error('Login:', e);
    }
  }

  /* Branche le bouton (par id, ou fallback sur le 1er bouton du form) */
  function bindLogin() {
    let btn = document.getElementById('loginBtn');

    if (!btn) {
      // Fallback : trouve le bouton "Se connecter" dans #loginForm
      const form = document.getElementById('loginForm');
      const candidates = form ? form.querySelectorAll('button') : [];
      candidates.forEach(b => {
        if (/se connecter|connexion/i.test(b.textContent) && !b.id) {
          btn = b;
          btn.id = 'loginBtn';
        }
      });
    }

    if (btn) {
      btn.removeAttribute('onclick');   // ← neutralise la redirection en dur
      btn.addEventListener('click', (e) => { e.preventDefault(); doLogin(); });
    } else {
      console.warn('Bouton de connexion introuvable — ajoute id="loginBtn"');
    }

    // Entrée = connexion
    ['loginPhone', 'pwInput'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
      });
    });
  }

  /* ═══════════════════════════════════════════
     2. INSCRIPTION (wizard 6 étapes)
     On remplace submitSignup() défini dans login
  ═══════════════════════════════════════════ */
  window.submitSignup = async function () {
    const btn = document.getElementById('wizardNextBtn');

    const establishment = document.getElementById('suEstablishment')?.value.trim();
    const ownerName     = document.getElementById('suOwnerName')?.value.trim();
    const countryCode   = document.getElementById('suCountryCode')?.value || '+243';
    const phoneRaw      = document.getElementById('suPhone')?.value.trim();
    const email         = document.getElementById('suEmail')?.value.trim();
    const password      = document.getElementById('suPassword')?.value;
    const passwordConf  = document.getElementById('suPasswordConfirm')?.value;

    const payload = {
      establishment_name:    establishment,
      owner_name:            ownerName,
      phone:                 cleanPhone(countryCode + phoneRaw),  // ← 'phone', pas 'owner_phone'
      email:                 email || null,
      password:              password,
      password_confirmation: passwordConf,                        // ← requis par l'API
      country:               'CD',
      terms_accepted:        true,
    };

    setBtnLoading(btn, true);
    try {
      const res = await AfyaAPI.auth.register(payload);

      if (res.user?.tenant?.modules) {
        localStorage.setItem('afya_modules', JSON.stringify(res.user.tenant.modules));
      }
      localStorage.setItem('afya_user', JSON.stringify({
        name: res.user.name,
        is_owner: res.user.is_owner,
        establishment: res.user.tenant?.establishment_name,
      }));

      toast('Compte créé ! Essai gratuit de 14 jours activé.', false);
      setTimeout(() => { window.location.href = './index'; }, 1400);
    } catch (e) {
      setBtnLoading(btn, false);

      // Erreur sur le téléphone → renvoie à l'étape 3
      if (e instanceof AfyaAPI.ApiError && e.validationErrors?.phone) {
        toast(e.validationErrors.phone[0], true);
        if (typeof goToStep === 'function') goToStep(3);
        return;
      }
      toast(errorMessage(e), true);
      console.error('Register:', e);
    }
  };

  /* ═══════════════════════════════════════════
     3. INIT
  ═══════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLogin);
  } else {
    bindLogin();
  }

})();