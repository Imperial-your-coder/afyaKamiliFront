/* ═══════════════════════════════════════════════════════════════
   AFYA KAMILI — patients.js v4
   Liste patients + Workspace premium iOS
═══════════════════════════════════════════════════════════════ */

/* ── CONFIG ── */
const BODY_BASE  = '../../media';
const BODY_FILES = { front:'face.png', back:'back.png', left:'left.png', right:'right.png' };

/* ── HIT ZONE — ray casting sur la silhouette ── */
const HIT = {
  front:[[38,3],[62,3],[66,12],[60,18],[64,28],[64,56],[71,58],[76,63],[74,82],[68,98],[63,100],[57,100],[55,76],[52,70],[48,70],[45,76],[43,100],[37,100],[32,98],[26,82],[24,63],[29,58],[36,56],[36,28],[40,18],[34,12]],
  back: [[37,3],[63,3],[67,12],[61,18],[65,28],[65,56],[72,58],[76,63],[74,82],[68,98],[63,100],[57,100],[55,76],[52,70],[48,70],[45,76],[43,100],[37,100],[32,98],[26,82],[24,63],[28,58],[35,56],[35,28],[39,18],[33,12]],
  left: [[20,3],[80,3],[80,100],[20,100]],
  right:[[20,3],[80,3],[80,100],[20,100]]
};
function onBody(x,y,v){
  const p=HIT[v]||HIT.front;let i=false;
  for(let a=0,b=p.length-1;a<p.length;b=a++){
    const[xa,ya]=p[a],[xb,yb]=p[b];
    if(((ya>y)!==(yb>y))&&(x<(xb-xa)*(y-ya)/(yb-ya)+xa))i=!i;
  }
  return i;
}

/* ── PATIENTS ── */
const patients=[
  {id:1,code:"PAT-2026-0001",first_name:"Jean",middle_name:"K.",last_name:"Kabila",gender:"male",dob:"1984-03-12",phone:"+243 990 111 222",email:"jean.kabila@example.com",city:"Lubumbashi",country:"CD",blood:"O+",status:"active",occupation:"Commerçant",marital:"Marié",last_visit:"2026-06-08",allergy:"Aucune connue",chronic:"Hypertension contrôlée",emergency:"Maman Chantal · Épouse · +243 991 000 111",insurance:"Paiement direct",vitals:"TA 128/82 · FC 78 · SpO₂ 98%"},
  {id:2,code:"PAT-2026-0002",first_name:"Sarah",middle_name:"Mbuyi",last_name:"Ilunga",gender:"female",dob:"1996-11-04",phone:"+243 974 222 319",email:"sarah.ilunga@example.com",city:"Likasi",country:"CD",blood:"A+",status:"hospitalized",occupation:"Enseignante",marital:"Célibataire",last_visit:"2026-06-09",allergy:"Pénicilline — réaction cutanée",chronic:"Asthme",emergency:"Mbuyi Pascal · Père · +243 975 010 000",insurance:"Mutuelle Santé Plus · 80%",vitals:"TA 116/74 · FC 88 · SpO₂ 96%"},
  {id:3,code:"PAT-2026-0003",first_name:"Moïse",middle_name:"Tshibangu",last_name:"Kazadi",gender:"male",dob:"1971-07-21",phone:"+243 812 445 009",email:"",city:"Kolwezi",country:"CD",blood:"B+",status:"active",occupation:"Ingénieur",marital:"Marié",last_visit:"2026-06-02",allergy:"Arachides",chronic:"Diabète type 2",emergency:"Kazadi Nadine · Fille · +243 899 100 020",insurance:"Gécamines · 70%",vitals:"TA 136/86 · FC 82 · Glycémie 142"},
  {id:4,code:"PAT-2026-0004",first_name:"Grâce",middle_name:"Naomie",last_name:"Mutombo",gender:"female",dob:"2001-01-18",phone:"+243 997 014 622",email:"grace.mutombo@example.com",city:"Lubumbashi",country:"CD",blood:"AB-",status:"active",occupation:"Étudiante",marital:"Célibataire",last_visit:"2026-05-29",allergy:"Aucune connue",chronic:"Aucun antécédent majeur",emergency:"Mutombo Joseph · Oncle · +243 970 300 455",insurance:"Paiement direct",vitals:"TA 110/70 · FC 72 · SpO₂ 99%"},
  {id:5,code:"PAT-2026-0005",first_name:"Patrick",middle_name:"Mwamba",last_name:"Kalenga",gender:"male",dob:"2018-09-02",phone:"+243 991 761 222",email:"",city:"Kipushi",country:"CD",blood:"O-",status:"hospitalized",occupation:"Enfant",marital:"N/A",last_visit:"2026-06-09",allergy:"Sulfamides — à confirmer",chronic:"Drépanocytose connue",emergency:"Kalenga Aimée · Mère · +243 991 761 220",insurance:"Prise en charge sociale",vitals:"T° 38.5 · FC 112 · SpO₂ 95%"},
  {id:6,code:"PAT-2026-0006",first_name:"Aline",middle_name:"Banza",last_name:"Kabongo",gender:"female",dob:"1989-05-30",phone:"+243 979 550 110",email:"aline.kabongo@example.com",city:"Lubumbashi",country:"CD",blood:"B-",status:"inactive",occupation:"Comptable",marital:"Divorcée",last_visit:"2026-03-14",allergy:"Latex",chronic:"Migraine chronique",emergency:"Banza Carine · Sœur · +243 979 440 000",insurance:"Assurance privée · expirée",vitals:"Dernières constantes normales"}
];

/* ── BODY POINTS ── */
const BPD = {
  1:[
    {id:101,pid:1,label:"Genou droit",region:"right_knee",view:"front",x:58,y:75,status:"active",date:"2026-06-10",
     consultations:[
       {id:1,date:"2026-06-10",time:"10:00",doc:"Dr. Mbala",reason:"Douleur après chute en escalier",diag:"Entorse légère ligament latéral",notes:"Repos, glaçage et anti-inflammatoire local.",status:"Résolu"},
       {id:2,date:"2026-07-20",time:"14:30",doc:"Dr. Admin",reason:"Douleur persistante malgré traitement",diag:"Suspicion lésion ménisque interne",notes:"IRM demandée. Orientation orthopédie.",status:"En attente"}],
     notes:[{date:"2026-07-20",title:"Douleur mécanique",text:"Douleur augmentée lors de la flexion et à la marche prolongée.",doc:"Dr. Admin"}],
     prescriptions:[
       {date:"2026-06-10",drug:"Ibuprofène",dose:"400 mg",freq:"2×/jour",duration:"5 jours"},
       {date:"2026-07-20",drug:"Diclofenac gel",dose:"Application locale",freq:"2×/jour",duration:"7 jours"}],
     labs:[],
     imaging:[
       {date:"2026-06-10",type:"Radio",title:"Radio genou droit",status:"Normal",report:"Pas de fracture visible."},
       {date:"2026-07-20",type:"IRM",title:"IRM genou droit",status:"En attente",report:"Demande créée."}],
     documents:[{date:"2026-06-10",title:"Photo gonflement genou",type:"Photo clinique",status:"Ajoutée"}]},
    {id:102,pid:1,label:"Thorax",region:"chest",view:"front",x:50,y:33,status:"active",date:"2026-04-02",
     consultations:[{id:3,date:"2026-04-02",time:"11:00",doc:"Dr. Ngoy",reason:"Douleur thoracique à l'effort",diag:"Hypertension artérielle contrôlée",notes:"ECG normal. TA 128/82. Surveillance mensuelle.",status:"Sous surveillance"}],
     notes:[{date:"2026-04-02",title:"Suivi HTA",text:"TA à surveiller mensuellement.",doc:"Dr. Ngoy"}],
     prescriptions:[{date:"2026-04-02",drug:"Amlodipine",dose:"5 mg",freq:"1×/jour",duration:"3 mois"}],
     labs:[{date:"2026-04-03",title:"Bilan lipidique",value:"LDL 142 mg/dL",status:"Élevé"}],
     imaging:[{date:"2026-04-02",type:"ECG",title:"ECG de repos",status:"Normal",report:"Rythme sinusal."}],
     documents:[]}
  ],
  2:[{id:201,pid:2,label:"Thorax / poumons",region:"chest_lungs",view:"front",x:50,y:33,status:"active",date:"2026-06-09",
      consultations:[{id:4,date:"2026-06-09",time:"08:45",doc:"Dr. Ilunga",reason:"Dyspnée et toux nocturne",diag:"Crise d'asthme modérée",notes:"Sibilants diffus, SpO₂ 96%. Surveillance rapprochée.",status:"Actif"}],
      notes:[{date:"2026-06-09",title:"Surveillance respiratoire",text:"Recontrôler SpO₂ après nébulisation.",doc:"Dr. Ilunga"}],
      prescriptions:[{date:"2026-06-09",drug:"Salbutamol",dose:"Nébulisation",freq:"Toutes les 6h si besoin",duration:"48h"},{date:"2026-06-09",drug:"Prednisolone",dose:"40 mg",freq:"1×/jour",duration:"5 jours"}],
      labs:[{date:"2026-06-09",title:"NFS",value:"Légère hyperéosinophilie",status:"Disponible"}],
      imaging:[{date:"2026-06-09",type:"Radio",title:"Radio thorax",status:"Disponible",report:"Pas de foyer infectieux évident."}],
      documents:[{date:"2026-06-09",title:"CR radio thorax",type:"PDF",status:"Ajouté"}]}],
  3:[{id:301,pid:3,label:"Abdomen",region:"abdomen",view:"front",x:50,y:52,status:"active",date:"2026-06-02",
      consultations:[{id:5,date:"2026-06-02",time:"09:00",doc:"Dr. Mbala",reason:"Douleurs abdominales et glycémie élevée",diag:"Déséquilibre diabétique",notes:"Contrôle glycémique et bilan rénal demandés.",status:"Sous surveillance"}],
      notes:[{date:"2026-06-02",title:"Éducation thérapeutique",text:"Conseils alimentaires et suivi glycémie.",doc:"Dr. Mbala"}],
      prescriptions:[{date:"2026-06-02",drug:"Metformine",dose:"500 mg",freq:"2×/jour",duration:"30 jours"}],
      labs:[{date:"2026-06-02",title:"Glycémie",value:"142 mg/dL",status:"Disponible"}],
      imaging:[],documents:[]}],
  4:[{id:401,pid:4,label:"Tête",region:"head",view:"front",x:50,y:11,status:"active",date:"2026-05-29",
      consultations:[{id:6,date:"2026-05-29",time:"10:30",doc:"Dr. Admin",reason:"Céphalées intermittentes",diag:"Migraine probable",notes:"Repos et hydratation. Scanner si aggravation.",status:"Actif"}],
      notes:[{date:"2026-05-29",title:"Déclencheurs possibles",text:"Fatigue et manque de sommeil rapportés.",doc:"Dr. Admin"}],
      prescriptions:[{date:"2026-05-29",drug:"Paracétamol",dose:"500 mg",freq:"3×/jour si douleur",duration:"3 jours"}],
      labs:[],imaging:[],documents:[]}],
  5:[{id:501,pid:5,label:"Système hématologique",region:"chest",view:"front",x:50,y:37,status:"active",date:"2026-06-09",
      consultations:[{id:7,date:"2026-06-09",time:"08:00",doc:"Dr. Ilunga",reason:"Fièvre chez patient drépanocytaire",diag:"Crise vaso-occlusive à surveiller",notes:"Hydratation, antalgie, bilan infectieux.",status:"Actif"}],
      notes:[{date:"2026-06-09",title:"Alerte pédiatrique",text:"Surveiller température et douleur toutes les 4h.",doc:"Dr. Ilunga"}],
      prescriptions:[{date:"2026-06-09",drug:"Paracétamol",dose:"Selon poids",freq:"Toutes les 6h",duration:"48h"}],
      labs:[{date:"2026-06-09",title:"NFS + CRP",value:"En attente",status:"En attente"}],
      imaging:[],documents:[]}],
  6:[{id:601,pid:6,label:"Tête",region:"head",view:"front",x:50,y:11,status:"inactive",date:"2026-03-14",
      consultations:[{id:8,date:"2026-03-14",time:"11:00",doc:"Dr. Admin",reason:"Migraine chronique",diag:"Migraine connue",notes:"Traitement de crise renouvelé.",status:"Chronique"}],
      notes:[{date:"2026-03-14",title:"Historique migraine",text:"Crises 2 à 3 fois par mois.",doc:"Dr. Admin"}],
      prescriptions:[{date:"2026-03-14",drug:"Ibuprofène",dose:"400 mg",freq:"Si crise",duration:"Selon besoin"}],
      labs:[],imaging:[],documents:[]}]
};

