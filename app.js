/* ClinicKeeper frontend — Polident randevu zekâsı
   Backend: FastAPI on Render — /schema, /predict, /generate-message */

const API_BASE = "https://clinickeeper-api.onrender.com";
const GAUGE_LEN = Math.PI * 80;

let lastResult = null;
let currentTone = "samimi";
let currentRole = "yonetici";   // yonetici | personel
let currentBranch = "all";      // all | Kadıköy | Ataşehir | Bakırköy
let currentWhen = "hafta";      // hafta | yarin
let scoredPatients = [];        // model puanlı hastalar (önbellek)

const STAFF_BRANCH = "Kadıköy";  // personel bu şubede varsayılır

/* Ay isimleri */
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

/* Randevu tipi etiketleri */
const APPT_LABELS = { "New": "Yeni hasta", "Follow-up": "Eski hasta", "Others": "Diğer" };

/* ---------------- Hızlı örnekler (tek hasta) ---------------- */
const EXAMPLES = {
  high: { patient_name: "Ayşe Yılmaz", lead_time: 58, age: 34, appt_num: 2,
    total_success_appointments: 0, total_cancellations: 0, total_rescheduled: 0,
    is_repeat: true, day_of_week: "3", hour_of_day: 9, month: 12, week_of_month: 1,
    appt_type: "New", clinic: "VALENCIA CARE CENTER" },
  low: { patient_name: "Mehmet Demir", lead_time: 2, age: 41, appt_num: 8,
    total_success_appointments: 6, total_cancellations: 0, total_rescheduled: 0,
    is_repeat: true, day_of_week: "2", hour_of_day: 11, month: 6, week_of_month: 2,
    appt_type: "Follow-up", clinic: "SANTA MONICA CLINIC" },
};

/* ---------------- Polident randevu listesi ----------------
   when: 'yarin' = yarınki randevular, 'hafta' = bu hafta (yarın dahil)
   clinic: modele giden CHLA kategorisi (görünmez); sube: ekranda görünen */
