const API_BASE="https://clinickeeper-api.onrender.com";
const GAUGE_LEN=Math.PI*80;
let lastResult=null,currentTone="samimi",currentRole="yonetici",currentBranch="all",currentWhen="hafta",scoredPatients=[];
const STAFF_BRANCH="Kadıköy";
const MONTHS=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const APPT_LABELS={"New":"Yeni hasta","Follow-up":"Eski hasta","Others":"Diğer"};
const BRANCH_TO_CLINIC={"Kadıköy":"SANTA MONICA CLINIC","Ataşehir":"ENCINO CARE CENTER","Bakırköy":"SOUTH BAY CARE CENTER"};
const EXAMPLES={
  high:{patient_name:"Ayşe Yılmaz",lead_time:58,age:34,appt_num:2,total_success_appointments:0,total_cancellations:0,total_rescheduled:0,is_repeat:true,day_of_week:"3",hour_of_day:9,month:12,week_of_month:1,appt_type:"New",clinic:"VALENCIA CARE CENTER"},
  low:{patient_name:"Mehmet Demir",lead_time:2,age:41,appt_num:8,total_success_appointments:6,total_cancellations:0,total_rescheduled:0,is_repeat:true,day_of_week:"2",hour_of_day:11,month:6,week_of_month:2,appt_type:"Follow-up",clinic:"SANTA MONICA CLINIC"}
};
const PATIENTS=[
 {name:"Zeynep Kaya",islem:"İmplant kontrolü",sube:"Kadıköy",saat:"09:00",when:"yarin",tag:"",f:{lead_time:58,age:29,appt_num:2,total_success_appointments:0,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:3,hour_of_day:9,month:12,week_of_month:1,appt_type:"New",ethnicity:"Hispanic",race:"Other",clinic:"VALENCIA CARE CENTER"}},
 {name:"Emre Şahin",islem:"Dolgu",sube:"Bakırköy",saat:"09:30",when:"yarin",tag:"",f:{lead_time:40,age:27,appt_num:2,total_success_appointments:0,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:2,hour_of_day:9,month:10,week_of_month:1,appt_type:"New",ethnicity:"Hispanic",race:"Other",clinic:"SOUTH BAY CARE CENTER"}},
 {name:"Elif Aydın",islem:"Diş çekimi",sube:"Ataşehir",saat:"10:00",when:"hafta",tag:"1 erteleme",f:{lead_time:45,age:31,appt_num:2,total_success_appointments:0,total_cancellations:0,total_rescheduled:1,is_repeat:1,day_of_week:4,hour_of_day:10,month:11,week_of_month:1,appt_type:"New",ethnicity:"Hispanic",race:"Other",clinic:"VALENCIA CARE CENTER"}},
 {name:"Burak Çelik",islem:"Kanal tedavisi",sube:"Ataşehir",saat:"10:30",when:"hafta",tag:"",f:{lead_time:20,age:30,appt_num:3,total_success_appointments:1,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:1,hour_of_day:10,month:9,week_of_month:2,appt_type:"New",ethnicity:"Hispanic",race:"Other",clinic:"SOUTH BAY CARE CENTER"}},
 {name:"Selin Doğan",islem:"Detartraj",sube:"Kadıköy",saat:"11:00",when:"yarin",tag:"1 iptal",f:{lead_time:24,age:33,appt_num:3,total_success_appointments:0,total_cancellations:1,total_rescheduled:0,is_repeat:1,day_of_week:3,hour_of_day:11,month:8,week_of_month:3,appt_type:"New",ethnicity:"Hispanic",race:"Other",clinic:"SOUTH BAY CARE CENTER"}},
 {name:"Okan Yıldız",islem:"Diş taşı temizliği",sube:"Bakırköy",saat:"11:30",when:"hafta",tag:"",f:{lead_time:17,age:52,appt_num:3,total_success_appointments:1,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:1,hour_of_day:11,month:6,week_of_month:3,appt_type:"New",ethnicity:"Hispanic",race:"Other",clinic:"ENCINO CARE CENTER"}},
 {name:"Caner Öztürk",islem:"Dolgu",sube:"Kadıköy",saat:"13:00",when:"yarin",tag:"",f:{lead_time:12,age:45,appt_num:4,total_success_appointments:3,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:3,hour_of_day:13,month:7,week_of_month:4,appt_type:"Follow-up",ethnicity:"Hispanic",race:"Other",clinic:"ENCINO CARE CENTER"}},
 {name:"Gizem Arslan",islem:"Kontrol",sube:"Ataşehir",saat:"13:30",when:"hafta",tag:"",f:{lead_time:9,age:33,appt_num:5,total_success_appointments:4,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:4,hour_of_day:13,month:6,week_of_month:2,appt_type:"Follow-up",ethnicity:"Hispanic",race:"European",clinic:"SANTA MONICA CLINIC"}},
 {name:"Deniz Koç",islem:"Ortodonti kontrolü",sube:"Bakırköy",saat:"14:00",when:"hafta",tag:"",f:{lead_time:7,age:19,appt_num:6,total_success_appointments:5,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:2,hour_of_day:14,month:5,week_of_month:2,appt_type:"Follow-up",ethnicity:"Hispanic",race:"European",clinic:"SANTA MONICA CLINIC"}},
 {name:"Merve Aksoy",islem:"Dolgu kontrolü",sube:"Kadıköy",saat:"14:30",when:"yarin",tag:"",f:{lead_time:5,age:40,appt_num:7,total_success_appointments:6,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:3,hour_of_day:14,month:5,week_of_month:3,appt_type:"Follow-up",ethnicity:"Hispanic",race:"European",clinic:"SANTA MONICA CLINIC"}},
 {name:"Kaan Erdoğan",islem:"Rutin muayene",sube:"Ataşehir",saat:"15:00",when:"hafta",tag:"",f:{lead_time:3,age:47,appt_num:9,total_success_appointments:8,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:4,hour_of_day:15,month:6,week_of_month:2,appt_type:"Follow-up",ethnicity:"Hispanic",race:"European",clinic:"SANTA MONICA CLINIC"}},
 {name:"Buse Yılmaz",islem:"Beyazlatma kontrolü",sube:"Bakırköy",saat:"15:30",when:"yarin",tag:"",f:{lead_time:2,age:36,appt_num:10,total_success_appointments:9,total_cancellations:0,total_rescheduled:0,is_repeat:1,day_of_week:2,hour_of_day:15,month:6,week_of_month:4,appt_type:"Follow-up",ethnicity:"Hispanic",race:"European",clinic:"SANTA MONICA CLINIC"}}
];