/* ── UTILS ── */
const $ = id => document.getElementById(id);
function age(dob){const d=new Date(dob),n=new Date();let a=n.getFullYear()-d.getFullYear();const m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))a--;return a}
function gl(g){return g==="male"?"Homme":g==="female"?"Femme":"Autre"}
function sl(s){return{active:"Actif",hospitalized:"Hospitalisé",inactive:"Inactif",deceased:"Décédé",transferred:"Transféré"}[s]||s}
function ini(p){return`${p.first_name?.[0]||""}${p.last_name?.[0]||""}`.toUpperCase()}
function fn(p){return`${p.last_name} ${p.middle_name||""} ${p.first_name}`.replace(/\s+/g," ").trim()}
function crit(p){return!/aucune/i.test(p.allergy||"")&&(p.allergy||"").trim().length>0}
function sex(p){return p?.gender==="female"?"F":"H"}
function imgPath(v){return`${BODY_BASE}/${sex(wsP)}/${BODY_FILES[v]}`}
function pts(){return(BPD[wsP?.id]||[]).filter(p=>p.view===wsV)}
function apt(){return(BPD[wsP?.id]||[]).find(p=>p.id===wsAid)||null}
function td(){return new Date().toISOString().slice(0,10)}
function tnow(){return new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}

/* ══════════════════════════════════
   TABLE
══════════════════════════════════ */
const searchInput = $("searchInput");
const statusFilter= $("statusFilter");
const bloodFilter = $("bloodFilter");
const backdrop    = $("backdrop");
const drawer      = $("drawer");

function filtered(){
  const q=searchInput.value.trim().toLowerCase();
  return patients.filter(p=>{
    const h=[p.code,fn(p),p.phone,p.email||"",p.city,p.blood,p.allergy].join(" ").toLowerCase();
    return(!q||h.includes(q))&&(!statusFilter.value||p.status===statusFilter.value)&&(!bloodFilter.value||p.blood===bloodFilter.value);
  });
}
function renderKpis(){
  $("totalPatients").textContent=patients.length;
  $("activeRecords").textContent=patients.filter(p=>p.status==="active").length;
  $("hospitalizedCount").textContent=patients.filter(p=>p.status==="hospitalized").length;
  $("alertCount").textContent=patients.filter(crit).length;
}
function renderTable(){
  const data=filtered();
  $("tableMeta").textContent=`${data.length} patient${data.length>1?"s":""}`;
  if(!data.length){
    $("tableArea").innerHTML=`<div class="empty"><div><h2>Aucun résultat</h2><p>Aucun patient ne correspond à vos critères de recherche.</p></div></div>`;
    return;
  }
  $("tableArea").innerHTML=`<table class="patients-table"><thead><tr>
    <th>Patient</th><th>Code</th><th>Sexe / Âge</th><th>Contact</th>
    <th>Groupe</th><th>Ville</th><th>Alerte</th><th>Statut</th><th>Dernière visite</th><th></th>
  </tr></thead><tbody>
  ${data.map(p=>`<tr class="patient-row" onclick="openWS(${p.id})">
    <td><div class="patient-main"><div class="avatar">${ini(p)}</div><div><span class="pname">${fn(p)}</span><span class="psub">${p.occupation||"Profession non renseignée"}</span></div></div></td>
    <td><strong>${p.code}</strong></td>
    <td>${gl(p.gender)} · ${age(p.dob)} ans</td>
    <td><span class="pname">${p.phone}</span><span class="psub">${p.email||"Email non renseigné"}</span></td>
    <td><strong>${p.blood||"—"}</strong></td>
    <td>${p.city}</td>
    <td>${crit(p)?`<span class="status alert">⚠ Allergie</span>`:`<span class="status">RAS</span>`}</td>
    <td><span class="status ${p.status}">${sl(p.status)}</span></td>
    <td>${p.last_visit}</td>
    <td><div class="row-actions">
      <button class="icon-btn" title="Ouvrir dossier" onclick="event.stopPropagation();openWS(${p.id})">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>
      </button>
      <button class="icon-btn" title="Modifier" onclick="event.stopPropagation();openDrawer()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.5 3l3.5 3.5L5.5 14H2v-3.5L9.5 3z"/></svg>
      </button>
    </div></td>
  </tr>`).join("")}
  </tbody></table>`;
}

function openDrawer(){drawer.classList.add("open");backdrop.classList.add("open")}
function closeDrawer(){drawer.classList.remove("open");backdrop.classList.remove("open")}
$("openCreate").addEventListener("click",openDrawer);
$("openCreate2")?.addEventListener("click",openDrawer);
$("closeDrawer").addEventListener("click",closeDrawer);
$("cancelBtn").addEventListener("click",closeDrawer);
backdrop.addEventListener("click",closeDrawer);
[searchInput,statusFilter,bloodFilter].forEach(el=>el.addEventListener("input",renderTable));
$("resetFilters").addEventListener("click",()=>{searchInput.value="";statusFilter.value="";bloodFilter.value="";renderTable();searchInput.focus()});
document.querySelectorAll("#formTabs .tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("#formTabs .tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".form-step").forEach(s=>s.classList.remove("active"));
    btn.classList.add("active");
    document.querySelector(`[data-step-panel="${btn.dataset.step}"]`).classList.add("active");
  });
});
$("patientForm").addEventListener("submit",e=>{e.preventDefault();toast("Formulaire prêt pour POST /api/patients.");closeDrawer()});

/* ══════════════════════════════════
   WORKSPACE STATE
══════════════════════════════════ */
let wsP   = null;  // current patient
let wsV   = "front"; // body view
let wsAid = null;  // active point id
let wsTab = "overview";
let wsFType = "consultation";
let wsPendXY= null;

/* ── ZOOM STATE ── */
let wsZoom = 1.0;
const ZOOM_MIN = 0.7, ZOOM_MAX = 4.0, ZOOM_STEP = 0.2;

/* setZoom, zoomIn, zoomOut, zoomReset defined below with pan support */

/* ── CONTEXT MENU STATE ── */
let ctxPointId = null;

function showCtxMenu(e, ptId){
  e.preventDefault();
  e.stopPropagation();
  ctxPointId = ptId;
  const menu = $("wsCtxMenu");
  if(!menu) return;
  // position near cursor
  const x = Math.min(e.clientX, window.innerWidth - 200);
  const y = Math.min(e.clientY, window.innerHeight - 160);
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.classList.add('open');
  // close on outside click
  setTimeout(()=>document.addEventListener('click', closeCtxMenuOnce, {once:true}), 10);
}
function closeCtxMenu(){
  const menu = $("wsCtxMenu");
  if(menu) menu.classList.remove('open');
  ctxPointId = null;
}
function closeCtxMenuOnce(){ closeCtxMenu(); }