const PATIENTS = [
  { name:"Zeynep Kaya", islem:"İmplant kontrolü", sube:"Kadıköy", saat:"09:00", when:"yarin", tag:"",
    f:{ lead_time:58, age:29, appt_num:2, total_success_appointments:0, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:3, hour_of_day:9, month:12, week_of_month:1, appt_type:"New", ethnicity:"Hispanic", race:"Other", clinic:"VALENCIA CARE CENTER" } },
  { name:"Emre Şahin", islem:"Dolgu", sube:"Bakırköy", saat:"09:30", when:"yarin", tag:"",
    f:{ lead_time:40, age:27, appt_num:2, total_success_appointments:0, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:2, hour_of_day:9, month:10, week_of_month:1, appt_type:"New", ethnicity:"Hispanic", race:"Other", clinic:"SOUTH BAY CARE CENTER" } },
  { name:"Elif Aydın", islem:"Diş çekimi", sube:"Ataşehir", saat:"10:00", when:"hafta", tag:"1 erteleme",
    f:{ lead_time:45, age:31, appt_num:2, total_success_appointments:0, total_cancellations:0, total_rescheduled:1, is_repeat:1, day_of_week:4, hour_of_day:10, month:11, week_of_month:1, appt_type:"New", ethnicity:"Hispanic", race:"Other", clinic:"VALENCIA CARE CENTER" } },
  { name:"Burak Çelik", islem:"Kanal tedavisi", sube:"Ataşehir", saat:"10:30", when:"hafta", tag:"",
    f:{ lead_time:20, age:30, appt_num:3, total_success_appointments:1, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:1, hour_of_day:10, month:9, week_of_month:2, appt_type:"New", ethnicity:"Hispanic", race:"Other", clinic:"SOUTH BAY CARE CENTER" } },
  { name:"Selin Doğan", islem:"Detartraj", sube:"Kadıköy", saat:"11:00", when:"yarin", tag:"1 iptal",
    f:{ lead_time:24, age:33, appt_num:3, total_success_appointments:0, total_cancellations:1, total_rescheduled:0, is_repeat:1, day_of_week:3, hour_of_day:11, month:8, week_of_month:3, appt_type:"New", ethnicity:"Hispanic", race:"Other", clinic:"SOUTH BAY CARE CENTER" } },
  { name:"Okan Yıldız", islem:"Diş taşı temizliği", sube:"Bakırköy", saat:"11:30", when:"hafta", tag:"",
    f:{ lead_time:17, age:52, appt_num:3, total_success_appointments:1, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:1, hour_of_day:11, month:6, week_of_month:3, appt_type:"New", ethnicity:"Hispanic", race:"Other", clinic:"ENCINO CARE CENTER" } },
  { name:"Caner Öztürk", islem:"Dolgu", sube:"Kadıköy", saat:"13:00", when:"yarin", tag:"",
    f:{ lead_time:12, age:45, appt_num:4, total_success_appointments:3, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:3, hour_of_day:13, month:7, week_of_month:4, appt_type:"Follow-up", ethnicity:"Hispanic", race:"Other", clinic:"ENCINO CARE CENTER" } },
  { name:"Gizem Arslan", islem:"Kontrol", sube:"Ataşehir", saat:"13:30", when:"hafta", tag:"",
    f:{ lead_time:9, age:33, appt_num:5, total_success_appointments:4, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:4, hour_of_day:13, month:6, week_of_month:2, appt_type:"Follow-up", ethnicity:"Hispanic", race:"European", clinic:"SANTA MONICA CLINIC" } },
  { name:"Deniz Koç", islem:"Ortodonti kontrolü", sube:"Bakırköy", saat:"14:00", when:"hafta", tag:"",
    f:{ lead_time:7, age:19, appt_num:6, total_success_appointments:5, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:2, hour_of_day:14, month:5, week_of_month:2, appt_type:"Follow-up", ethnicity:"Hispanic", race:"European", clinic:"SANTA MONICA CLINIC" } },
  { name:"Merve Aksoy", islem:"Dolgu kontrolü", sube:"Kadıköy", saat:"14:30", when:"yarin", tag:"",
    f:{ lead_time:5, age:40, appt_num:7, total_success_appointments:6, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:3, hour_of_day:14, month:5, week_of_month:3, appt_type:"Follow-up", ethnicity:"Hispanic", race:"European", clinic:"SANTA MONICA CLINIC" } },
  { name:"Kaan Erdoğan", islem:"Rutin muayene", sube:"Ataşehir", saat:"15:00", when:"hafta", tag:"",
    f:{ lead_time:3, age:47, appt_num:9, total_success_appointments:8, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:4, hour_of_day:15, month:6, week_of_month:2, appt_type:"Follow-up", ethnicity:"Hispanic", race:"European", clinic:"SANTA MONICA CLINIC" } },
  { name:"Buse Yılmaz", islem:"Beyazlatma kontrolü", sube:"Bakırköy", saat:"15:30", when:"yarin", tag:"",
    f:{ lead_time:2, age:36, appt_num:10, total_success_appointments:9, total_cancellations:0, total_rescheduled:0, is_repeat:1, day_of_week:2, hour_of_day:15, month:6, week_of_month:4, appt_type:"Follow-up", ethnicity:"Hispanic", race:"European", clinic:"SANTA MONICA CLINIC" } },
];

/* ================= ŞEMA + FORM ayarları ================= */
async function loadSchema() {
  let opts;
  try {
    const res = await fetch(`${API_BASE}/schema`);
    opts = (await res.json()).options;
  } catch {
    opts = { clinic:["VALENCIA CARE CENTER","SOUTH BAY CARE CENTER","ENCINO CARE CENTER","SANTA MONICA CLINIC","BAKERSFIELD CARE CLINIC","OTHER"],
             appt_type:["New","Follow-up","Others"] };
  }
  // Klinik: şube isimleriyle göster, değeri CHLA klinik olarak sakla
  fillClinicSelect();
  fillSelectRaw("appt_type", opts.appt_type, APPT_LABELS);
  fillMonthSelect();
  fillHourSelect();
}

