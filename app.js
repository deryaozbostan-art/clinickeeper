/* ClinicKeeper frontend — Polident randevu zekâsı (v2, sentetik model)
   Backend: FastAPI on Render — /schema, /predict, /generate-message, /analyze-emotion
   Klinik mantık: geç iptal (24s) ağır, erken iptal 2+ risk, sadakat düşürür */

const API_BASE="https://clinickeeper-api.onrender.com";
const GAUGE_LEN=Math.PI*80;
let lastResult=null,currentTone="samimi",currentRole="yonetici",currentBranch="all",currentWhen="hafta",currentRisk="all",scoredPatients=[];
const STAFF_BRANCH="Kadıköy";
const MONTHS=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const APPT_LABELS={"New":"Yeni hasta","Follow-up":"Eski hasta","Others":"Diğer"};

/* Hızlı örnekler (tek hasta) */
const EXAMPLES={
  high:{patient_name:"Ayşe Yılmaz",lead_time:55,age:34,appt_num:3,total_gec_iptal:2,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:0,is_repeat:true,day_of_week:"3",hour_of_day:9,month:12,week_of_month:1,appt_type:"New",clinic:"Kadıköy"},
  low:{patient_name:"Mehmet Demir",lead_time:2,age:41,appt_num:9,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:8,is_repeat:true,day_of_week:"2",hour_of_day:11,month:6,week_of_month:2,appt_type:"Follow-up",clinic:"Ataşehir"}
};