function ctxRename(){
  closeCtxMenu();
  const pt = (BPD[wsP?.id]||[]).find(p=>p.id===ctxPointId);
  if(!pt) return;
  // Use the rename panel (same style as create-point popup)
  const panel = $("wsRenamePanel");
  if(!panel) return;
  $("rpInput").value = pt.label;
  $("rpSub").textContent = `Renommer le point clinique "${pt.label}"`;
  window._renamePtId = pt.id;
  panel.classList.add("open");
  setTimeout(()=>$("rpInput").focus(), 340);
}

function confirmRename(){
  const pt = (BPD[wsP?.id]||[]).find(p=>p.id===window._renamePtId);
  if(!pt) return;
  const newName = $("rpInput").value.trim();
  if(!newName){ toast("Le nom ne peut pas être vide."); return; }
  pt.label  = newName;
  pt.region = newName.toLowerCase().replace(/\s+/g,'_');
  closeRenamePanel();
  renderPts(); renderWS();
  toast(`Point renommé : "${newName}"`);
}

function closeRenamePanel(){
  $("wsRenamePanel")?.classList.remove("open");
  window._renamePtId = null;
}

function ctxDelete(){
  closeCtxMenu();
  const pt = (BPD[wsP?.id]||[]).find(p=>p.id===ctxPointId);
  if(!pt) return;
  // show confirm dialog
  const overlay = $("wsConfirmOverlay");
  $("confirmTitle").textContent  = `Supprimer "${pt.label}" ?`;
  $("confirmText").textContent   = `Ce point contient ${pt.consultations.length} consultation(s), ${pt.prescriptions.length} prescription(s) et ${pt.labs.length+pt.imaging.length} examen(s). Toutes ces données seront définitivement supprimées.`;
  overlay.classList.add('open');
  // buttons wired in HTML via onclick
  window._confirmDeleteId = pt.id;
}

function confirmDelete(){
  const id = window._confirmDeleteId;
  if(!id || !wsP) return;
  BPD[wsP.id] = (BPD[wsP.id]||[]).filter(p=>p.id!==id);
  if(wsAid===id){ wsAid=null; wsTab='overview'; }
  closeConfirm();
  renderPts(); renderWS();
  toast('Point clinique supprimé.');
}
function closeConfirm(){
  $("wsConfirmOverlay")?.classList.remove('open');
  window._confirmDeleteId = null;
}

/* ── ACTIVE CONSULTATION (for right panel update) ── */
let wsActiveConsultId = null;

function selectConsultation(consultId, ptId){
  wsActiveConsultId = consultId;
  const allPts = BPD[wsP?.id]||[];
  let foundConsult = null;
  for(const pt of allPts){
    const c = (pt.consultations||[]).find(c=>c.id===consultId);
    if(c){ foundConsult = c; break; }
  }
  if(!foundConsult) return;

  // Highlight selected card
  document.querySelectorAll('.ws-card[data-ev]').forEach(el=>{
    el.classList.toggle('selected', parseInt(el.dataset.cid||0)===consultId);
  });

  // Update right panel with THIS consultation's data
  const pt = allPts.find(p=>p.id===ptId)||apt();
  if(!pt) return;
  updateSumForConsult(pt, foundConsult);
}

function updateSumForConsult(pt, c){
  // find prescriptions/labs/imaging for this consultation's date (simplified: show all from point, highlight date match)
  const rxSameDate = (pt.prescriptions||[]).filter(r=>r.date===c.date);
  const lbSameDate = (pt.labs||[]).filter(l=>l.date===c.date);
  const imSameDate = (pt.imaging||[]).filter(i=>i.date===c.date);

  $("sumGrid").innerHTML=`
    <div class="ws-sum-card ws-sum-dark">
      <strong>Consultation sélectionnée</strong>
      <span>${c.date}${c.time?' · '+c.time:''}<br>${c.doc}</span>
    </div>
    <div class="ws-sum-card">
      <strong>Motif de la visite</strong>
      <span>${c.reason}</span>
    </div>
    <div class="ws-sum-card">
      <strong>Diagnostic</strong>
      <span>${c.diag}</span>
    </div>
    <div class="ws-sum-card">
      <strong>Statut</strong>
      <span>${c.status}</span>
    </div>
    <div class="ws-sum-card">
      <strong>Notes cliniques</strong>
      <span>${c.notes||'—'}</span>
    </div>
    ${rxSameDate.length?`
    <div class="ws-sum-card">
      <strong>Prescriptions ce jour</strong>
      <span>${rxSameDate.map(r=>r.drug+' · '+r.dose).join('<br>')}</span>
    </div>`:''}
    ${lbSameDate.length?`
    <div class="ws-sum-card">
      <strong>Labo ce jour</strong>
      <span>${lbSameDate.map(l=>l.title+' · '+l.value).join('<br>')}</span>
    </div>`:''}
    ${imSameDate.length?`
    <div class="ws-sum-card">
      <strong>Imagerie ce jour</strong>
      <span>${imSameDate.map(i=>i.title+' · '+i.status).join('<br>')}</span>
    </div>`:''}
    <div class="ws-sum-card ${isCritical(wsP)?'ws-sum-alert':''}">
      <strong>Allergies patient</strong>
      <span>${wsP.allergy}</span>
    </div>`;
}

function isCritical(p){ return !/aucune/i.test(p.allergy||"") && (p.allergy||"").trim().length>0; }

/* ══════════════════════════════════
   PAN — drag to move the skeleton
══════════════════════════════════ */
let wsPanMode   = false;
let wsPanning   = false;
// Pan stored per view — so rotating the body keeps position coherent
const wsPanStore= { front:{x:0,y:0}, back:{x:0,y:0}, left:{x:0,y:0}, right:{x:0,y:0} };
let wsPanX      = 0;  // mirrors wsPanStore[wsV].x for convenience
let wsPanY      = 0;  // mirrors wsPanStore[wsV].y for convenience
let wsPanStartX = 0;
let wsPanStartY = 0;
let wsPanOriginX= 0;
let wsPanOriginY= 0;

function applyTransform(){
  const stage = $("bodyStage");
  if(!stage) return;
  // Always read from per-view store
  const px = wsPanStore[wsV]?.x || 0;
  const py = wsPanStore[wsV]?.y || 0;
  stage.style.transform       = `scale(${wsZoom}) translate(${px/wsZoom}px,${py/wsZoom}px)`;
  stage.style.transformOrigin = 'top center';
  const lbl = $("zoomLevel");
  if(lbl) lbl.textContent = Math.round(wsZoom*100)+'%';
  counterScaleDots();
}

function counterScaleDots(){
  const inv = 1 / wsZoom;
  document.querySelectorAll('.ws-pt').forEach(dot=>{
    dot.style.transform = `translate(-50%,-50%) scale(${inv})`;
    const tip = dot.querySelector('.ws-pt-label');
    if(tip){
      tip.style.transform = `translateY(-50%) scale(${wsZoom})`;
      tip.style.transformOrigin = 'left center';
      tip.style.fontSize = '9px';
      tip.style.whiteSpace = 'nowrap';
      tip.style.maxWidth = '120px';
      tip.style.overflow = 'hidden';
      tip.style.textOverflow = 'ellipsis';
    }
  });
}

function setZoom(z){
  wsZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  applyTransform();
}
function zoomIn(){ setZoom(wsZoom+ZOOM_STEP); }
function zoomOut(){ setZoom(wsZoom-ZOOM_STEP); }
function zoomReset(){
  wsZoom=1.0;
  // Reset pan for ALL views
  ['front','back','left','right'].forEach(v=>{ wsPanStore[v].x=0; wsPanStore[v].y=0; });
  wsPanX=0; wsPanY=0;
  wsPanMode=false;
  applyTransform();
  const w=$('bodyZoomWrap'); if(w) w.style.cursor='crosshair';
  const pb=$('panBtn'); if(pb) pb.style.cssText='font-size:11px;width:28px;border-radius:8px';
}

function togglePanMode(){
  wsPanMode=!wsPanMode;
  const btn  = $("panBtn");
  const wrap = $("bodyZoomWrap");
  if(!btn||!wrap) return;
  if(wsPanMode){
    btn.style.cssText='background:var(--accent);color:var(--ink);border-color:transparent;width:28px;border-radius:8px;font-size:11px';
    wrap.style.cursor='grab';
  } else {
    btn.style.cssText='font-size:11px;width:28px;border-radius:8px';
    wrap.style.cursor='crosshair';
  }
}

function initPanEvents(){
  const wrap = $("bodyZoomWrap");
  if(!wrap) return;
  // Mouse
  wrap.addEventListener("mousedown",e=>{
    if(!wsPanMode)return;
    wsPanning=true;
    wsPanStartX=e.clientX; wsPanStartY=e.clientY;
    // Origin = current stored position for this view
    wsPanOriginX = wsPanStore[wsV]?.x || 0;
    wsPanOriginY = wsPanStore[wsV]?.y || 0;
    wrap.style.cursor='grabbing';
    e.preventDefault();
  });
  window.addEventListener("mousemove",e=>{
    if(!wsPanning)return;
    const nx=wsPanOriginX+(e.clientX-wsPanStartX);
    const ny=wsPanOriginY+(e.clientY-wsPanStartY);
    wsPanX=nx; wsPanY=ny;
    // Save position for current view
    if(wsPanStore[wsV]){ wsPanStore[wsV].x=nx; wsPanStore[wsV].y=ny; }
    applyTransform();
  });
  window.addEventListener("mouseup",()=>{
    if(!wsPanning)return;
    wsPanning=false;
    if(wsPanMode&&$("bodyZoomWrap"))$("bodyZoomWrap").style.cursor='grab';
  });
  // Touch
  wrap.addEventListener("touchstart",e=>{
    if(!wsPanMode)return;
    const t=e.touches[0];
    wsPanning=true;
    wsPanStartX=t.clientX; wsPanStartY=t.clientY;
    wsPanOriginX = wsPanStore[wsV]?.x || 0;
    wsPanOriginY = wsPanStore[wsV]?.y || 0;
  },{passive:true});
  wrap.addEventListener("touchmove",e=>{
    if(!wsPanning)return;
    const t=e.touches[0];
    const nx=wsPanOriginX+(t.clientX-wsPanStartX);
    const ny=wsPanOriginY+(t.clientY-wsPanStartY);
    wsPanX=nx; wsPanY=ny;
    if(wsPanStore[wsV]){ wsPanStore[wsV].x=nx; wsPanStore[wsV].y=ny; }
    applyTransform(); e.preventDefault();
  },{passive:false});
  wrap.addEventListener("touchend",()=>{wsPanning=false;});
}




