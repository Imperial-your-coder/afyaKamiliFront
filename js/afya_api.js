/* ═══════════════════════════════════════════════════════════
   AFYA KAMILI — COUCHE API
   Connexion, token, tous les endpoints + adaptateurs de champs.

   ⚙️  CONFIGURATION : change UNE seule ligne (API_BASE) pour
       passer du dev local à la production.
═══════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────
   1. CONFIGURATION — bascule AUTOMATIQUE dev / prod
   Aucune ligne à changer avant chaque déploiement :
   le code détecte s'il tourne en local ou en ligne.
─────────────────────────────────────────────── */
const API_BASE = (function () {
  const host = location.hostname;

  // Développement : Live Server, localhost, IP locale
  const isLocal = host === 'localhost'
               || host === '127.0.0.1'
               || host === ''                       // fichier ouvert en local
               || /^192\.168\./.test(host)
               || /^10\./.test(host);

  return isLocal
    ? 'http://localhost:8000/api'
    : 'https://api.afyakamili.com/api';
})();

/* Origine du serveur, SANS le /api final.
   Sert à construire les URLs d'images : le front tourne sur :5500,
   les fichiers sont servis par l'API sur :8000. */
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const TOKEN_KEY = 'afya_auth_token';

/* ───────────────────────────────────────────────
   2. GESTION DU TOKEN (localStorage)
─────────────────────────────────────────────── */
const Token = {
  get:   ()      => localStorage.getItem(TOKEN_KEY),
  set:   (t)     => localStorage.setItem(TOKEN_KEY, t),
  clear: ()      => localStorage.removeItem(TOKEN_KEY),
  exists:()      => !!localStorage.getItem(TOKEN_KEY),
};