/* Polident randevu listesi — yeni değişkenlerle */
const PATIENTS=[
 {name:"Zeynep Kaya",islem:"İmplant kontrolü",sube:"Kadıköy",saat:"09:00",when:"yarin",tag:"2 geç iptal",f:{lead_time:55,age:29,appt_num:3,total_gec_iptal:2,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:0,is_repeat:1,day_of_week:3,hour_of_day:9,month:12,week_of_month:1,appt_type:"New",clinic:"Kadıköy"}},
 {name:"Emre Şahin",islem:"Dolgu",sube:"Bakırköy",saat:"09:30",when:"yarin",tag:"1 geç iptal",f:{lead_time:45,age:27,appt_num:2,total_gec_iptal:1,total_erken_iptal:1,total_rescheduled:0,total_success_appointments:0,is_repeat:1,day_of_week:2,hour_of_day:9,month:10,week_of_month:1,appt_type:"New",clinic:"Bakırköy"}},
 {name:"Elif Aydın",islem:"Diş çekimi",sube:"Ataşehir",saat:"10:00",when:"hafta",tag:"1 geç + erteleme",f:{lead_time:40,age:31,appt_num:2,total_gec_iptal:1,total_erken_iptal:0,total_rescheduled:2,total_success_appointments:0,is_repeat:1,day_of_week:4,hour_of_day:10,month:11,week_of_month:1,appt_type:"New",clinic:"Ataşehir"}},
 {name:"Burak Çelik",islem:"Kanal tedavisi",sube:"Ataşehir",saat:"10:30",when:"hafta",tag:"3 erken iptal",f:{lead_time:30,age:30,appt_num:4,total_gec_iptal:0,total_erken_iptal:3,total_rescheduled:0,total_success_appointments:1,is_repeat:1,day_of_week:1,hour_of_day:10,month:9,week_of_month:2,appt_type:"New",clinic:"Ataşehir"}},
 {name:"Selin Doğan",islem:"Detartraj",sube:"Kadıköy",saat:"11:00",when:"yarin",tag:"yeni hasta",f:{lead_time:60,age:33,appt_num:1,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:0,is_repeat:0,day_of_week:3,hour_of_day:11,month:8,week_of_month:3,appt_type:"New",clinic:"Kadıköy"}},
 {name:"Okan Yıldız",islem:"Diş taşı temizliği",sube:"Bakırköy",saat:"11:30",when:"hafta",tag:"3 erken iptal",f:{lead_time:30,age:52,appt_num:4,total_gec_iptal:0,total_erken_iptal:3,total_rescheduled:2,total_success_appointments:1,is_repeat:1,day_of_week:1,hour_of_day:11,month:6,week_of_month:3,appt_type:"Follow-up",clinic:"Bakırköy"}},
 {name:"Caner Öztürk",islem:"Dolgu",sube:"Kadıköy",saat:"13:00",when:"yarin",tag:"",f:{lead_time:18,age:45,appt_num:5,total_gec_iptal:0,total_erken_iptal:1,total_rescheduled:0,total_success_appointments:3,is_repeat:1,day_of_week:3,hour_of_day:13,month:7,week_of_month:4,appt_type:"Follow-up",clinic:"Kadıköy"}},
 {name:"Gizem Arslan",islem:"Kontrol",sube:"Ataşehir",saat:"13:30",when:"hafta",tag:"",f:{lead_time:12,age:33,appt_num:5,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:1,total_success_appointments:4,is_repeat:1,day_of_week:4,hour_of_day:13,month:6,week_of_month:2,appt_type:"Follow-up",clinic:"Ataşehir"}},
 {name:"Deniz Koç",islem:"Ortodonti kontrolü",sube:"Bakırköy",saat:"14:00",when:"hafta",tag:"",f:{lead_time:7,age:19,appt_num:6,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:5,is_repeat:1,day_of_week:2,hour_of_day:14,month:5,week_of_month:2,appt_type:"Follow-up",clinic:"Bakırköy"}},
 {name:"Merve Aksoy",islem:"Dolgu kontrolü",sube:"Kadıköy",saat:"14:30",when:"yarin",tag:"",f:{lead_time:5,age:40,appt_num:7,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:6,is_repeat:1,day_of_week:3,hour_of_day:14,month:5,week_of_month:3,appt_type:"Follow-up",clinic:"Kadıköy"}},
 {name:"Kaan Erdoğan",islem:"Rutin muayene",sube:"Ataşehir",saat:"15:00",when:"hafta",tag:"",f:{lead_time:3,age:47,appt_num:9,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:8,is_repeat:1,day_of_week:4,hour_of_day:15,month:6,week_of_month:2,appt_type:"Follow-up",clinic:"Ataşehir"}},
 {name:"Buse Yılmaz",islem:"Beyazlatma kontrolü",sube:"Bakırköy",saat:"15:30",when:"yarin",tag:"",f:{lead_time:2,age:36,appt_num:10,total_gec_iptal:0,total_erken_iptal:0,total_rescheduled:0,total_success_appointments:9,is_repeat:1,day_of_week:2,hour_of_day:15,month:6,week_of_month:4,appt_type:"Follow-up",clinic:"Bakırköy"}}
];

function bandStyle(b){if(b==="Yüksek")return{color:"var(--coral)",cls:"high"};if(b==="Orta")return{color:"var(--amber)",cls:"mid"};return{color:"var(--green)",cls:"low"};}