const BRANCH_TO_CLINIC = {
  "Kadıköy": "SANTA MONICA CLINIC",
  "Ataşehir": "ENCINO CARE CENTER",
  "Bakırköy": "SOUTH BAY CARE CENTER",
};
function fillClinicSelect() {
  const sel = document.getElementById("clinic");
  if (!sel) return;
  sel.innerHTML = "";
  Object.keys(BRANCH_TO_CLINIC).forEach((sube) => {
    const o = document.createElement("option");
    o.value = BRANCH_TO_CLINIC[sube];
    o.textContent = "Polident " + sube;
    sel.appendChild(o);
  });
}
function fillSelectRaw(id, values, labelMap) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = "";
  values.forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = (labelMap && labelMap[v]) || v;
    sel.appendChild(o);
  });
}
function fillMonthSelect() {
  const sel = document.getElementById("month");
  if (!sel) return;
  sel.innerHTML = "";
  MONTHS.forEach((m, i) => {
    const o = document.createElement("option");
    o.value = i + 1; o.textContent = m;
    sel.appendChild(o);
  });
  sel.value = 6;
}
function fillHourSelect() {
  const sel = document.getElementById("hour_select");
  if (!sel) return;
  sel.innerHTML = "";
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 18 && m > 0) break;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const o = document.createElement("option");
      o.value = h;                 // modele saat (0-23) gider
      o.textContent = `${hh}:${mm}`;
      sel.appendChild(o);
    }
  }
  sel.value = 9;
}

/* ================= PREDICT ================= */
async function predictPayload(payload) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function bandStyle(band) {
  if (band === "Yüksek") return { color: "var(--coral)", cls: "high" };
  if (band === "Orta")   return { color: "var(--amber)", cls: "mid" };
  return { color: "var(--green)", cls: "low" };
}

/* ================= RANDEVU LİSTESİ ================= */
async function loadAppointmentList() {
  try {
    scoredPatients = await Promise.all(
      PATIENTS.map(async (p) => {
        try {
          const r = await predictPayload(p.f);
          return { ...p, pct: r.noshow_percent, band: r.risk_band, flag: r.will_flag };
        } catch {
          return { ...p, pct: null, band: null, flag: false };
        }
      })
    );
    renderAppointmentList();
  } catch {
    document.getElementById("appt-table").innerHTML =
      `<div class="appt-error">Randevular yüklenemedi. API uyanıyor olabilir — sayfayı birazdan yenileyin.</div>`;
  }
}

function visiblePatients() {
  let rows = scoredPatients.slice();
  // rol + şube filtresi
  const branch = (currentRole === "personel") ? STAFF_BRANCH : currentBranch;
  if (branch !== "all") rows = rows.filter((r) => r.sube === branch);
  // zaman filtresi
  if (currentWhen === "yarin") rows = rows.filter((r) => r.when === "yarin");
  // riske göre sırala
  rows.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  return rows;
}

function renderAppointmentList() {
  const table = document.getElementById("appt-table");
  const rows = visiblePatients();
  const showBranch = (currentRole === "yonetici");

  if (!rows.length) {
    table.innerHTML = `<div class="appt-error">Bu görünümde randevu yok.</div>`;
    return;
  }

  const header = `
    <div class="appt-row appt-header">
      <span class="c-risk">Risk</span>
      <span class="c-name">Hasta</span>
      <span class="c-islem">İşlem</span>
      ${showBranch ? '<span class="c-sube">Şube</span>' : ''}
      <span class="c-saat">Saat</span>
      <span class="c-action"></span>
    </div>`;

  const body = rows.map((r) => {
    const { color, cls } = r.band ? bandStyle(r.band) : { color: "var(--line)", cls: "na" };
    const pctText = r.pct == null ? "—" : `%${r.pct}`;
    const tagHtml = r.tag ? `<span class="hist-tag">⚠ ${r.tag}</span>` : "";
    return `
      <div class="appt-row ${showBranch ? '' : 'no-sube'}" data-name="${r.name}">
        <span class="c-risk"><span class="risk-badge ${cls}" style="--bc:${color}">${pctText}</span></span>
        <span class="c-name"><b>${r.name}</b> ${tagHtml}</span>
        <span class="c-islem">${r.islem}</span>
        ${showBranch ? `<span class="c-sube">${r.sube}</span>` : ''}
        <span class="c-saat">${r.saat}</span>
        <span class="c-action"><button class="row-btn" data-name="${r.name}">Analiz&nbsp;et →</button></span>
      </div>`;
  }).join("");

  table.className = "appt-table" + (showBranch ? "" : " compact");
  table.innerHTML = header + body;
  table.querySelectorAll(".row-btn").forEach((b) =>
    b.addEventListener("click", () => openPatientInAnalyzer(b.dataset.name)));
}

