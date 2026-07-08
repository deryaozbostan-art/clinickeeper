/* ClinicKeeper — Supabase kimlik doğrulama katmanı
   Bu dosya app.js'ten ÖNCE yüklenmeli. Mevcut panel kodunu değiştirmez,
   sadece giriş yapılana kadar panelin görünmesini engeller. */

const SUPABASE_URL = "https://ksqloluyakgedwrnxxwu.supabase.co";
const SUPABASE_KEY = "sb_publishable_HR00KwXHbmiQI92zEk9Bzw_MAvNCnx6";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authScreen = document.getElementById("auth-screen");
const appContent = document.getElementById("app-content");

function showApp(user) {
  authScreen.hidden = true;
  appContent.hidden = false;
  const label = document.getElementById("user-email-label");
  if (label) label.textContent = user?.email || "";
}
function showAuth() {
  authScreen.hidden = false;
  appContent.hidden = true;
}

/* Giriş / Kayıt sekme geçişi */
document.querySelectorAll("[data-authtab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-authtab]").forEach(b => b.classList.toggle("active", b === btn));
    document.getElementById("login-form").hidden = btn.dataset.authtab !== "login";
    document.getElementById("register-form").hidden = btn.dataset.authtab !== "register";
  });
});

function setAuthLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector(".btn-label").style.opacity = loading ? ".6" : "1";
  btn.querySelector(".btn-spinner").hidden = !loading;
}

/* Giriş yap */
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");
  errEl.hidden = true;
  const btn = document.getElementById("login-btn");
  setAuthLoading(btn, true);

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  setAuthLoading(btn, false);

  if (error) {
    errEl.textContent = "Giriş başarısız: e-posta veya şifre hatalı.";
    errEl.hidden = false;
    return;
  }
  showApp(data.user);
});

/* Kayıt ol */
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const klinik_adi = document.getElementById("register-klinik").value.trim();
  const sube = document.getElementById("register-sube").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const errEl = document.getElementById("register-error");
  const okEl = document.getElementById("register-success");
  errEl.hidden = true;
  okEl.hidden = true;
  const btn = document.getElementById("register-btn");
  setAuthLoading(btn, true);

  const { data, error } = await sb.auth.signUp({ email, password });

  if (error) {
    setAuthLoading(btn, false);
    errEl.textContent = "Kayıt başarısız: " + (error.message || "bilinmeyen hata.");
    errEl.hidden = false;
    return;
  }

  /* clinics tablosuna klinik bilgisini kaydet */
  if (data.user) {
    const { error: dbError } = await sb.from("clinics").insert({
      user_id: data.user.id,
      klinik_adi,
      sube: sube || null
    });
    if (dbError) console.error("Klinik kaydı eklenemedi:", dbError);
  }

  setAuthLoading(btn, false);

  if (data.session) {
    /* e-posta onayı kapalıysa oturum direkt açılır */
    showApp(data.user);
  } else {
    okEl.textContent = "Kayıt başarılı! E-postana gelen onay linkine tıkladıktan sonra giriş yapabilirsin.";
    okEl.hidden = false;
  }
});

/* Çıkış yap */
document.getElementById("logout-btn").addEventListener("click", async () => {
  await sb.auth.signOut();
  showAuth();
});

/* Sayfa açıldığında oturum kontrolü */
sb.auth.getSession().then(({ data }) => {
  if (data.session) {
    showApp(data.session.user);
  } else {
    showAuth();
  }
});