/* ── OPEN ── */
function openWS(id){
  wsP   = patients.find(p=>p.id===id);
  if(!wsP) return;
  wsV   = "front";
  wsAid = null;
  wsTab = "overview";
  buildDOM();
  const modal = $("wsModal");
  modal.style.display = "flex";
  // force reflow then add class for animation
  void modal.offsetWidth;
  modal.classList.add("ws-open");
  document.body.style.overflow = "hidden";
  // auto-select first point
  const first = pts()[0];
  if(first) wsAid = first.id;
  renderPts();renderWS();
}

function closeWS(){
  const modal = $("wsModal");
  modal.classList.remove("ws-open");
  setTimeout(()=>{
    modal.style.display = "none";
    document.body.style.overflow = "";
  }, 400);
}

/* ── BUILD DOM ── */
function buildDOM(){
  const p=wsP, a=age(p.dob), c=crit(p);
  $("wsModal").innerHTML=`
  <div class="ws-sheet">

    <div class="ws-header">

      <!-- ROW 1: identity + status + actions -->
      <div class="ws-header-row1">
        <button class="ws-close-btn" onclick="closeWS()">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
        </button>
        <div class="ws-av">${ini(p)}</div>
        <div class="ws-info">
          <div class="ws-name">${fn(p)}</div>
          <div class="ws-meta">
            <span>${p.code}</span>
            <span>${gl(p.gender)} · ${a} ans</span>
            <span>${p.blood||"—"}</span>
          </div>
        </div>
        <div class="ws-pills">
          <span class="ws-pill ${p.status}">${sl(p.status)}</span>
          ${c?`<span class="ws-pill alert">⚠ ${p.allergy}</span>`:`<span class="ws-pill ok">Pas d'allergie critique</span>`}
          <span class="ws-pill neutral">Dernière visite : ${p.last_visit}</span>
        </div>
        <div class="ws-head-spacer"></div>
        <div class="ws-head-actions">
          <button class="ws-btn ws-btn-primary" onclick="openForm('consultation')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg>
            Nouvelle consultation
          </button>
          <button class="ws-btn ws-btn-soft" onclick="openForm('note')">Note <span class="ws-btn-dot">+</span></button>
          <button class="ws-btn ws-btn-soft" onclick="openForm('imaging')">Imagerie <span class="ws-btn-dot">+</span></button>
          <button class="ws-btn ws-btn-soft" onclick="openForm('document')">Document <span class="ws-btn-dot">+</span></button>
        </div>
      </div>

    </div>

    <div class="ws-body">
      <aside class="ws-left">
        <div class="ws-left-title">Carte anatomique</div>
        <div class="ws-zoom-bar">
          <button class="ws-zoom-btn" onclick="zoomOut()" title="Zoom arrière">−</button>
          <span class="ws-zoom-level" id="zoomLevel">100%</span>
          <button class="ws-zoom-btn" onclick="zoomIn()" title="Zoom avant">+</button>
          <button class="ws-zoom-btn" onclick="zoomReset()" title="Réinitialiser zoom" style="font-size:10px;width:28px;border-radius:8px">↺</button>
          <button class="ws-zoom-btn" id="panBtn" onclick="togglePanMode()" title="Déplacer le corps (maintenez et glissez)" style="font-size:11px;width:28px;border-radius:8px">✥</button>
        </div>
        <div class="ws-body-zoom-wrap" id="bodyZoomWrap">
          <div class="ws-body-stage" id="bodyStage">
            <div class="ws-body-bg"></div>
            <img class="ws-body-img" id="bodyImg" src="${imgPath("front")}" alt="">
            <div id="bpLayer"></div>
          </div>
        </div>
        <div class="ws-view-nav">
          <button class="ws-view-btn active" data-v="front">Avant</button>
          <button class="ws-view-btn" data-v="back">Arrière</button>
          <button class="ws-view-btn" data-v="left">Gauche</button>
          <button class="ws-view-btn" data-v="right">Droite</button>
        </div>
        <div class="ws-body-hint">Cliquez sur le corps pour créer un point clinique ou sélectionner un existant.</div>
        <div class="ws-diag-list" id="diagList"><div class="ws-diag-empty">Sélectionnez une zone anatomique</div></div>
      </aside>

      <main class="ws-center">
        <!-- TABS BAR — above the timeline content -->
        <div class="ws-tabs-bar">
          ${["overview","notes","labs","imaging","documents"].map(t=>
            `<button class="ws-tab ${wsTab===t?"active":""}" data-tab="${t}" onclick="setTab('${t}')">${{overview:"Résumé",notes:"Notes",labs:"Labo",imaging:"Imagerie",documents:"Documents"}[t]}</button>`
          ).join("")}
        </div>
        <div class="ws-timeline" id="tlArea">
          <svg class="ws-lines-svg" id="linesSvg"></svg>
          <div class="ws-cards" id="cardsLayer"></div>
        </div>
      </main>

      <aside class="ws-right">
        <div class="ws-right-title">Résumé clinique contextuel</div>
        <div id="sumGrid"></div>
      </aside>
    </div>

    <div class="ws-bottom">
      <div class="ws-bot-card"><div class="ws-bot-head"><span class="ws-bot-title">Médications</span><button class="ws-bot-add" onclick="openForm('prescription')">+</button></div><div class="ws-bot-list" id="medList"></div></div>
      <div class="ws-bot-card"><div class="ws-bot-head"><span class="ws-bot-title">Visites</span><button class="ws-bot-add" onclick="openForm('consultation')">+</button></div><div class="ws-bot-list" id="visitList"></div></div>
      <div class="ws-bot-card"><div class="ws-bot-head"><span class="ws-bot-title">Labs</span><button class="ws-bot-add" onclick="openForm('lab')">+</button></div><div class="ws-bot-list" id="labList"></div></div>
      <div class="ws-bot-card"><div class="ws-bot-head"><span class="ws-bot-title">Imagerie</span><button class="ws-bot-add" onclick="openForm('imaging')">+</button></div><div class="ws-bot-list" id="imgList"></div></div>
      <div class="ws-bot-card"><div class="ws-bot-head"><span class="ws-bot-title">Documents</span><button class="ws-bot-add" onclick="openForm('document')">+</button></div><div class="ws-bot-list" id="docList"></div></div>
    </div>

    <!-- CREATE POINT POPUP — from LEFT -->
    <div class="ws-create-popup" id="cpPopup">
      <div class="ws-cp-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8" stroke-linecap="round"/></svg>
      </div>
      <div class="ws-cp-title">Nouveau point clinique</div>
      <div class="ws-cp-sub" id="cpSub">Nommez cette zone anatomique pour commencer le suivi médical de ce secteur du corps.</div>
      <label class="ws-cp-label">Nom de la zone anatomique</label>
      <input class="ws-cp-input" id="cpInput" placeholder="Ex : Genou gauche, Thorax, Épaule droite...">
      <div class="ws-cp-actions">
        <button class="btn btn-primary" onclick="confirmPt()">Créer le point</button>
        <button class="btn btn-soft" onclick="cancelPt()">Annuler</button>
      </div>
    </div>

    <!-- RENAME PANEL — from LEFT (same style as create popup) -->
    <div class="ws-create-popup" id="wsRenamePanel">
      <div class="ws-cp-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
      <div class="ws-cp-title">Renommer le point</div>
      <div class="ws-cp-sub" id="rpSub">Donnez un nouveau nom à ce point clinique.</div>
      <label class="ws-cp-label" for="rpInput">Nouveau nom</label>
      <input class="ws-cp-input" id="rpInput" placeholder="Ex : Genou gauche, Épaule droite...">
      <div class="ws-cp-actions">
        <button class="btn btn-primary" onclick="confirmRename()">Renommer</button>
        <button class="btn btn-soft" onclick="closeRenamePanel()">Annuler</button>
      </div>
    </div>

    <!-- CLINICAL FORM — from RIGHT -->
    <div class="ws-form-panel" id="formPanel">
      <div class="ws-fp-head">
        <div><div class="ws-fp-title" id="fpTitle">Nouvelle consultation</div><div class="ws-fp-sub" id="fpSub"></div></div>
        <button class="ws-close-btn" onclick="closeForm()">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
        </button>
      </div>
      <div class="ws-fp-body" id="fpBody"></div>
      <div class="ws-fp-foot">
        <button class="btn btn-soft" onclick="closeForm()">Annuler</button>
        <button class="btn btn-primary" onclick="saveItem()">Enregistrer</button>
      </div>
    </div>

    <div class="ws-toast" id="wsToast"></div>

    <!-- CONTEXT MENU -->
    <div class="ws-ctx-menu" id="wsCtxMenu">
      <div class="ws-ctx-item" onclick="ctxRename()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.5 2.5l3 3L5 14H2v-3L10.5 2.5z"/></svg>
        Renommer ce point
      </div>
      <div class="ws-ctx-sep"></div>
      <div class="ws-ctx-item danger" onclick="ctxDelete()">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5h10M6 5V3h4v2M13 5l-1 9H4L3 5"/></svg>
        Supprimer ce point
      </div>
    </div>

    <!-- CONFIRM DELETE DIALOG -->
    <div class="ws-confirm-overlay" id="wsConfirmOverlay">
      <div class="ws-confirm-box">
        <div class="ws-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5" stroke-linecap="round"/></svg>
        </div>
        <div class="ws-confirm-title" id="confirmTitle">Supprimer ce point ?</div>
        <div class="ws-confirm-text" id="confirmText">Cette action est irréversible.</div>
        <div class="ws-confirm-actions">
          <button class="btn btn-soft" onclick="closeConfirm()">Annuler</button>
          <button class="btn btn-primary" style="background:var(--red)" onclick="confirmDelete()">Supprimer définitivement</button>
        </div>
      </div>
    </div>

  </div>`;

  $("bodyStage").addEventListener("click", e=>{
    if(wsPanMode) return; // don't create points in pan mode
    bodyClick(e);
  });
  // Wheel zoom on the zoom wrap
  const zoomWrap = $("bodyZoomWrap");
  if(zoomWrap){
    zoomWrap.addEventListener("wheel", e=>{
      e.preventDefault();
      if(e.deltaY < 0) zoomIn(); else zoomOut();
    }, {passive:false});
  }
  // Init pan events
  initPanEvents();
  // reset zoom & pan fully for new patient
  wsZoom=1.0;
  ['front','back','left','right'].forEach(v=>{ wsPanStore[v].x=0; wsPanStore[v].y=0; });
  wsPanX=0; wsPanY=0; wsPanMode=false;
  document.querySelectorAll(".ws-view-btn").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.v)));
  window.addEventListener("resize", drawLines);
}

/* ── TOAST ── */
function toast(msg){
  const t=$("wsToast"); if(!t)return;
  t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2400);
}
function need(label){
  if(wsAid)return true;
  toast(`Sélectionnez d'abord un point anatomique avant ${label}.`);
  return false;
}

