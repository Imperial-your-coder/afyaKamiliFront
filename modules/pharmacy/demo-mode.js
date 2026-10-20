/* Mode démo : aucun compte, aucune requête au serveur, données fictives. */
(function () {
  if (window.AfyaAPI?.auth) window.AfyaAPI.auth.isLoggedIn = () => true;
  const of = window.fetch;
  const REFS = { categories: [{id:1,name:'Analgésiques'},{id:2,name:'Antibiotiques'},{id:3,name:'Hygiène'}],
    forms: [{id:1,code:'CP',name:'Comprimé'},{id:2,code:'GEL',name:'Gélule'},{id:3,code:'SIR',name:'Sirop'},
      {id:4,code:'INJ',name:'Ampoule injectable'},{id:5,code:'CRE',name:'Crème / Pommade'},{id:6,code:'POU',name:'Sachet poudre'},
      {id:7,code:'CONS',name:'Consommable / Hygiène'}], sale_units: [] };
  window.fetch = (u, o) => /fonts|unpkg|openfoodfacts/.test(String(u)) ? of(u, o)
    : Promise.resolve(new Response(/refs/.test(String(u)) ? JSON.stringify(REFS) : '{"success":true,"data":[]}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
  window.addEventListener('load', () => setTimeout(() => {
    const D = [
      ['Paracétamol 500mg','Comprimé',2.5,120],['Amoxicilline 500mg','Gélule',6,8],
      ['Coartem 80/480','Comprimé',9,40],['Ibuprofène 400mg','Comprimé',3,0],
      ['Sirop Toux Enfant','Sirop',4.5,25],['Vitamine C 1000','Comprimé effervescent',5,60]];
    D.forEach(([name, form, price, stock], i) => MEDICATIONS.push({ id: i + 1, name, form, price, unit_price: price, stock, min_stock: 10, sale_units: ['boite'], pack_size: 1 }));
    try { renderCatalog(); } catch {}
    document.querySelectorAll('.afya-tip').forEach(e => e.remove());
  }, 600));
})();