async function loadSchema(){
  let opts;
  try{opts=(await(await fetch(API_BASE+"/schema")).json()).options;}
  catch{opts={clinic:["Kadıköy","Ataşehir","Bakırköy"],appt_type:["New","Follow-up","Others"]};}
  const cs=document.getElementById("clinic");cs.innerHTML="";
  (opts.clinic||["Kadıköy","Ataşehir","Bakırköy"]).forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent="Polident "+s;cs.appendChild(o);});
  const as=document.getElementById("appt_type");as.innerHTML="";
  (opts.appt_type||["New","Follow-up","Others"]).forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=APPT_LABELS[v]||v;as.appendChild(o);});
  const ms=document.getElementById("month");ms.innerHTML="";MONTHS.forEach((m,i)=>{const o=document.createElement("option");o.value=i+1;o.textContent=m;ms.appendChild(o);});ms.value=6;
  const hs=document.getElementById("hour_select");hs.innerHTML="";
  for(let h=9;h<=18;h++)for(let m=0;m<60;m+=15){if(h===18&&m>0)break;const o=document.createElement("option");o.value=h;o.textContent=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");hs.appendChild(o);}hs.value=9;
}
async function predictPayload(p){const r=await fetch(API_BASE+"/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!r.ok)throw new Error(await r.text());return r.json();}

async function loadList(){
  try{
    scoredPatients=await Promise.all(PATIENTS.map(async p=>{
      try{const r=await predictPayload(p.f);return{...p,pct:r.noshow_percent,band:r.risk_band};}
      catch{return{...p,pct:null,band:null};}
    }));
    updateStats();renderList();
  }catch{document.getElementById("appt-list").innerHTML='<div class="appt-error">Randevular yüklenemedi. Sayfayı birazdan yenileyin.</div>';}
}
function updateStats(){
  document.getElementById("s-total").textContent=scoredPatients.length;
  document.getElementById("s-high").textContent=String(scoredPatients.filter(p=>p.band==="Yüksek").length).padStart(2,"0");
  document.getElementById("s-low").textContent=String(scoredPatients.filter(p=>p.band==="Düşük").length).padStart(2,"0");
}
function visible(){
  let r=scoredPatients.slice();
  const br=(currentRole==="personel")?STAFF_BRANCH:currentBranch;
  if(br!=="all")r=r.filter(x=>x.sube===br);
  if(currentWhen==="yarin")r=r.filter(x=>x.when==="yarin");
  if(currentRisk!=="all")r=r.filter(x=>x.band===currentRisk);
  r.sort((a,b)=>(b.pct??-1)-(a.pct??-1));return r;
}
function renderList(){
  const wrap=document.getElementById("appt-list");
  const rows=visible();const showBranch=(currentRole==="yonetici");
  const chip=document.getElementById("risk-filter-chip");
  if(chip){
    if(currentRisk!=="all"){chip.innerHTML=` · <b style="color:var(--teal-deep)">${currentRisk} risk</b> <button id="clear-risk" style="border:none;background:var(--mint);color:var(--teal-deep);font:inherit;font-size:11px;padding:2px 8px;border-radius:99px;cursor:pointer;margin-left:4px">✕ temizle</button>`;
      const cb=document.getElementById("clear-risk");if(cb)cb.addEventListener("click",()=>{currentRisk="all";document.querySelectorAll(".stat-card.clickable").forEach(x=>x.classList.remove("active"));renderList();});
    }else chip.innerHTML="";
  }
  if(!rows.length){wrap.innerHTML='<div class="appt-error">Bu görünümde randevu yok.</div>';return;}
  const head=`<div class="arow head ${showBranch?'':'no-sube'}"><span>Risk</span><span>Hasta</span><span class="islem">İşlem</span>${showBranch?'<span class="sube">Şube</span>':''}<span class="saat">Saat</span><span></span></div>`;
  const body=rows.map(r=>{
    const {color,cls}=r.band?bandStyle(r.band):{color:"var(--line)",cls:"na"};
    const pct=r.pct==null?"—":"%"+r.pct;const w=r.pct==null?0:Math.min(r.pct,100);
    const tag=r.tag?`<span class="hist-tag">⚠ ${r.tag}</span>`:"";
    return `<div class="arow ${showBranch?'':'no-sube'}">
      <span class="risk-cell"><span class="risk-top"><span class="risk-badge ${cls}" style="--bc:${color}">${pct}</span></span><span class="risk-bar" style="--bc:${color}"><i style="width:${w}%"></i></span></span>
      <span class="name"><b>${r.name}</b> ${tag}<small>Polident ${r.sube}</small></span>
      <span class="islem">${r.islem}</span>
      ${showBranch?`<span class="sube">${r.sube}</span>`:''}
      <span class="saat">${r.saat}</span>
      <span><button class="row-btn" data-name="${r.name}">Analiz&nbsp;et →</button></span>
    </div>`;
  }).join("");
  wrap.innerHTML=head+body;
  wrap.querySelectorAll(".row-btn").forEach(b=>b.addEventListener("click",()=>openInAnalyzer(b.dataset.name)));
}
function openInAnalyzer(name){
  const p=PATIENTS.find(x=>x.name===name);if(!p)return;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  document.getElementById("patient_name").value=p.name;
  set("lead_time",p.f.lead_time);set("age",p.f.age);set("appt_num",p.f.appt_num);
  set("total_gec_iptal",p.f.total_gec_iptal);set("total_erken_iptal",p.f.total_erken_iptal);
  set("total_rescheduled",p.f.total_rescheduled);set("total_success_appointments",p.f.total_success_appointments);
  document.getElementById("is_repeat").checked=!!p.f.is_repeat;
  set("day_of_week",String(p.f.day_of_week));set("hour_select",p.f.hour_of_day);set("month",p.f.month);set("week_of_month",p.f.week_of_month);
  set("appt_type",p.f.appt_type);set("clinic",p.f.clinic);
  switchTab("single");document.getElementById("patient-form").requestSubmit();
}
function switchTab(w){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===w));
  document.getElementById("panel-list").classList.toggle("active",w==="list");
  document.getElementById("panel-single").classList.toggle("active",w==="single");
}
function collect(){
  const v=id=>document.getElementById(id).value,n=id=>Number(v(id));
  return{lead_time:n("lead_time"),age:n("age"),appt_num:n("appt_num"),total_gec_iptal:n("total_gec_iptal"),total_erken_iptal:n("total_erken_iptal"),total_rescheduled:n("total_rescheduled"),total_success_appointments:n("total_success_appointments"),is_repeat:document.getElementById("is_repeat").checked?1:0,day_of_week:n("day_of_week"),week_of_month:n("week_of_month"),month:n("month"),hour_of_day:n("hour_select"),appt_type:v("appt_type"),clinic:v("clinic")};
}
function applyExample(k){const ex=EXAMPLES[k];for(const[key,val]of Object.entries(ex)){const el=document.getElementById(key==="hour_of_day"?"hour_select":key);if(!el)continue;if(el.type==="checkbox")el.checked=Boolean(val);else el.value=val;}}
function verdictText(b,p,f){if(b==="Yüksek")return `Bu hasta <b>yüksek no-show riski</b> taşıyor (%${p}). Hafta başında gözden geçirilmeli — aşağıdan hatırlatma mesajı oluşturabilirsin.`;if(b==="Orta")return `<b>Orta düzey risk</b> (%${p}). Nazik bir hatırlatma faydalı olur.`;return f?`Düşük ama eşik üstü risk (%${p}).`:`<b>Düşük risk</b> (%${p}). Ek hatırlatmaya gerek görünmüyor.`;}
function updateGauge(p,b){const fill=document.getElementById("gauge-fill");const {color}=bandStyle(b);fill.style.stroke=color;fill.getBoundingClientRect();fill.style.strokeDashoffset=GAUGE_LEN*(1-Math.min(p,100)/100);const el=document.getElementById("gauge-percent");el.textContent="%"+p;el.style.color=color;document.getElementById("gauge-band").textContent=b+" risk";}
async function predict(e){
  e.preventDefault();const btn=document.getElementById("predict-btn");setLoading(btn,true);const pl=collect();
  try{const d=await predictPayload(pl);lastResult={...d,patient_name:document.getElementById("patient_name").value.trim()||"Değerli hastamız",appt_type:pl.appt_type,lead_time:pl.lead_time};show(d);}
  catch(err){alert("Tahmin alınamadı. Birkaç saniye sonra tekrar dene.");console.error(err);}
  finally{setLoading(btn,false);}
}
function show(d){document.getElementById("result-empty").hidden=true;document.getElementById("result-content").hidden=false;updateGauge(d.noshow_percent,d.risk_band);const v=document.getElementById("verdict");v.className="verdict "+bandStyle(d.risk_band).cls;v.innerHTML=verdictText(d.risk_band,d.noshow_percent,d.will_flag);document.getElementById("ai-message").hidden=true;resetConv();}
async function genMsg(){
  if(!lastResult)return;const btn=document.getElementById("msg-btn");setLoading(btn,true);
  const body={patient_name:lastResult.patient_name,risk_band:lastResult.risk_band,noshow_percent:lastResult.noshow_percent,clinic:"Polident Ağız ve Diş Sağlığı Kliniği",appt_type:APPT_LABELS[lastResult.appt_type]||lastResult.appt_type,lead_time:lastResult.lead_time,tone:currentTone};
  try{const r=await fetch(API_BASE+"/generate-message",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text());const d=await r.json();document.getElementById("ai-message-text").textContent=d.message;document.getElementById("ai-message").hidden=false;}
  catch(err){document.getElementById("ai-message-text").textContent="Mesaj oluşturulamadı. Birkaç saniye sonra tekrar dene.";document.getElementById("ai-message").hidden=false;console.error(err);}
  finally{setLoading(btn,false);}
}
function setLoading(b,l){b.disabled=l;b.querySelector(".btn-label").style.opacity=l?".6":"1";b.querySelector(".btn-spinner").hidden=!l;}
function copyMsg(){const t=document.getElementById("ai-message-text").textContent;navigator.clipboard.writeText(t).then(()=>{const b=document.getElementById("copy-btn");const o=b.textContent;b.textContent="Kopyalandı ✓";setTimeout(()=>b.textContent=o,1500);});}
function updateControls(){const bw=document.getElementById("branch-wrap"),sl=document.getElementById("staff-branch-label");if(currentRole==="personel"){bw.hidden=true;sl.hidden=false;sl.textContent="Polident "+STAFF_BRANCH;}else{bw.hidden=false;sl.hidden=true;}renderList();}