/* ── TABS ── */
function setTab(tab){
  if(!need(`d'ouvrir l'onglet`))return;
  wsTab=tab;
  const labels={overview:"Résumé",notes:"Notes",labs:"Labo",imaging:"Imagerie",documents:"Documents"};
  document.querySelectorAll(".ws-tab").forEach(t=>{
    const match = t.dataset.tab ? t.dataset.tab===tab : t.textContent.trim()===labels[tab];
    t.classList.toggle("active", match);
  });
  renderWS();
}

/* ── SWITCH VIEW ── */
function switchView(v){
  wsV=v; wsAid=null;
  // Load the stored position for this view — feels like rotating the same body
  wsPanX = wsPanStore[v]?.x || 0;
  wsPanY = wsPanStore[v]?.y || 0;
  // Zoom is preserved across all views (same body, same zoom level)
  applyTransform();
  const wrap=$("bodyZoomWrap");
  if(wrap) wrap.style.cursor = wsPanMode ? 'grab' : 'crosshair';
  document.querySelectorAll(".ws-view-btn").forEach(b=>b.classList.toggle("active",b.dataset.v===v));
  $("bodyImg").src=imgPath(v);
  renderPts(); renderWS();
}

/* ── BODY CLICK ── */
function bodyClick(e){
  if(e.target.closest(".ws-pt"))return;
  if(!wsP)return;
  const s=$("bodyStage"),r=s.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width*100;
  const y=(e.clientY-r.top)/r.height*100;
  if(!onBody(x,y,wsV)){toast("Cliquez directement sur le corps humain.");return;}
  wsPendXY={x:parseFloat(x.toFixed(1)),y:parseFloat(y.toFixed(1))};
  $("cpSub").textContent=`Position sur la carte : ${Math.round(x)}% / ${Math.round(y)}% — Vue : ${wsV}`;
  $("cpInput").value="";
  $("cpPopup").classList.add("open");
  setTimeout(()=>$("cpInput").focus(),350);
}
function confirmPt(){
  const label=$("cpInput").value.trim()||"Zone clinique";
  if(!BPD[wsP.id])BPD[wsP.id]=[];
  const pt={id:Date.now(),pid:wsP.id,label,region:label.toLowerCase().replace(/\s+/g,"_"),
    view:wsV,x:wsPendXY.x,y:wsPendXY.y,status:"active",date:td(),
    consultations:[],notes:[],prescriptions:[],labs:[],imaging:[],documents:[]};
  BPD[wsP.id].push(pt);
  wsAid=pt.id;
  cancelPt();
  renderPts();renderWS();
  toast(`Point "${label}" créé. Ajoutez une consultation pour commencer le suivi.`);
}
function cancelPt(){$("cpPopup").classList.remove("open");wsPendXY=null;}

/* ── RENDER POINTS ── */
function renderPts(){
  const layer=$("bpLayer"); if(!layer)return;
  layer.innerHTML="";
  pts().forEach(pt=>{
    const btn=document.createElement("button");
    btn.className="ws-pt"+(pt.id===wsAid?" active":"");
    btn.style.left=pt.x+"%"; btn.style.top=pt.y+"%";
    btn.title=pt.label;
    btn.innerHTML=`<span class="ws-pt-label">${pt.label}</span>`;
    btn.addEventListener("click",e=>{
      e.stopPropagation();
      wsAid=pt.id; wsTab="overview";
      wsActiveConsultId=null;
      document.querySelectorAll(".ws-tab").forEach(t=>t.classList.toggle("active",t.textContent==="Résumé"));
      renderPts(); renderWS();
    });
    btn.addEventListener("contextmenu",e=>{
      e.stopPropagation();
      wsAid=pt.id;
      renderPts();
      showCtxMenu(e, pt.id);
    });
    layer.appendChild(btn);
  });
  // Apply current zoom counter-scale to new dots
  counterScaleDots();
}

/* ── RENDER WORKSPACE ── */
function renderWS(){
  const p=apt();
  if(!p){noPoint();return;}
  activeTab(p); renderSum(p); renderBot(p);
  setTimeout(drawLines,80);
  const dl=$("diagList");
  if(dl) dl.innerHTML=p.consultations.length
    ?p.consultations.map(c=>`<div class="ws-diag-item"><div class="ws-diag-dot"></div><div><div class="ws-diag-name">${c.diag}</div><div class="ws-diag-date">${c.date} · ${c.doc}</div></div></div>`).join("")
    :"<div class='ws-diag-empty'>Aucun diagnostic pour ce point</div>";
}

function noPoint(){ wsActiveConsultId=null;
  $("cardsLayer").innerHTML=`
    <div class="ws-card ws-card-accent" style="left:50%;top:160px;transform:translateX(-50%);text-align:center;min-width:280px">
      <div class="ws-card-type">Carte anatomique</div>
      <div class="ws-card-title">Aucun point sélectionné</div>
      <div class="ws-card-text">Cliquez sur une zone du corps humain pour créer un point clinique. Chaque point représente une zone médicale suivie.</div>
    </div>`;
  $("linesSvg").innerHTML="";
  $("sumGrid").innerHTML=`<div class="ws-sum-card ws-sum-dark"><strong>Aucun point actif</strong><span>Le résumé se remplit après sélection d'un point anatomique.</span></div>`;
  emptyBot();
  const dl=$("diagList"); if(dl) dl.innerHTML="<div class='ws-diag-empty'>Sélectionnez une zone anatomique</div>";
}

function activeTab(p){
  if(wsTab==="overview")   overview(p);
  else if(wsTab==="notes") listTab(p.notes||[],"Notes médicales","Aucune note liée à ce point.");
  else if(wsTab==="labs")  listTab(p.labs||[],"Résultats laboratoire","Aucun résultat labo.");
  else if(wsTab==="imaging")   listTab(p.imaging||[],"Imagerie médicale","Aucune imagerie.");
  else if(wsTab==="documents") listTab(p.documents||[],"Documents","Aucun document.");
}

