/* ClinicKeeper frontend
   Backend: FastAPI on Render — /schema, /predict, /generate-message */

const API_BASE = "https://clinickeeper-api.onrender.com";

// Gauge yarım daire toplam uzunluğu (π * r, r=80)
const GAUGE_LEN = Math.PI * 80; // ≈ 251.3

// Son tahmin (mesaj üretiminde kullanılır)
let lastResult = null;
let currentTone = "samimi";

// ----- Örnek profiller (veriden türetildi) -----
const EXAMPLES = {
  high: {
    patient_name: "Ayşe Yılmaz",
    lead_time: 58, age: 13, appt_num: 2,
    total_success_appointments: 0, total_cancellations: 0, total_rescheduled: 0,
    is_repeat: true, day_of_week: "3", hour_of_day: 10, month: 12, week_of_month: 1,
    appt_type: "Follow-up", ethnicity: "Others", race: "Other", clinic: "VALENCIA CARE CENTER",
  },
  low: {
    patient_name: "Mehmet Demir",
    lead_time: 2, age: 6, appt_num: 8,
    total_success_appointments: 6, total_cancellations: 0, total_rescheduled: 0,
    is_repeat: true, day_of_week: "2", hour_of_day: 11, month: 6, week_of_month: 2,
    appt_type: "Follow-up", ethnicity: "Non-Hispanic", race: "European", clinic: "SANTA MONICA CLINIC",
  },
};

// Kategorilerin Türkçe etiketleri (değer aynı kalır, sadece görünüm)
const LABELS = {
  clinic: {
    "BAKERSFIELD CARE CLINIC": "Bakersfield Kliniği",
    "ENCINO CARE CENTER": "Encino Merkezi",
    "SANTA MONICA CLINIC": "Santa Monica Kliniği",
    "SOUTH BAY CARE CENTER": "South Bay Merkezi",
    "VALENCIA CARE CENTER": "Valencia Merkezi",
    "OTHER": "Diğer",
  },
  appt_type: { "New": "Yeni hasta", "Others": "Diğer", "Follow-up": "Kontrol" },
  race: {
    "Asian": "Asya", "European": "Avrupa", "MiddleEastern": "Orta Doğu",
    "NorthAmerican": "Kuzey Amerika", "Other": "Diğer", "SouthAmerican": "Güney Amerika",
  },
  ethnicity: { "Non-Hispanic": "Hispanik değil", "Others": "Diğer", "Hispanic": "Hispanik" },
};

// ----- Şemayı yükle, select'leri doldur -----
async function loadSchema() {
  try {
    const res = await fetch(`${API_BASE}/schema`);
    const data = await res.json();
    fillSelect("clinic", data.options.clinic);
    fillSelect("appt_type", data.options.appt_type);
    fillSelect("race", data.options.race);
    fillSelect("ethnicity", data.options.ethnicity);
  } catch (e) {
    // API uyanıyor olabilir; yine de sabit seçeneklerle doldur
    fillSelect("clinic", ["BAKERSFIELD CARE CLINIC","ENCINO CARE CENTER","SANTA MONICA CLINIC","SOUTH BAY CARE CENTER","VALENCIA CARE CENTER","OTHER"]);
    fillSelect("appt_type", ["New","Others","Follow-up"]);
    fillSelect("race", ["Asian","European","MiddleEastern","NorthAmerican","Other","SouthAmerican"]);
    fillSelect("ethnicity", ["Non-Hispanic","Others","Hispanic"]);
  }
}

function fillSelect(id, values) {
  const sel = document.getElementById(id);
  sel.innerHTML = "";
  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = (LABELS[id] && LABELS[id][v]) || v;
    sel.appendChild(opt);
  });
}

// ----- Formdan istek gövdesi topla -----
function collectPayload() {
  const val = (id) => document.getElementById(id).value;
  const num = (id) => Number(val(id));
  return {
    lead_time: num("lead_time"),
    age: num("age"),
    appt_num: num("appt_num"),
    total_cancellations: num("total_cancellations"),
    total_rescheduled: num("total_rescheduled"),
    total_success_appointments: num("total_success_appointments"),
    is_repeat: document.getElementById("is_repeat").checked ? 1 : 0,
    day_of_week: num("day_of_week"),
    week_of_month: num("week_of_month"),
    month: num("month"),
    hour_of_day: num("hour_of_day"),
    appt_type: val("appt_type"),
    ethnicity: val("ethnicity"),
    race: val("race"),
    clinic: val("clinic"),
  };
}

// ----- Örnek doldur -----
function applyExample(key) {
  const ex = EXAMPLES[key];
  for (const [k, v] of Object.entries(ex)) {
    const el = document.getElementById(k);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(v);
    else el.value = v;
  }
}

// ----- Risk bandına göre renk/etiket -----
function bandStyle(band) {
  if (band === "Yüksek") return { color: "var(--coral)", cls: "high" };
  if (band === "Orta")   return { color: "var(--amber)", cls: "mid" };
  return { color: "var(--green)", cls: "low" };
}