function bandStyle(b){if(b==="Yüksek")return{color:"var(--coral)",cls:"high"};if(b==="Orta")return{color:"var(--amber)",cls:"mid"};return{color:"var(--green)",cls:"low"};}

async function loadSchema(){
  let opts;
  try{opts=(await(await fetch(API_BASE+"/schema")).json()).options;}
  catch{opts={appt_type:["New","Follow-up","Others"]};}
  const cs=document.getElementById("clinic");cs.innerHTML="";
  Object.keys(BRANCH_TO_CLINIC).forEach(s=>{const o=document.createElement("option");o.value=BRANCH_TO_CLINIC[s];o.textContent="Polident "+s;cs.appendChild(o);});
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
  const total=scoredPatients.length;
  const high=scoredPatients.filter(p=>p.band==="Yüksek").length;
  const low=scoredPatients.filter(p=>p.band==="Düşük").length;
  document.getElementById("s-total").textContent=total;
  document.getElementById("s-high").textContent=String(high).padStart(2,"0");
  document.getElementById("s-low").textContent=String(low).padStart(2,"0");
}
function visible(){
  let r=scoredPatients.slice();
  const br=(currentRole==="personel")?STAFF_BRANCH:currentBranch;
  if(br!=="all")r=r.filter(x=>x.sube===br);
  if(currentWhen==="yarin")r=r.filter(x=>x.when==="yarin");
  r.sort((a,b)=>(b.pct??-1)-(a.pct??-1));return r;
}
function renderList(){
  const wrap=document.getElementById("appt-list");
  const rows=visible();const showBranch=(currentRole==="yonetici");
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
  set("total_success_appointments",p.f.total_success_appointments);set("total_cancellations",p.f.total_cancellations);set("total_rescheduled",p.f.total_rescheduled);
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
  return{lead_time:n("lead_time"),age:n("age"),appt_num:n("appt_num"),total_cancellations:n("total_cancellations"),total_rescheduled:n("total_rescheduled"),total_success_appointments:n("total_success_appointments"),is_repeat:document.getElementById("is_repeat").checked?1:0,day_of_week:n("day_of_week"),week_of_month:n("week_of_month"),month:n("month"),hour_of_day:n("hour_select"),appt_type:v("appt_type"),ethnicity:"Hispanic",race:"Other",clinic:v("clinic")};
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
function show(d){document.getElementById("result-empty").hidden=true;document.getElementById("result-content").hidden=false;updateGauge(d.noshow_percent,d.risk_band);const v=document.getElementById("verdict");v.className="verdict "+bandStyle(d.risk_band).cls;v.innerHTML=verdictText(d.risk_band,d.noshow_percent,d.will_flag);document.getElementById("ai-message").hidden=true;}
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

document.addEventListener("DOMContentLoaded",()=>{
  loadSchema().then(loadList);
  document.getElementById("patient-form").addEventListener("submit",predict);
  document.getElementById("msg-btn").addEventListener("click",genMsg);
  document.getElementById("copy-btn").addEventListener("click",copyMsg);
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>switchTab(t.dataset.tab)));
  document.querySelectorAll("[data-role]").forEach(b=>b.addEventListener("click",()=>{currentRole=b.dataset.role;document.querySelectorAll("[data-role]").forEach(x=>x.classList.toggle("active",x.dataset.role===currentRole));updateControls();}));
  const bs=document.getElementById("branch-select");if(bs)bs.addEventListener("change",()=>{currentBranch=bs.value;renderList();});
  document.querySelectorAll("[data-when]").forEach(b=>b.addEventListener("click",()=>{currentWhen=b.dataset.when;document.querySelectorAll("[data-when]").forEach(x=>x.classList.toggle("active",x.dataset.when===currentWhen));renderList();}));
  document.querySelectorAll("[data-example]").forEach(b=>b.addEventListener("click",()=>applyExample(b.dataset.example)));
  document.querySelectorAll(".tone").forEach(t=>t.addEventListener("click",()=>{document.querySelectorAll(".tone").forEach(x=>x.classList.remove("active"));t.classList.add("active");currentTone=t.dataset.tone;}));
});