function overview(p){
  const cs   = p.consultations||[];
  const imgs = p.imaging||[];
  const docs = p.documents||[];

  if(!cs.length && !imgs.length && !docs.length){
    $("cardsLayer").innerHTML=`
      <div class="ws-card ws-card-accent" style="left:50%;top:160px;transform:translateX(-50%);text-align:center">
        <div class="ws-card-type">Point clinique actif</div>
        <div class="ws-card-title">${p.label}</div>
        <div class="ws-card-text">Aucun élément. Cliquez sur "Nouvelle consultation" pour commencer.</div>
      </div>`;
    $("linesSvg").innerHTML=""; return;
  }

  let h=`<div class="ws-card ws-card-dark" data-main style="left:34%;top:36px">
    <div class="ws-card-type">Point actif · ${p.view}</div>
    <div class="ws-card-title">${p.label}</div>
    <div class="ws-card-text">${[
      cs.length ? cs.length+' consultation'+(cs.length>1?'s':'') : '',
      imgs.length ? imgs.length+' imagerie'+(imgs.length>1?'s':'') : '',
      docs.length ? docs.length+' document'+(docs.length>1?'s':'') : ''
    ].filter(Boolean).join(' · ')}</div>
    <div class="ws-card-date">Région : ${p.region}</div>
  </div>`;

  let idx = 0;

  // ── Consultations
  cs.forEach((c)=>{
    const left=idx%2===0?"7%":"52%", top=210+idx*175;
    const sc=c.status==="Résolu"?"ok":c.status==="En attente"?"wait":"act";
    h+=`<div class="ws-card" data-ev data-cid="${c.id}" data-ptid="${p.id}"
      style="left:${left};top:${top}px;width:41%;cursor:pointer"
      onclick="selectConsultation(${c.id},${p.id})">
      <div class="ws-card-type">Consultation · ${c.date}${c.time?" · "+c.time:""}</div>
      <div class="ws-card-title">${c.reason}</div>
      <div class="ws-card-diag">${c.diag}</div>
      <div class="ws-card-text">${c.notes}</div>
      <div class="ws-card-date">${c.doc} · <span class="ws-card-status ${sc}">${c.status}</span></div>
      <div style="font-size:9px;color:var(--accent);margin-top:5px;font-weight:700;opacity:.7">Cliquez pour le résumé →</div>
    </div>`;
    idx++;
  });

  // ── Imagerie
  imgs.forEach((img)=>{
    const left=idx%2===0?"7%":"52%", top=210+idx*175;
    const hasDataUrl = img.file && img.file._dataUrl;
    const hasFile    = img.file && img.file.name;
    const clickAttr  = hasDataUrl
      ? `onclick="openLightbox('${img.file._dataUrl}','${img.title}','${img.file.type}')" style="left:${left};top:${top}px;width:41%;cursor:zoom-in"`
      : `style="left:${left};top:${top}px;width:41%"`;
    h+=`<div class="ws-card ws-card-media" data-ev ${clickAttr}>
      <div class="ws-card-type">Imagerie · ${img.date||"—"}</div>
      <div class="ws-card-title">${img.title}</div>
      ${hasDataUrl
        ? `<div style="margin:6px 0;border-radius:8px;overflow:hidden;line-height:0">
             <img src="${img.file._dataUrl}" alt="${img.title}"
               style="width:100%;max-height:88px;object-fit:cover;border-radius:8px;cursor:zoom-in"
               onclick="event.stopPropagation();openLightbox('${img.file._dataUrl}','${img.title}','${img.file.type}')">
           </div>
           <div style="font-size:9px;color:var(--accent);font-weight:700;opacity:.8">🔍 Cliquer pour agrandir</div>`
        : hasFile
        ? `<div style="font-size:11px;color:var(--mid);margin:4px 0">📎 ${img.file.name}</div>`
        : ''
      }
      <div class="ws-card-date">${img.type} · <span class="ws-card-status ${img.status==='Normal'||img.status==='Disponible'?'ok':'wait'}">${img.status}</span></div>
      ${img.report?`<div class="ws-card-text" style="margin-top:4px">${img.report}</div>`:''}
    </div>`;
    idx++;
  });

  // ── Documents
  docs.forEach((doc)=>{
    const left=idx%2===0?"7%":"52%", top=210+idx*175;
    const isImg   = doc.file && doc.file._dataUrl && doc.file.type && doc.file.type.startsWith('image/');
    const hasFile = doc.file && doc.file.name;
    const clickAttr = hasFile
      ? `onclick="openLightbox('${isImg?doc.file._dataUrl:""}','${doc.title}','${doc.file?.type||""}')" style="left:${left};top:${top}px;width:41%;cursor:pointer"`
      : `style="left:${left};top:${top}px;width:41%"`;
    h+=`<div class="ws-card ws-card-doc" data-ev ${clickAttr}>
      <div class="ws-card-type">Document · ${doc.date||"—"}</div>
      <div class="ws-card-title">${doc.title}</div>
      ${isImg
        ? `<img src="${doc.file._dataUrl}" alt="${doc.title}"
             style="width:100%;max-height:80px;object-fit:cover;border-radius:8px;margin:5px 0;cursor:zoom-in"
             onclick="event.stopPropagation();openLightbox('${doc.file._dataUrl}','${doc.title}','${doc.file.type}')">`
        : hasFile
        ? `<div style="font-size:11px;color:var(--mid);margin:4px 0">📎 ${doc.file.name}</div>`
        : ''
      }
      <div class="ws-card-date">${doc.type} · <span class="ws-card-status ${doc.status==='Ajouté'?'ok':'wait'}">${doc.status}</span></div>
      ${doc.notes?`<div class="ws-card-text" style="margin-top:3px">${doc.notes}</div>`:''}
      ${hasFile?`<div style="font-size:9px;color:var(--accent);margin-top:5px;font-weight:700;opacity:.7">🔍 Aperçu disponible</div>`:''}
    </div>`;
    idx++;
  });

  $("cardsLayer").innerHTML=h;
}

/* ── LIGHTBOX for images ── */
function openLightbox(name, dataUrl, title){
  // Remove existing
  document.getElementById('wsLightbox')?.remove();
  const lb = document.createElement('div');
  lb.id='wsLightbox';
  lb.style.cssText=`position:absolute;inset:0;background:rgba(0,0,0,.88);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;cursor:zoom-out;backdrop-filter:blur(8px)`;
  lb.innerHTML=`
    <div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:-.2px">${title}</div>
    <img src="${dataUrl}" alt="${name}" style="max-width:88%;max-height:72vh;border-radius:14px;box-shadow:0 20px 80px rgba(0,0,0,.5);object-fit:contain">
    <div style="font-size:11px;color:rgba(255,255,255,.45)">${name} · Cliquez pour fermer</div>`;
  lb.addEventListener('click',()=>lb.remove());
  document.querySelector('.ws-sheet')?.appendChild(lb);
}

/* ── Document preview ── */
function openDocPreview(doc){
  if(!doc.file) return;
  if(doc.file.type?.startsWith('image/')){
    openLightbox(doc.file.name, doc._dataUrl||'', doc.title);
    return;
  }
  // For PDF/other — show info panel
  document.getElementById('wsLightbox')?.remove();
  const lb = document.createElement('div');
  lb.id='wsLightbox';
  lb.style.cssText=`position:absolute;inset:0;background:rgba(0,0,0,.7);z-index:90;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)`;
  lb.innerHTML=`
    <div style="background:#fff;border-radius:24px;padding:32px;max-width:360px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="font-size:48px;margin-bottom:12px">📄</div>
      <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:6px">${doc.title}</div>
      <div style="font-size:12px;color:#8B8D86;margin-bottom:16px">${doc.type} · ${doc.date} · ${doc.file.name}</div>
      <div style="font-size:11.5px;color:#8B8D86;line-height:1.6;margin-bottom:20px">${doc.notes||'Aucune description.'}</div>
      <button onclick="document.getElementById('wsLightbox').remove()" style="padding:9px 22px;border-radius:999px;background:#111;color:#fff;border:none;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer">Fermer</button>
    </div>`;
  lb.addEventListener('click',e=>{ if(e.target===lb)lb.remove(); });
  document.querySelector('.ws-sheet')?.appendChild(lb);
}

function listTab(items,title,empty){
  const h=items.length
    ?items.map(i=>`<div class="ws-card ws-card-inline">
        <div class="ws-card-type">${i.date||"—"} · ${i.type||i.status||""}</div>
        <div class="ws-card-title">${i.title||i.drug||i.reason||"Élément"}</div>
        <div class="ws-card-text">${i.text||i.report||i.value||i.dose||i.status||""}</div>
        <div class="ws-card-date">${i.doc||i.freq||i.duration||""}</div>
      </div>`).join("")
    :`<div class="ws-card ws-card-accent">
        <div class="ws-card-type">${title}</div>
        <div class="ws-card-title">${empty}</div>
        <div class="ws-card-text">Utilisez le bouton + en bas pour ajouter un élément.</div>
      </div>`;
  $("cardsLayer").innerHTML=`<div style="padding:4px;max-width:680px">${h}</div>`;
  $("linesSvg").innerHTML="";
}

function renderSum(p){
  const last=(p.consultations||[]).at(-1);
  const rx=(p.prescriptions||[]).at(-1);
  const lb=(p.labs||[]).at(-1);
  const im=(p.imaging||[]).at(-1);
  $("sumGrid").innerHTML=`
    <div class="ws-sum-card ws-sum-dark"><strong>${p.label}</strong><span>Zone : ${p.region}<br>Vue : ${p.view}</span></div>
    <div class="ws-sum-card"><strong>Diagnostic actuel</strong><span>${last?last.diag:"Non renseigné"}</span></div>
    <div class="ws-sum-card"><strong>Dernières constantes</strong><span>${wsP.vitals}</span></div>
    <div class="ws-sum-card"><strong>Dernière prescription</strong><span>${rx?`${rx.drug} · ${rx.dose}`:"Aucune"}</span></div>
    <div class="ws-sum-card"><strong>Dernier labo</strong><span>${lb?lb.title+" · "+lb.value:"Aucun"}</span></div>
    <div class="ws-sum-card"><strong>Dernière imagerie</strong><span>${im?im.title+" · "+im.status:"Aucune"}</span></div>
    <div class="ws-sum-card ${crit(wsP)?"ws-sum-alert":""}"><strong>Allergies</strong><span>${wsP.allergy}</span></div>
    <div class="ws-sum-card"><strong>Contact urgence</strong><span>${wsP.emergency}</span></div>`;
}

function chip(a,b,cls=""){return`<div class="ws-chip"><strong>${a}</strong><span class="${cls}">${b}</span></div>`}
function renderBot(p){
  $("medList").innerHTML  =(p.prescriptions||[]).map(m=>chip(m.drug,`${m.dose} · ${m.freq}`)).join("")||chip("—","Aucun médicament");
  $("visitList").innerHTML=(p.consultations||[]).map(c=>chip(c.date,c.reason.substring(0,34))).join("")||chip("—","Aucune visite");
  $("labList").innerHTML  =(p.labs||[]).map(l=>chip(l.title,`${l.value} · ${l.status}`,l.status==="Disponible"?"ok":"wait")).join("")||chip("—","Aucun labo");
  $("imgList").innerHTML  =(p.imaging||[]).map(i=>chip(i.title,`${i.type} · ${i.status}`)).join("")||chip("—","Aucune imagerie");
  const dl=$("docList");
  if(dl) dl.innerHTML=(p.documents||[]).map(d=>chip(d.title,`${d.type} · ${d.status}`)).join("")||chip("—","Aucun document");
}
function emptyBot(){["medList","visitList","labList","imgList"].forEach(id=>{const e=$(id);if(e)e.innerHTML=chip("—","Aucun élément")})}