/* ───────────────────────────────────────────────
   3. CŒUR : fonction request()
   Ajoute le token, gère les erreurs, parse le JSON.
─────────────────────────────────────────────── */
async function request(method, path, body = null, opts = {}) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const token = Token.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, config);
  } catch (networkErr) {
    // Pas de réseau / CORS / serveur down
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion.', null);
  }

  // 204 No Content
  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = { message: text }; }
  }

  if (!res.ok) {
    // Token expiré / invalide → déconnexion
    if (res.status === 401 && !opts.skipAuthRedirect) {
      Token.clear();
      if (typeof onAuthExpired === 'function') onAuthExpired();
    }
    const msg = data?.message || `Erreur ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }

  return data;
}

/* ───────────────────────────────────────────────
   Upload de fichier (multipart)
   ⚠ On ne met PAS de Content-Type : le navigateur
   l'ajoute lui-même avec le boundary du FormData.
─────────────────────────────────────────────── */
async function requestUpload(path, formData) {
  const headers = { 'Accept': 'application/json' };
  const token = Token.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  } catch (e) {
    throw new ApiError(0, 'Impossible de joindre le serveur.', null);
  }

  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }

  if (!res.ok) {
    if (res.status === 401) { Token.clear(); if (typeof onAuthExpired === 'function') onAuthExpired(); }
    throw new ApiError(res.status, data?.message || `Erreur ${res.status}`, data);
  }
  return data;
}

/* Erreur API structurée */
class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
    // Erreurs de validation Laravel : { errors: { field: [msg] } }
    this.validationErrors = data?.errors || null;
  }
  /** Premier message de validation, pratique pour un toast */
  firstError() {
    if (this.validationErrors) {
      const first = Object.values(this.validationErrors)[0];
      return Array.isArray(first) ? first[0] : first;
    }
    return this.message;
  }
}

/* Hook global appelé quand le token expire (redéfinis-le dans ta page) */
let onAuthExpired = () => {
  console.warn('Session expirée');
  // window.location.href = '/login';
};

/* ───────────────────────────────────────────────
   4. ADAPTATEURS
   Traduisent le format API ↔ format attendu par le front.
   C'est ICI qu'on corrige les décalages de noms au 1er test.
─────────────────────────────────────────────── */
/** /storage/x.jpg → http://localhost:8000/storage/x.jpg */
function absoluteUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return API_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}

const Adapt = {
  /** API medication → objet attendu par index.js (MEDICATIONS[]) */
  medicationFromApi(m) {
    const stock = m.total_stock ?? m.available_stock ?? 0;   // en UNITÉS DE BASE
    const pack  = m.pack_size || 1;

    return {
      id:            m.id,
      name:          m.name,
      generic:       m.generic_name || '',
      code:          m.code,
      form:          m.form?.name || '',
      form_id:       m.form_id,
      form_code:     m.form?.code || null,
      strength:      m.strength || '',
      category:      m.category?.name || 'Divers',
      category_id:   m.category_id,

      // Prix
      price:           parseFloat(m.unit_price ?? 0),            // prix BOÎTE
      price_per_unit:  m.price_per_unit  !== null ? parseFloat(m.price_per_unit)  : null,
      price_per_strip: m.price_per_strip !== null ? parseFloat(m.price_per_strip) : null,

      // Conditionnement
      base_unit:       m.base_unit || 'comprimé',
      pack_size:       m.pack_size || null,
      units_per_strip: m.units_per_strip || null,
      sale_units:      m.sale_units || ['boite'],

      // Stock — en unités de base, + équivalent boîtes pour l'affichage
      stock:        parseInt(stock, 10) || 0,
      stock_boxes:  pack > 0 ? +(stock / pack).toFixed(2) : 0,
      min_stock:    m.min_stock_level ?? 0,

      expiry:       m.nearest_expiry || '2099-12-31',   // pas de lot → date lointaine (évite le faux 'PÉRIMÉ')
      location:     m.storage_notes || m.location_name || '—',
      requires_prescription: !!m.requires_prescription,
      is_controlled: !!m.is_controlled,
      batch_number: m.batch_number || null,
      photo:        absoluteUrl(m.image_path),
      photo_raw:    m.image_path || null,        // chemin court, pour réenvoi en édition
      manufacturer: m.manufacturer || '',
      notes:        m.description || '',
    };
  },

  /** objet front → payload API pour créer/modifier un médicament */
  medicationToApi(f) {
    const p = {
      name:            f.name,
      generic_name:    f.generic || null,
      category_id:     f.category_id || null,
      form_id:         f.form_id || null,
      strength:        f.strength || null,
      unit_price:      parseFloat(f.price) || 0,
      pack_size:       f.pack_size || null,
      units_per_strip: f.units_per_strip || null,
      min_stock_level: f.min_stock ?? 0,
      requires_prescription: !!f.requires_prescription,
      is_controlled:   !!f.is_controlled,
      manufacturer:    f.manufacturer || null,
      description:     f.notes || null,
      image_path:      f.photo || null,
      sale_units:      f.sale_units || ['boite'],
    };

    // Stock initial : uniquement à la création (l'API crée alors un lot)
    if (f.initial_stock && f.initial_stock > 0) {
      p.initial_stock = parseInt(f.initial_stock, 10);
      if (f.expiry) p.expiry_date = f.expiry;
    }

    return p;
  },

  /** API journal entry → objet attendu par index.js (JOURNAL[]) */
  journalFromApi(e) {
    const t = e.created_at ? new Date(e.created_at) : new Date();
    return {
      id:      e.id,
      type:    e.entry_type === 'income' ? 'in' : 'out',
      desc:    e.description,
      ref:     e.reference_id ? `#${e.reference_id}` : (e.reference_type || ''),
      amount:  parseFloat(e.amount) || 0,
      method:  Adapt.payMethodLabel(e.payment_method),
      time:    `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2, '0')}`,
      // Champs pour l'annulation depuis le journal
      cancellable:   !!e.cancellable,
      cancelled:     !!e.cancelled,
      cancel_kind:   e.cancel_kind || null,      // 'sale' | 'expense'
      cancel_target: e.cancel_target || null,    // id à annuler
      is_reversal:   !!e.is_reversal,
    };
  },

  /** API purchase order → objet attendu par index.js (ORDERS[]) */
  orderFromApi(o) {
    return {
      id:       o.id,
      number:   o.order_number,
      supplier: o.supplier?.name || '—',
      status:   o.status,
      date:     o.ordered_at,
      amount:   parseFloat(o.total_amount) || 0,
      items:    o.items?.length || 0,
    };
  },

  payMethodLabel(code) {
    const map = {
      cash: 'Espèces', mobile_money: 'Mobile money', card: 'Carte',
      bank_transfer: 'Virement', credit: 'Crédit', other: 'Autre',
    };
    return map[code] || code || 'Espèces';
  },

  /** libellé mode de paiement front → code API */
  payMethodCode(label) {
    const map = {
      'Espèces': 'cash', 'Mobile money': 'mobile_money', 'Carte': 'card',
      'Virement': 'bank_transfer', 'Crédit': 'credit', 'Autre': 'other',
    };
    return map[label] || 'cash';
  },
};