/* ---------- Görüşme Analizi (opsiyonel) ---------- */
function convTonStyle(pct){
  if(pct>=60)return{color:"var(--coral)",cls:"high"};
  if(pct>=35)return{color:"var(--amber)",cls:"mid"};
  return{color:"var(--green)",cls:"low"};
}
function resetConv(){
  const r=document.getElementById("conv-result");if(r)r.hidden=true;
  const t=document.getElementById("conv-text");if(t)t.value="";
}
async function analyzeConv(){
  const txt=document.getElementById("conv-text").value.trim();
  if(!txt){document.getElementById("conv-text").focus();return;}
  const btn=document.getElementById("conv-btn");setLoading(btn,true);
  try{
    const r=await fetch(API_BASE+"/analyze-emotion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:txt})});
    if(!r.ok)throw new Error(await r.text());
    const d=await r.json();
    const pct=Math.round(Number(d.tereddut_yuzde)||0);
    const {color,cls}=convTonStyle(pct);
    document.getElementById("conv-ton").textContent=d.ton||"Belirsiz";
    document.getElementById("conv-ton").className="conv-ton "+cls;
    document.getElementById("conv-pct").textContent="Tereddüt: %"+pct;
    document.getElementById("conv-pct").style.color=color;
    const bar=document.getElementById("conv-bar-fill");bar.style.width=Math.min(pct,100)+"%";bar.style.background=color;
    document.getElementById("conv-yorum").textContent=d.yorum||"";
    document.getElementById("conv-result").hidden=false;
  }catch(err){
    document.getElementById("conv-ton").textContent="Hata";
    document.getElementById("conv-ton").className="conv-ton";
    document.getElementById("conv-pct").textContent="";
    document.getElementById("conv-bar-fill").style.width="0%";
    document.getElementById("conv-yorum").textContent="Analiz yapılamadı. Birkaç saniye sonra tekrar dene.";
    document.getElementById("conv-result").hidden=false;
    console.error(err);
  }finally{setLoading(btn,false);}
}

document.addEventListener("DOMContentLoaded",()=>{
  loadSchema().then(loadList);
  document.getElementById("patient-form").addEventListener("submit",predict);
  document.getElementById("msg-btn").addEventListener("click",genMsg);
  document.getElementById("copy-btn").addEventListener("click",copyMsg);
  const convBtn=document.getElementById("conv-btn");if(convBtn)convBtn.addEventListener("click",analyzeConv);
  document.querySelectorAll(".chip").forEach(c=>c.addEventListener("click",()=>applyExample(c.dataset.example)));
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>switchTab(t.dataset.tab)));
  document.querySelectorAll("[data-role]").forEach(b=>b.addEventListener("click",()=>{currentRole=b.dataset.role;document.querySelectorAll("[data-role]").forEach(x=>x.classList.toggle("active",x.dataset.role===currentRole));updateControls();}));
  const bs=document.getElementById("branch-select");if(bs)bs.addEventListener("change",()=>{currentBranch=bs.value;renderList();});
  document.querySelectorAll("[data-when]").forEach(b=>b.addEventListener("click",()=>{currentWhen=b.dataset.when;document.querySelectorAll("[data-when]").forEach(x=>x.classList.toggle("active",x.dataset.when===currentWhen));renderList();}));
  document.querySelectorAll(".stat-card.clickable").forEach(c=>c.addEventListener("click",()=>{currentRisk=c.dataset.risk;document.querySelectorAll(".stat-card.clickable").forEach(x=>x.classList.toggle("active",x===c && currentRisk!=="all"));switchTab("list");renderList();}));
  document.querySelectorAll(".tone").forEach(t=>t.addEventListener("click",()=>{document.querySelectorAll(".tone").forEach(x=>x.classList.remove("active"));t.classList.add("active");currentTone=t.dataset.tone;}));
});
/* ---------- Vapi Sesli Görüşme (AI ile web call) ---------- */
const VAPI_PUBLIC_KEY = "e36c1a39-3216-44f3-80ee-568fbe842714";      // Vapi API Keys sayfasından Public Key
const VAPI_ASSISTANT_ID = "e3e112f3-150a-4d93-97f3-a6e7a636f612";  // Riley'in Assistant ID'si