/* ── BÉZIER LINES ── */
function drawLines(){
  const svg=$("linesSvg"), area=$("tlArea");
  const main=document.querySelector("[data-main]");
  if(!svg||!area)return;
  svg.innerHTML="";
  if(!main||wsTab!=="overview")return;
  const ar=area.getBoundingClientRect(), mr=main.getBoundingClientRect();
  const x1=mr.left-ar.left+mr.width/2, y1=mr.top-ar.top+mr.height;
  document.querySelectorAll("[data-ev]").forEach(el=>{
    const r=el.getBoundingClientRect();
    const x2=r.left-ar.left+r.width/2, y2=r.top-ar.top;
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`M${x1} ${y1} C${x1} ${y1+80}, ${x2} ${y2-80}, ${x2} ${y2}`);
    path.setAttribute("stroke","rgba(0,0,0,0.16)");
    path.setAttribute("stroke-width","1.5");
    path.setAttribute("stroke-dasharray","5 4");
    path.setAttribute("fill","none");
    svg.appendChild(path);
  });
}

/* ══════════════════════════════════
   RICH CLINICAL FORMS
══════════════════════════════════ */
const FORMS = {
  consultation:{
    title:"Nouvelle consultation",
    sections:[
      {t:"Informations générales", f:[
        {l:"Date",n:"date",type:"date",v:td},
        {l:"Heure",n:"time",type:"time",v:tnow},
        {l:"Médecin",n:"doc",type:"text",ph:"Dr. Nom Prénom"},
        {l:"Type de consultation",n:"ctype",type:"select",opts:["Première consultation","Consultation de suivi","Urgence","Téléconsultation","Consultation prénatale","Consultation pédiatrique","Consultation chirurgicale"]},
      ]},
      {t:"Motif et symptômes", f:[
        {l:"Motif de consultation *",n:"reason",type:"text",ph:"Raison principale de la visite",full:true},
        {l:"Symptômes décrits par le patient",n:"symptoms",type:"textarea",ph:"Douleur, fièvre, durée, caractéristiques...",full:true},
      ]},
      {t:"Examen clinique", f:[
        {l:"Observations cliniques",n:"observations",type:"textarea",ph:"Résultats de l'examen physique, auscultation, palpation, inspection...",full:true},
        {l:"Signes vitaux mesurés",n:"vitals_note",type:"text",ph:"TA 120/80 · FC 78 · T° 36.8 · SpO₂ 98% · Poids 70kg",full:true},
      ]},
      {t:"Diagnostic", f:[
        {l:"Diagnostic provisoire",n:"diag_prov",type:"text",ph:"Hypothèse diagnostique initiale"},
        {l:"Diagnostic final *",n:"diag",type:"text",ph:"Diagnostic confirmé"},
        {l:"Code CIM-10",n:"icd",type:"text",ph:"Ex : J45.9, I10, E11.9"},
        {l:"Statut",n:"status",type:"select",opts:["Actif","En attente","Confirmé","Résolu","Chronique","Sous surveillance"]},
      ]},
      {t:"Conclusion et plan", f:[
        {l:"Notes et observations",n:"notes",type:"textarea",ph:"Commentaires libres, évolution, plan de suivi...",full:true},
        {l:"Conduite à tenir",n:"plan",type:"textarea",ph:"Ordonnance, examens à prescrire, orientation, hospitalisation...",full:true},
      ]},
    ]
  },
  prescription:{
    title:"Nouvelle prescription",
    sections:[
      {t:"Médicament", f:[
        {l:"Nom du médicament *",n:"drug",type:"text",ph:"Nom DCI ou commercial"},
        {l:"Forme galénique",n:"form",type:"select",opts:["Comprimé","Gélule","Sirop","Injection IV","Injection IM","Nébulisation","Suppositoire","Crème / Gel","Gouttes","Patch","Autre"]},
        {l:"Dosage *",n:"dose",type:"text",ph:"Ex : 500 mg, 10 ml"},
        {l:"Voie d'administration",n:"route",type:"select",opts:["Orale","Intraveineuse (IV)","Intramusculaire (IM)","Sous-cutanée (SC)","Topique","Rectale","Inhalée","Sublinguale","Autre"]},
      ]},
      {t:"Posologie", f:[
        {l:"Fréquence *",n:"freq",type:"text",ph:"Ex : 3×/jour, toutes les 8h"},
        {l:"Durée *",n:"duration",type:"text",ph:"Ex : 7 jours, 1 mois, continu"},
        {l:"Moment de prise",n:"timing",type:"select",opts:["Avant les repas","Pendant les repas","Après les repas","Au coucher","Au réveil","À distance des repas","Au besoin (si douleur)","À heure fixe"]},
        {l:"Date de début",n:"date",type:"date",v:td},
      ]},
      {t:"Instructions et contre-indications", f:[
        {l:"Instructions spéciales",n:"instructions",type:"textarea",ph:"Prendre avec eau, éviter alcool, ne pas écraser le comprimé...",full:true},
        {l:"Interactions / contre-indications notées",n:"ci",type:"textarea",ph:"Allergie à surveiller, interactions médicamenteuses connues...",full:true},
      ]},
    ]
  },
  note:{
    title:"Note médicale",
    sections:[
      {t:"Note clinique", f:[
        {l:"Titre de la note *",n:"title",type:"text",ph:"Titre court descriptif",full:true},
        {l:"Date",n:"date",type:"date",v:td},
        {l:"Médecin",n:"doc",type:"text",ph:"Dr. Nom"},
        {l:"Type de note",n:"ntype",type:"select",opts:["Observation clinique","Note de suivi","Alerte médicale","Note de transfert","Note de sortie","Compte rendu","Autre"]},
        {l:"Catégorie",n:"cat",type:"select",opts:["Général","Urgence","Chronique","Pédiatrie","Chirurgie","Obstétrique","Psychiatrie","Autre"]},
        {l:"Contenu de la note *",n:"text",type:"textarea",ph:"Décrivez votre observation, l'évolution du patient, les actions prises...",full:true},
      ]},
    ]
  },
  lab:{
    title:"Résultat de laboratoire",
    sections:[
      {t:"Informations de l'analyse", f:[
        {l:"Nom de l'analyse *",n:"title",type:"text",ph:"Ex : NFS, Glycémie, CRP, Ionogramme, ECBU"},
        {l:"Date de prélèvement",n:"date",type:"date",v:td},
        {l:"Type d'analyse",n:"atype",type:"select",opts:["Hématologie","Biochimie","Microbiologie","Immunologie","Parasitologie","Coagulation","Hormonologie","Bactériologie","Sérologie","Autre"]},
        {l:"Priorité",n:"priority",type:"select",opts:["Routine","Urgent","Stat"]},
      ]},
      {t:"Résultats", f:[
        {l:"Valeur / Résultat *",n:"value",type:"text",ph:"Ex : 142 mg/dL, Positif, 9800/mm³"},
        {l:"Unité de mesure",n:"unit",type:"text",ph:"mg/dL, g/L, /mm³, UI/L..."},
        {l:"Valeur de référence normale",n:"ref",type:"text",ph:"Ex : 70–110 mg/dL"},
        {l:"Interprétation",n:"interp",type:"select",opts:["Normal","Élevé","Bas","Critique haut","Critique bas","Non interprétable","À répéter"]},
        {l:"Statut",n:"status",type:"select",opts:["Disponible","En attente","En cours","À refaire","Validé"]},
        {l:"Commentaires du biologiste",n:"report",type:"textarea",ph:"Interprétation clinique, remarques, recommandations...",full:true},
      ]},
    ]
  },
  imaging:{
    title:"Imagerie médicale",
    sections:[
      {t:"Type et contexte", f:[
        {l:"Type d'examen *",n:"type",type:"select",opts:["Radiographie standard","Scanner (TDM)","IRM","Échographie","Mammographie","Scintigraphie","Angiographie","PET-Scan","ECG","EEG","Autre"]},
        {l:"Titre de l'examen *",n:"title",type:"text",ph:"Ex : Radio genou droit, IRM cérébrale, Echo abdominale"},
        {l:"Zone anatomique",n:"zone",type:"text",ph:"Ex : Genou droit, Thorax, Abdomen supérieur",full:true},
        {l:"Date de l'examen",n:"date",type:"date",v:td},
        {l:"Urgence",n:"priority",type:"select",opts:["Routine","Urgent","Stat"]},
        {l:"Médecin prescripteur",n:"prescriber",type:"text",ph:"Dr. Nom"},
      ]},
      {t:"Résultats et compte-rendu", f:[
        {l:"Statut",n:"status",type:"select",opts:["En attente","Disponible","Normal","Anormal","À interpréter","Partiellement disponible"]},
        {l:"Radiologue / Médecin interprète",n:"doc",type:"text",ph:"Dr. Nom"},
        {l:"Compte-rendu complet",n:"report",type:"textarea",ph:"Description des images, résultats, conclusion diagnostique...",full:true},
        {l:"Comparaison avec examens antérieurs",n:"compare",type:"textarea",ph:"Évolution par rapport aux examens précédents...",full:true},
      ]},
      {t:"Fichier image (Rayon X, IRM, Scanner, Écho...)", f:[
        {l:"Importer l'image médicale",n:"img_file",type:"file",accept:"image/*,.dcm,.pdf",full:true,
         hint:"Formats acceptés : JPG, PNG, PDF, DICOM (.dcm) — Rayon X, IRM, Scanner, Échographie, ECG..."},
      ]},
    ]
  },
  document:{
    title:"Ajouter un document",
    sections:[
      {t:"Document clinique", f:[
        {l:"Titre du document *",n:"title",type:"text",ph:"Ex : Ordonnance 10/06, Résultat IRM, Lettre de transfert",full:true},
        {l:"Type de document",n:"type",type:"select",opts:["Ordonnance","Résultat labo","Compte-rendu imagerie","Compte-rendu opératoire","Certificat médical","Photo clinique","Courrier médecin","Consentement éclairé","Lettre de transfert","Rapport hospitalier","Autre"]},
        {l:"Date du document",n:"date",type:"date",v:td},
        {l:"Auteur / Source",n:"author",type:"text",ph:"Dr. Nom ou hôpital d'origine"},
        {l:"Statut",n:"status",type:"select",opts:["Ajouté","En attente de scan","À numériser","Archivé","Confidentiel"]},
        {l:"Description et notes",n:"notes",type:"textarea",ph:"Contenu, contexte, remarques importantes sur ce document...",full:true},
      ]},
      {t:"Fichier à importer", f:[
        {l:"Importer le document",n:"doc_file",type:"file",accept:".pdf,.jpg,.jpeg,.png,.doc,.docx",full:true,
         hint:"PDF, images (JPG/PNG), Word — Ordonnance, certificat, résultat, photo clinique..."},
      ]},
    ]
  }
};

