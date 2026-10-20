/* Mode démo : aucun compte, aucun serveur. Une mini-base en mémoire
   (gardée dans la session du navigateur) répond à la place de l'API. */
(function () {
  if (window.AfyaAPI?.auth) window.AfyaAPI.auth.isLoggedIn = () => true;

  const FORMS = [{id:1,code:'CP',name:'Comprimé'},{id:2,code:'GEL',name:'Gélule'},{id:3,code:'SIR',name:'Sirop'},
    {id:4,code:'INJ',name:'Ampoule injectable'},{id:5,code:'CRE',name:'Crème / Pommade'},{id:6,code:'POU',name:'Sachet poudre'},
    {id:7,code:'CONS',name:'Autre'}];
  const CATS = [{id:1,name:'Analgésiques'},{id:2,name:'Antibiotiques'},{id:3,name:'Antipaludéens'},{id:4,name:'Vitamines'},{id:5,name:'Autres'}];
  const mk = (id, name, form_id, cat, price, stock, pack = 1, strip = null) =>
    ({ id, name, form_id, category_id: cat, unit_price: price, total_stock: stock, pack_size: pack, units_per_strip: strip, min_stock_level: 10, sale_units: ['boite'] });
  const KEY = 'afya_demo_db';
  let DB; try { DB = JSON.parse(sessionStorage.getItem(KEY)); } catch {}
  DB ||= [mk(1,'Paracétamol 500mg',1,1,2.5,120,20,10), mk(2,'Amoxicilline 500mg',2,2,6,8,16,8), mk(3,'Coartem 80/480',1,3,9,40,6,6),
          mk(4,'Ibuprofène 400mg',1,1,3,0,20,10), mk(5,'Sirop Toux Enfant',3,5,4.5,25), mk(6,'Vitamine C 1000',1,4,5,60,10,10)];
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DB)); } catch {} };
  const full = m => ({ ...m, form: FORMS.find(f => f.id == m.form_id) || null, category: CATS.find(c => c.id == m.category_id) || null });
  const json = (o, s = 200) => Promise.resolve(new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } }));

  const of = window.fetch;
  window.fetch = (u, o = {}) => {
    const url = String(u), meth = (o.method || 'GET').toUpperCase();
    if (/fonts|unpkg|openfoodfacts/.test(url)) return of(u, o);
    if (/medications\/refs/.test(url)) return json({ categories: CATS, forms: FORMS, sale_units: [] });
    const one = url.match(/pharmacy\/medications\/(\d+)/);
    if (/pharmacy\/medications/.test(url)) {
      let body = {}; try { body = JSON.parse(o.body || '{}'); } catch {}
      const stockOf = b => b.initial_stock ?? b.stock ?? b.quantity ?? 0;
      if (meth === 'POST' && !one) {
        const m = { ...body, id: Date.now(), total_stock: stockOf(body) }; DB.push(m); save();
        return json({ medication: full(m) }, 201);
      }
      if (meth === 'PUT' && one) {
        const i = DB.findIndex(m => m.id == one[1]); if (i > -1) DB[i] = { ...DB[i], ...body }; save();
        return json({ medication: full(DB[i]) });
      }
      if (meth === 'DELETE' && one) { DB = DB.filter(m => m.id != one[1]); save(); return json({ success: true }); }
      if (meth === 'GET' && !one) return json({ data: DB.map(full), total: DB.length });
    }
    return json({ success: true, data: [] });
  };
  window.addEventListener('load', () => setTimeout(() => document.querySelectorAll('.afya-tip').forEach(e => e.remove()), 800));
})();