/* Listeden hastayı analiz sekmesine taşı */
function openPatientInAnalyzer(name) {
  const p = PATIENTS.find((x) => x.name === name);
  if (!p) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  document.getElementById("patient_name").value = p.name;
  set("lead_time", p.f.lead_time); set("age", p.f.age); set("appt_num", p.f.appt_num);
  set("total_success_appointments", p.f.total_success_appointments);
  set("total_cancellations", p.f.total_cancellations);
  set("total_rescheduled", p.f.total_rescheduled);
  document.getElementById("is_repeat").checked = !!p.f.is_repeat;
  set("day_of_week", String(p.f.day_of_week));
  set("hour_select", p.f.hour_of_day);
  set("month", p.f.month); set("week_of_month", p.f.week_of_month);
  set("appt_type", p.f.appt_type); set("clinic", p.f.clinic);
  switchTab("single");
  document.getElementById("patient-form").requestSubmit();
}

/* ================= ROL / ŞUBE / ZAMAN kontrolleri ================= */
function updateControls() {
  // Personel modunda şube seçici gizli, sabit şube yazısı
  const branchWrap = document.getElementById("branch-wrap");
  const staffLabel = document.getElementById("staff-branch-label");
  if (currentRole === "personel") {
    branchWrap.hidden = true;
    staffLabel.hidden = false;
    staffLabel.textContent = "Polident " + STAFF_BRANCH;
  } else {
    branchWrap.hidden = false;
    staffLabel.hidden = true;
  }
  renderAppointmentList();
}

/* ================= SEKME ================= */
function switchTab(which) {
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === which));
  document.getElementById("panel-list").classList.toggle("active", which === "list");
  document.getElementById("panel-single").classList.toggle("active", which === "single");
}

/* ================= TEK HASTA ================= */
function collectPayload() {
  const val = (id) => document.getElementById(id).value;
  const num = (id) => Number(val(id));
  return {
    lead_time: num("lead_time"), age: num("age"), appt_num: num("appt_num"),
    total_cancellations: num("total_cancellations"),
    total_rescheduled: num("total_rescheduled"),
    total_success_appointments: num("total_success_appointments"),
    is_repeat: document.getElementById("is_repeat").checked ? 1 : 0,
    day_of_week: num("day_of_week"), week_of_month: num("week_of_month"),
    month: num("month"), hour_of_day: num("hour_select"),
    appt_type: val("appt_type"),
    ethnicity: "Hispanic", race: "Other",   // arayüzde yok, nötr baseline
    clinic: val("clinic"),
  };
}

function applyExample(key) {
  const ex = EXAMPLES[key];
  for (const [k, v] of Object.entries(ex)) {
    const el = document.getElementById(k === "hour_of_day" ? "hour_select" : k);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(v);
    else el.value = v;
  }
}

function verdictText(band, pct, willFlag) {
  if (band === "Yüksek")
    return `Bu hasta <b>yüksek no-show riski</b> taşıyor (%${pct}). Hafta başında gözden geçirilmeli — aşağıdan bir hatırlatma mesajı oluşturabilirsin.`;
  if (band === "Orta")
    return `<b>Orta düzey risk</b> (%${pct}). Nazik bir hatırlatma faydalı olur.`;
  return willFlag
    ? `Düşük ama eşik üstü risk (%${pct}). İstersen hatırlatma gönderebilirsin.`
    : `<b>Düşük risk</b> (%${pct}). Ek hatırlatmaya gerek görünmüyor.`;
}

function updateGauge(pct, band) {
  const fill = document.getElementById("gauge-fill");
  const { color } = bandStyle(band);
  fill.style.stroke = color;
  fill.getBoundingClientRect();
  fill.style.strokeDashoffset = GAUGE_LEN * (1 - Math.min(pct, 100) / 100);
  const el = document.getElementById("gauge-percent");
  el.textContent = `%${pct}`; el.style.color = color;
  document.getElementById("gauge-band").textContent = band + " risk";
}