let vapiInstance = null;
let vapiActive = false;
let vapiTranscript = "";

function initVapi() {
  if (vapiInstance) return vapiInstance;
  if (typeof Vapi === "undefined") {
    console.error("Vapi SDK yüklenemedi.");
    return null;
  }
  vapiInstance = new Vapi(VAPI_PUBLIC_KEY);

  vapiInstance.on("call-start", () => {
    vapiActive = true;
    vapiTranscript = "";
    setVapiStatus("Görüşme başladı — konuşabilirsiniz…", "live");
    updateVapiBtn();
  });

  vapiInstance.on("call-end", () => {
    vapiActive = false;
    setVapiStatus("Görüşme bitti. Metin analiz kutusuna aktarıldı.", "done");
    updateVapiBtn();
    // Konuşma metnini duygu analizi kutusuna aktar
    if (vapiTranscript.trim()) {
      const ta = document.getElementById("conv-text");
      if (ta) ta.value = vapiTranscript.trim();
    }
  });

  vapiInstance.on("message", (msg) => {
    // Sadece hastanın (user) konuşmalarını topla
    if (msg.type === "transcript" && msg.transcriptType === "final" && msg.role === "user") {
      vapiTranscript += msg.transcript + " ";
    }
  });

  vapiInstance.on("error", (e) => {
    console.error("Vapi hata:", e);
    vapiActive = false;
    setVapiStatus("Görüşme sırasında hata oluştu.", "err");
    updateVapiBtn();
  });

  return vapiInstance;
}

function setVapiStatus(text, cls) {
  const el = document.getElementById("vapi-status");
  if (!el) return;
  el.textContent = text;
  el.className = "conv-voice-status " + (cls || "");
}

function updateVapiBtn() {
  const btn = document.getElementById("vapi-btn");
  if (!btn) return;
  btn.querySelector(".btn-label").textContent = vapiActive ? "⏹️ Görüşmeyi Bitir" : "🎙️ AI ile Sesli Görüş";
}

function toggleVapi() {
  const v = initVapi();
  if (!v) {
    setVapiStatus("Sesli görüşme başlatılamadı.", "err");
    return;
  }
  if (vapiActive) {
    v.stop();
  } else {
    setVapiStatus("Bağlanıyor…", "");
    v.start(VAPI_ASSISTANT_ID);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const vb = document.getElementById("vapi-btn");
  if (vb) vb.addEventListener("click", toggleVapi);
});