function openForm(type){
  if(!need(`d'ajouter un élément`))return;
  wsFType=type;
  const cfg=FORMS[type]; if(!cfg)return;
  const pt=apt();
  $("fpTitle").textContent=cfg.title;
  $("fpSub").textContent=`Zone : ${pt?.label||"—"}`;
  $("fpBody").innerHTML=cfg.sections.map(sec=>`
    <div class="ws-fp-section">
      <div class="ws-fp-section-title">${sec.t}</div>
      <div class="ws-fp-grid">
        ${sec.f.map(f=>`
          <div class="ws-fp-field ${f.full?"full":""}">
            <label class="ws-fp-label">${f.l}</label>
            ${f.type==="textarea"
              ?`<textarea class="ws-fp-textarea" name="${f.n}" placeholder="${f.ph||""}">${f.v?f.v():""}</textarea>`
              :f.type==="select"
              ?`<select class="ws-fp-select" name="${f.n}">${(f.opts||[]).map(o=>`<option>${o}</option>`).join("")}</select>`
              :f.type==="file"
              ?`<div class="ws-file-zone" onclick="this.querySelector('input').click()">
                  <input type="file" name="${f.n}" accept="${f.accept||'*'}" style="display:none" onchange="handleFilePreview(event,this)">
                  <div class="ws-file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div class="ws-file-text">
                    <strong>Cliquez pour importer un fichier</strong>
                    <span>${f.hint||f.accept||'Tous fichiers'}</span>
                  </div>
                  <div class="ws-file-preview" id="preview_${f.n}" style="display:none"></div>
                </div>`
              :`<input class="ws-fp-input" type="${f.type}" name="${f.n}" placeholder="${f.ph||""}" value="${f.v?f.v():""}">`
            }
          </div>`).join("")}
      </div>
    </div>`).join("");
  $("formPanel").classList.add("open");
  setTimeout(()=>{const fi=document.querySelector(".ws-fp-input:not([disabled]),.ws-fp-textarea");if(fi)fi.focus()},360);
}

function closeForm(){$("formPanel")?.classList.remove("open")}


/* ══════════════════════════════════
   LIGHTBOX — image/doc preview
══════════════════════════════════ */
function openLightbox(src, title, type){
  // Remove existing
  const existing = document.getElementById('wsLightbox');
  if(existing) existing.remove();

  const isImage = type && type.startsWith('image/');
  const isPDF   = type === 'application/pdf' || (src && src.endsWith('.pdf'));

  const lb = document.createElement('div');
  lb.id = 'wsLightbox';
  lb.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.88);backdrop-filter:blur(12px);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:24px;cursor:zoom-out;
  `;
  lb.innerHTML = `
    <div style="position:absolute;top:20px;right:20px;">
      <button onclick="document.getElementById('wsLightbox').remove()" style="
        width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);
        background:rgba(255,255,255,.1);color:#fff;font-size:18px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
      ">×</button>
    </div>
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:16px;letter-spacing:1px;text-transform:uppercase;">${title||'Aperçu'}</div>
    ${isImage
      ? `<img src="${src}" style="max-width:90vw;max-height:80vh;border-radius:12px;object-fit:contain;box-shadow:0 20px 80px rgba(0,0,0,.5);">`
      : isPDF
      ? `<div style="background:#fff;border-radius:12px;padding:32px;text-align:center;max-width:400px;">
           <div style="font-size:48px;margin-bottom:12px">📄</div>
           <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:8px">${title}</div>
           <div style="font-size:12px;color:#666">Fichier PDF — ouverture dans un vrai hôpital via serveur</div>
         </div>`
      : `<div style="background:#fff;border-radius:12px;padding:32px;text-align:center;max-width:400px;">
           <div style="font-size:48px;margin-bottom:12px">📎</div>
           <div style="font-size:15px;font-weight:700;color:#111">${title}</div>
         </div>`
    }
    <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,.3);">Cliquez n'importe où pour fermer</div>
  `;
  lb.addEventListener('click', e => { if(e.target===lb) lb.remove(); });
  document.body.appendChild(lb);
  requestAnimationFrame(()=>{ lb.style.opacity='0'; lb.style.transition='opacity .2s'; requestAnimationFrame(()=>lb.style.opacity='1'); });
}

function handleFilePreview(event, input){
  const file = event.target.files[0];
  if(!file) return;
  const preview = input.parentElement.querySelector('.ws-file-preview');
  const zone    = input.closest('.ws-file-zone');
  if(!preview) return;

  // Store file reference on the input for later use
  input._file = file;

  // Show preview
  preview.style.display = 'flex';
  if(file.type.startsWith('image/')){
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      // Store dataUrl directly on file object for retrieval at save time
      input._file._dataUrl = dataUrl;
      preview.innerHTML = `
        <img src="${dataUrl}" alt="Aperçu"
          style="max-width:100%;max-height:120px;border-radius:10px;object-fit:contain;cursor:zoom-in;"
          onclick="openLightbox('${dataUrl}','${file.name}','${file.type}')">
        <div style="font-size:11px;color:var(--mid);margin-top:6px">${file.name} · ${(file.size/1024).toFixed(0)} Ko</div>`;
    };
    reader.readAsDataURL(file);
  } else {
    const icons = {
      'application/pdf':'📄',
      'application/msword':'📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'📝'
    };
    const icon = icons[file.type] || '📎';
    preview.innerHTML = `
      <div style="font-size:28px;margin-bottom:6px">${icon}</div>
      <div style="font-size:12px;font-weight:700;color:var(--ink)">${file.name}</div>
      <div style="font-size:11px;color:var(--mid)">${(file.size/1024).toFixed(0)} Ko — Prêt à enregistrer</div>`;
  }

  // Update zone appearance
  zone.style.borderColor = 'var(--accent)';
  zone.style.background  = 'rgba(239,255,58,0.05)';
  zone.querySelector('.ws-file-text strong').textContent = 'Fichier sélectionné ✓';
}

function saveItem(){
  const p=apt(); if(!p){toast("Aucun point clinique actif.");return;}
  const v=n=>($("formPanel").querySelector(`[name="${n}"]`)?.value||"").trim();
  const d=td();

  if(wsFType==="consultation"){
    const diag=v("diag")||v("diag_prov")||"Diagnostic à préciser";
    let notes=v("notes"); if(v("plan"))notes+=(notes?"\n\n":"")+"Plan : "+v("plan");
    p.consultations.push({id:Date.now(),date:v("date")||d,time:v("time")||tnow(),doc:v("doc")||"Dr. Admin",reason:v("reason")||"Motif non précisé",diag,notes,status:v("status")||"Actif"});
    wsTab="overview";
  } else if(wsFType==="prescription"){
    p.prescriptions.push({date:v("date")||d,drug:v("drug")||"Médicament",dose:v("dose")||"",freq:v("freq")||"",duration:v("duration")||"",instructions:v("instructions")||""});
  } else if(wsFType==="note"){
    p.notes.push({date:v("date")||d,title:v("title")||"Note",text:v("text")||"",doc:v("doc")||"Dr. Admin"});
    wsTab="notes";
  } else if(wsFType==="lab"){
    p.labs.push({date:v("date")||d,title:v("title")||"Analyse",value:v("value")||"",unit:v("unit")||"",status:v("status")||"En attente",report:v("report")||""});
    wsTab="labs";
  } else if(wsFType==="imaging"){
    const imgInput = $("formPanel")?.querySelector('[name="img_file"]');
    const rawFile  = imgInput?._file;
    const imgData  = rawFile ? {
      name:     rawFile.name,
      size:     rawFile.size,
      type:     rawFile.type,
      _dataUrl: rawFile._dataUrl || ''
    } : null;
    p.imaging.push({
      date:v("date")||d, type:v("type")||"Imagerie",
      title:v("title")||"Examen", status:v("status")||"En attente",
      report:v("report")||"", doc:v("doc")||"", file:imgData
    });
    wsTab="imaging";
  } else if(wsFType==="document"){
    const docInput = $("formPanel")?.querySelector('[name="doc_file"]');
    const rawDocFile = docInput?._file;
    const docData  = rawDocFile ? {
      name:     rawDocFile.name,
      size:     rawDocFile.size,
      type:     rawDocFile.type,
      _dataUrl: rawDocFile._dataUrl || ''
    } : null;
    p.documents.push({
      date:v("date")||d, title:v("title")||"Document",
      type:v("type")||"Document", status:v("status")||"Ajouté",
      notes:v("notes")||"", file:docData
    });
    wsTab="documents";
  }

  document.querySelectorAll(".ws-tab").forEach(t=>{
    const map={overview:"Résumé",notes:"Notes",labs:"Labo",imaging:"Imagerie",documents:"Documents"};
    t.classList.toggle("active",t.textContent===map[wsTab]);
  });
  closeForm(); renderWS();
  toast("Enregistré avec succès ✓");
}

window.addEventListener("resize",()=>{if($("wsModal")?.classList.contains("ws-open"))drawLines()});

/* ── INIT ── */
renderKpis();
renderTable();