/* ───────────────────────────────────────────────
   5. API — regroupée par domaine
─────────────────────────────────────────────── */
const AfyaAPI = {

  /* ═══ AUTH ═══ */
  auth: {
    /** Inscription établissement (crée tenant + proprio + trial) */
    async register(payload) {
      const data = await request('POST', '/auth/register', payload, { skipAuthRedirect: true });
      if (data.token) Token.set(data.token);
      return data;
    },

    /** Connexion par téléphone */
    async login(phone, password) {
      const data = await request('POST', '/auth/login',
        { phone, password }, { skipAuthRedirect: true });
      if (data.token) Token.set(data.token);
      return data;
    },

    async logout() {
      try { await request('POST', '/auth/logout'); }
      finally { Token.clear(); }
    },

    /** Profil courant + modules actifs + permissions */
    async me() {
      const data = await request('GET', '/auth/me');
      return data.user;
    },

    isLoggedIn: () => Token.exists(),
  },

  /* ═══ PHARMACIE — MÉDICAMENTS ═══ */
  medications: {
    /** Liste paginée. Retourne { items:[adaptés], meta:{pagination} } */
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const data = await request('GET', `/pharmacy/medications${qs ? '?' + qs : ''}`);
      return {
        items: (data.data || []).map(Adapt.medicationFromApi),
        meta: {
          current_page: data.current_page,
          last_page:    data.last_page,
          total:        data.total,
          per_page:     data.per_page,
        },
      };
    },

    /** Références : catégories, formes, unités de vente */
    async refs() {
      return await request('GET', '/pharmacy/medications/refs');
    },

    async get(id) {
      const data = await request('GET', `/pharmacy/medications/${id}`);
      return Adapt.medicationFromApi(data.medication);
    },

    /** Envoie un payload DÉJÀ au format API (prix saisis respectés) */
    async createRaw(payload) {
      const data = await request('POST', '/pharmacy/medications', payload);
      return Adapt.medicationFromApi(data.medication);
    },

    async updateRaw(id, payload) {
      const data = await request('PUT', `/pharmacy/medications/${id}`, payload);
      return Adapt.medicationFromApi(data.medication);
    },

    async create(frontObj) {
      const data = await request('POST', '/pharmacy/medications',
        Adapt.medicationToApi(frontObj));
      return Adapt.medicationFromApi(data.medication);
    },

    async update(id, frontObj) {
      const data = await request('PUT', `/pharmacy/medications/${id}`,
        Adapt.medicationToApi(frontObj));
      return Adapt.medicationFromApi(data.medication);
    },

    async remove(id) {
      return await request('DELETE', `/pharmacy/medications/${id}`);
    },
  },

  /* ═══ PHARMACIE — UPLOADS ═══ */
  uploads: {
    /**
     * Envoie une image de médicament.
     * @param {File|Blob} file
     * @returns {Promise<{path:string,url:string}>}
     */
    async medicationImage(file) {
      const fd = new FormData();
      fd.append('image', file, file.name || 'photo.jpg');
      return await requestUpload('/pharmacy/uploads/medication-image', fd);
    },

    async removeMedicationImage(path) {
      return await request('DELETE', '/pharmacy/uploads/medication-image', { path });
    },
  },

  /* ═══ PHARMACIE — VENTES ═══ */
  sales: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request('GET', `/pharmacy/sales${qs ? '?' + qs : ''}`);
    },

    /**
     * Créer une vente.
     * items: [{ medication_id, quantity, sale_unit_code, unit_price? }]
     */
    async create({ items, payment_method, customer_name, amount_paid, tax_rate, discount_amount }) {
      return await request('POST', '/pharmacy/sales', {
        items,
        payment_method:  Adapt.payMethodCode(payment_method) === payment_method
                           ? payment_method
                           : Adapt.payMethodCode(payment_method),
        customer_name:   customer_name || null,
        amount_paid:     amount_paid ?? null,
        tax_rate:        tax_rate ?? 0,
        discount_amount: discount_amount ?? 0,
      });
    },

    async cancel(id, reason) {
      return await request('POST', `/pharmacy/sales/${id}/cancel`, { reason });
    },
  },

  /* ═══ PHARMACIE — STOCK ═══ */
  stock: {
    async summary(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request('GET', `/pharmacy/stock${qs ? '?' + qs : ''}`);
    },
    async lots(medicationId) {
      return await request('GET', `/pharmacy/stock/${medicationId}/lots`);
    },
    async adjust({ medication_id, stock_id, type, quantity, reason }) {
      return await request('POST', '/pharmacy/stock/adjust',
        { medication_id, stock_id, type, quantity, reason });
    },
    async movements(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request('GET', `/pharmacy/stock/movements${qs ? '?' + qs : ''}`);
    },
  },

  /* ═══ PHARMACIE — COMPTABILITÉ ═══ */
  accounting: {
    /** Journal + résumé. period: day|week|month|year, type: income|expense */
    async journal(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const data = await request('GET', `/pharmacy/accounting/journal${qs ? '?' + qs : ''}`);
      return {
        entries: (data.entries?.data || []).map(Adapt.journalFromApi),
        summary: data.summary,
      };
    },

    async cancelExpense(entryId, reason) {
      return await request('POST', `/pharmacy/accounting/expense/${entryId}/cancel`, { reason });
    },

    async addExpense({ amount, description, payment_method, category_id }) {
      return await request('POST', '/pharmacy/accounting/expense', {
        amount,
        description,
        payment_method: Adapt.payMethodCode(payment_method),
        category_id: category_id || null,
      });
    },

    /** Données graphique + répartition modes de paiement */
    async chart(period = 'day') {
      return await request('GET', `/pharmacy/accounting/chart?period=${period}`);
    },

    async close({ actual_closing_balance, notes }) {
      return await request('POST', '/pharmacy/accounting/close',
        { actual_closing_balance, notes });
    },

    async closurePreview() {
      return await request('GET', '/pharmacy/accounting/closure');
    },

    async closures(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request('GET', `/pharmacy/accounting/closures${qs ? '?' + qs : ''}`);
    },
  },

  /* ═══ PHARMACIE — RÉCEPTION ═══ */
  receiving: {
    async store(items, extra = {}) {
      return await request('POST', '/pharmacy/receiving',
        { items, ...extra });
    },
    async expiring(days = 90) {
      return await request('GET', `/pharmacy/receiving/expiring?days=${days}`);
    },
  },

  /* ═══ PHARMACIE — ALERTES ═══ */
  alerts: {
    async list() {
      return await request('GET', '/pharmacy/alerts');
    },
  },

  /* ═══ PHARMACIE — FOURNISSEURS + COMMANDES ═══ */
  suppliers: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request('GET', `/pharmacy/suppliers${qs ? '?' + qs : ''}`);
    },
    async create(payload) { return await request('POST', '/pharmacy/suppliers', payload); },
    async update(id, p)   { return await request('PUT', `/pharmacy/suppliers/${id}`, p); },
    async remove(id)      { return await request('DELETE', `/pharmacy/suppliers/${id}`); },
  },

  orders: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const data = await request('GET', `/pharmacy/purchase-orders${qs ? '?' + qs : ''}`);
      return {
        items: (data.data || []).map(Adapt.orderFromApi),
        meta: { total: data.total, current_page: data.current_page, last_page: data.last_page },
      };
    },
    async create({ supplier_id, expected_delivery, notes, items }) {
      return await request('POST', '/pharmacy/purchase-orders',
        { supplier_id, expected_delivery, notes, items });
    },
    async updateStatus(id, status) {
      return await request('PATCH', `/pharmacy/purchase-orders/${id}/status`, { status });
    },
    async receive(id, { items, pay_now, payment_method }) {
      return await request('POST', `/pharmacy/purchase-orders/${id}/receive`,
        { items, pay_now: !!pay_now, payment_method });
    },
  },

  /* ═══ PHARMACIE — ORDONNANCES LIBRES ═══ */
  prescriptions: {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return await request('GET', `/pharmacy/free-prescriptions${qs ? '?' + qs : ''}`);
    },
    /** items: [{ medication_name, dosage_instructions, strength?, quantity?, duration? }] */
    async create(payload) {
      return await request('POST', '/pharmacy/free-prescriptions', payload);
    },
    async get(id)      { return await request('GET', `/pharmacy/free-prescriptions/${id}`); },
    async markPrinted(id) { return await request('PATCH', `/pharmacy/free-prescriptions/${id}/print`); },
    async remove(id)   { return await request('DELETE', `/pharmacy/free-prescriptions/${id}`); },
  },

  /* ═══ PHARMACIE — PARAMÈTRES ═══ */
  settings: {
    async get()          { return await request('GET', '/pharmacy/settings'); },
    async update(payload) { return await request('PUT', '/pharmacy/settings', payload); },
  },

  /* ═══ ABONNEMENTS ═══ */
  subscriptions: {
    async index()  { return await request('GET', '/subscriptions'); },
    async checkout({ module_codes, billing_cycle }) {
      return await request('POST', '/subscriptions/checkout',
        { module_codes, billing_cycle });
    },
  },

  /* expose les utilitaires */
  Token,
  ApiError,
  Adapt,
  API_ORIGIN,
  absoluteUrl,
  setAuthExpiredHandler(fn) { onAuthExpired = fn; },
};

/* Disponible globalement */
window.AfyaAPI = AfyaAPI;