async function predict(e) {
  e.preventDefault();
  const btn = document.getElementById("predict-btn");
  setLoading(btn, true);
  const payload = collectPayload();
  try {
    const data = await predictPayload(payload);
    lastResult = { ...data,
      patient_name: document.getElementById("patient_name").value.trim() || "Değerli hastamız",
      appt_type: payload.appt_type, lead_time: payload.lead_time };
    showResult(data);
  } catch (err) {
    alert("Tahmin alınamadı. API uyanıyor olabilir (ilk istek ~50 sn). Birkaç saniye sonra tekrar dene.");
    console.error(err);
  } finally { setLoading(btn, false); }
}

function showResult(data) {
  document.getElementById("result-empty").hidden = true;
  document.getElementById("result-content").hidden = false;
  updateGauge(data.noshow_percent, data.risk_band);
  const v = document.getElementById("verdict");
  v.className = "verdict " + bandStyle(data.risk_band).cls;
  v.innerHTML = verdictText(data.risk_band, data.noshow_percent, data.will_flag);
  document.getElementById("ai-message").hidden = true;
}

async function generateMessage() {
  if (!lastResult) return;
  const btn = document.getElementById("msg-btn");
  setLoading(btn, true);
  const body = {
    patient_name: lastResult.patient_name, risk_band: lastResult.risk_band,
    noshow_percent: lastResult.noshow_percent,
    clinic: "Polident Ağız ve Diş Sağlığı Kliniği",
    appt_type: APPT_LABELS[lastResult.appt_type] || lastResult.appt_type,
    lead_time: lastResult.lead_time, tone: currentTone,
  };
  try {
    const res = await fetch(`${API_BASE}/generate-message`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("ai-message-text").textContent = data.message;
    document.getElementById("ai-message").hidden = false;
  } catch (err) {
    document.getElementById("ai-message-text").textContent =
      "Mesaj oluşturulamadı. AI servisi şu an yanıt vermiyor olabilir; birkaç saniye sonra tekrar dene.";
    document.getElementById("ai-message").hidden = false;
    console.error(err);
  } finally { setLoading(btn, false); }
}

/* ================= yardımcılar ================= */
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector(".btn-label").style.opacity = loading ? ".6" : "1";
  btn.querySelector(".btn-spinner").hidden = !loading;
}
function copyMessage() {
  const text = document.getElementById("ai-message-text").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const b = document.getElementById("copy-btn");
    const old = b.textContent; b.textContent = "Kopyalandı ✓";
    setTimeout(() => (b.textContent = old), 1500);
  });
}

/* ================= başlat ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadSchema().then(loadAppointmentList);

  document.getElementById("patient-form").addEventListener("submit", predict);
  document.getElementById("msg-btn").addEventListener("click", generateMessage);
  document.getElementById("copy-btn").addEventListener("click", copyMessage);

  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => switchTab(t.dataset.tab)));

  // Rol geçişi
  document.querySelectorAll("[data-role]").forEach((b) =>
    b.addEventListener("click", () => {
      currentRole = b.dataset.role;
      document.querySelectorAll("[data-role]").forEach((x) =>
        x.classList.toggle("active", x.dataset.role === currentRole));
      updateControls();
    }));

  // Şube seçici
  const bsel = document.getElementById("branch-select");
  if (bsel) bsel.addEventListener("change", () => {
    currentBranch = bsel.value; renderAppointmentList();
  });

  // Zaman filtresi (Bu hafta / Yarın)
  document.querySelectorAll("[data-when]").forEach((b) =>
    b.addEventListener("click", () => {
      currentWhen = b.dataset.when;
      document.querySelectorAll("[data-when]").forEach((x) =>
        x.classList.toggle("active", x.dataset.when === currentWhen));
      renderAppointmentList();
    }));

  document.querySelectorAll("[data-example]").forEach((b) =>
    b.addEventListener("click", () => applyExample(b.dataset.example)));

  document.querySelectorAll(".tone").forEach((t) =>
    t.addEventListener("click", () => {
      document.querySelectorAll(".tone").forEach((x) => x.classList.remove("active"));
      t.classList.add("active"); currentTone = t.dataset.tone;
    }));
});