function verdictText(band, pct, willFlag) {
  if (band === "Yüksek")
    return `Bu hasta <b>yüksek no-show riski</b> taşıyor (%${pct}). Hatırlatma önceliklendirilmeli — aşağıdan bir mesaj oluşturabilirsin.`;
  if (band === "Orta")
    return `<b>Orta düzey risk</b> (%${pct}). Nazik bir hatırlatma faydalı olur.`;
  return willFlag
    ? `Düşük ama eşik üstü risk (%${pct}). İstersen hatırlatma gönderebilirsin.`
    : `<b>Düşük risk</b> (%${pct}). Ek hatırlatmaya gerek görünmüyor.`;
}

// ----- Gauge güncelle -----
function updateGauge(pct, band) {
  const fill = document.getElementById("gauge-fill");
  const { color } = bandStyle(band);
  const offset = GAUGE_LEN * (1 - Math.min(pct, 100) / 100);
  fill.style.stroke = color;
  // reflow tetikle ki animasyon her seferinde çalışsın
  fill.getBoundingClientRect();
  fill.style.strokeDashoffset = offset;

  document.getElementById("gauge-percent").textContent = `%${pct}`;
  document.getElementById("gauge-percent").style.color = color;
  document.getElementById("gauge-band").textContent = band + " risk";
}

// ----- Tahmin -----
async function predict(e) {
  e.preventDefault();
  const btn = document.getElementById("predict-btn");
  setLoading(btn, true);

  const payload = collectPayload();
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    lastResult = {
      ...data,
      patient_name: document.getElementById("patient_name").value.trim() || "Değerli hastamız",
      clinic: document.getElementById("clinic").value,
      appt_type: document.getElementById("appt_type").value,
      lead_time: payload.lead_time,
    };

    showResult(data);
  } catch (err) {
    alert("Tahmin alınamadı. API uyanıyor olabilir (ilk istek ~50 sn). Birkaç saniye sonra tekrar dene.");
    console.error(err);
  } finally {
    setLoading(btn, false);
  }
}

function showResult(data) {
  document.getElementById("result-empty").hidden = true;
  document.getElementById("result-content").hidden = false;

  const pct = data.noshow_percent;
  const band = data.risk_band;
  updateGauge(pct, band);

  const v = document.getElementById("verdict");
  const { cls } = bandStyle(band);
  v.className = "verdict " + cls;
  v.innerHTML = verdictText(band, pct, data.will_flag);

  // mesaj alanını sıfırla
  document.getElementById("ai-message").hidden = true;
}

// ----- Gemini mesajı -----
async function generateMessage() {
  if (!lastResult) return;
  const btn = document.getElementById("msg-btn");
  setLoading(btn, true);

  const body = {
    patient_name: lastResult.patient_name,
    risk_band: lastResult.risk_band,
    noshow_percent: lastResult.noshow_percent,
    clinic: LABELS.clinic[lastResult.clinic] || lastResult.clinic,
    appt_type: LABELS.appt_type[lastResult.appt_type] || lastResult.appt_type,
    lead_time: lastResult.lead_time,
    tone: currentTone,
  };

  try {
    const res = await fetch(`${API_BASE}/generate-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    const data = await res.json();
    const box = document.getElementById("ai-message");
    document.getElementById("ai-message-text").textContent = data.message;
    box.hidden = false;
  } catch (err) {
    const box = document.getElementById("ai-message");
    document.getElementById("ai-message-text").textContent =
      "Mesaj oluşturulamadı. API anahtarı veya bağlantı sorunu olabilir. Birkaç saniye sonra tekrar dene.";
    box.hidden = false;
    console.error(err);
  } finally {
    setLoading(btn, false);
  }
}

// ----- Yardımcılar -----
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector(".btn-label").style.opacity = loading ? ".6" : "1";
  btn.querySelector(".btn-spinner").hidden = !loading;
}

function copyMessage() {
  const text = document.getElementById("ai-message-text").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const b = document.getElementById("copy-btn");
    const old = b.textContent;
    b.textContent = "Kopyalandı ✓";
    setTimeout(() => (b.textContent = old), 1500);
  });
}

// ----- Bağlantılar -----
document.addEventListener("DOMContentLoaded", () => {
  loadSchema();
  document.getElementById("patient-form").addEventListener("submit", predict);
  document.getElementById("msg-btn").addEventListener("click", generateMessage);
  document.getElementById("copy-btn").addEventListener("click", copyMessage);

  document.querySelectorAll("[data-example]").forEach((b) =>
    b.addEventListener("click", () => applyExample(b.dataset.example))
  );

  document.querySelectorAll(".tone").forEach((t) =>
    t.addEventListener("click", () => {
      document.querySelectorAll(".tone").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      currentTone = t.dataset.tone;
    })
  );
});
