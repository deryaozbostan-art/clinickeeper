// 15 Hastalık Örnek Veri Seti
const mockPatients = [
    {
        id: 1,
        name: "Ahmet Yılmaz",
        age: 45,
        distance: 12.5, // km
        daysInAdvance: 25,
        daysSinceLastVisit: 180,
        fee: 250, // £
        time: "10:30",
        clinicType: "Dental",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 2,
        name: "Ayşe Demir",
        age: 32,
        distance: 1.8,
        daysInAdvance: 3,
        daysSinceLastVisit: 15,
        fee: 60,
        time: "14:00",
        clinicType: "GP",
        appointmentType: "Kontrol"
    },
    {
        id: 3,
        name: "Mehmet Kaya",
        age: 68,
        distance: 15.2,
        daysInAdvance: 30,
        daysSinceLastVisit: 210,
        fee: 120,
        time: "09:15",
        clinicType: "Physiotherapy",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 4,
        name: "Fatma Şahin",
        age: 28,
        distance: 7.5,
        daysInAdvance: 12,
        daysSinceLastVisit: 45,
        fee: 80,
        time: "11:45",
        clinicType: "GP",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 5,
        name: "Can Öztürk",
        age: 19,
        distance: 22.0,
        daysInAdvance: 5,
        daysSinceLastVisit: 310,
        fee: 150,
        time: "15:30",
        clinicType: "Dermatology",
        appointmentType: "Kontrol"
    },
    {
        id: 6,
        name: "Elif Yıldız",
        age: 50,
        distance: 3.5,
        daysInAdvance: 2,
        daysSinceLastVisit: 20,
        fee: 200,
        time: "08:30",
        clinicType: "Dental",
        appointmentType: "Kontrol"
    },
    {
        id: 7,
        name: "Mustafa Çelik",
        age: 37,
        distance: 11.2,
        daysInAdvance: 18,
        daysSinceLastVisit: 120,
        fee: 90,
        time: "13:15",
        clinicType: "GP",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 8,
        name: "Zeynep Arslan",
        age: 29,
        distance: 2.1,
        daysInAdvance: 1,
        daysSinceLastVisit: 10,
        fee: 75,
        time: "16:00",
        clinicType: "Dermatology",
        appointmentType: "Kontrol"
    },
    {
        id: 9,
        name: "Ali Koç",
        age: 55,
        distance: 13.8,
        daysInAdvance: 22,
        daysSinceLastVisit: 165,
        fee: 180,
        time: "10:00",
        clinicType: "Dental",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 10,
        name: "Merve Bulut",
        age: 42,
        distance: 5.5,
        daysInAdvance: 15,
        daysSinceLastVisit: 85,
        fee: 110,
        time: "11:00",
        clinicType: "Physiotherapy",
        appointmentType: "Kontrol"
    },
    {
        id: 11,
        name: "Emre Can",
        age: 31,
        distance: 24.5,
        daysInAdvance: 8,
        daysSinceLastVisit: 240,
        fee: 320,
        time: "14:30",
        clinicType: "Dermatology",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 12,
        name: "Yasemin Aksoy",
        age: 26,
        distance: 0.9,
        daysInAdvance: 2,
        daysSinceLastVisit: 30,
        fee: 50,
        time: "09:45",
        clinicType: "GP",
        appointmentType: "Kontrol"
    },
    {
        id: 13,
        name: "Burak Yurt",
        age: 35,
        distance: 8.5,
        daysInAdvance: 28,
        daysSinceLastVisit: 60,
        fee: 130,
        time: "15:15",
        clinicType: "Dental",
        appointmentType: "Yeni Hasta"
    },
    {
        id: 14,
        name: "Sevim Kara",
        age: 72,
        distance: 4.8,
        daysInAdvance: 4,
        daysSinceLastVisit: 15,
        fee: 95,
        time: "12:00",
        clinicType: "Physiotherapy",
        appointmentType: "Kontrol"
    },
    {
        id: 15,
        name: "Hakan Güler",
        age: 48,
        distance: 18.0,
        daysInAdvance: 35,
        daysSinceLastVisit: 195,
        fee: 280,
        time: "16:15",
        clinicType: "Dental",
        appointmentType: "Yeni Hasta"
    }
];

// Uygulama Durumu (State)
let patients = [];
let activeFilters = {
    search: '',
    risk: 'all',
    clinic: 'all'
};
let selectedPatientForReminder = null;

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Uygulama Başlangıç Ayarları
function initApp() {
    // Verileri yükle ve risk skorlarını hesapla
    patients = mockPatients.map(p => {
        const riskAnalysis = calculateRisk(p);
        return {
            ...p,
            riskScore: riskAnalysis.score,
            riskLevel: riskAnalysis.level,
            riskReasons: riskAnalysis.reasons
        };
    });

    // İstatistikleri hesapla ve arayüzü çiz
    updateDashboard();

    // Event Listener'ları ekle
    setupEventListeners();
    
    // API Ayarlarını kontrol et ve yükle
    loadAPISettings();
}

// Risk Hesaplama Motoru (Kural Tabanlı)
function calculateRisk(patient) {
    let score = 0;
    let reasons = [];

    // 1. Kliniğe Uzaklık Faktörü
    if (patient.distance > 10) {
        score += 25;
        reasons.push({ text: "Kliniğe uzaklık fazla (10 km üzeri)", weight: 25 });
    } else if (patient.distance > 5) {
        score += 15;
        reasons.push({ text: "Kliniğe uzaklık orta (5-10 km arası)", weight: 15 });
    } else if (patient.distance > 2) {
        score += 5;
    }

    // 2. Randevunun Kaç Gün Önceden Alındığı Faktörü
    if (patient.daysInAdvance > 20) {
        score += 25;
        reasons.push({ text: "Randevu çok önceden alınmış (20+ gün)", weight: 25 });
    } else if (patient.daysInAdvance > 10) {
        score += 15;
        reasons.push({ text: "Randevu önceden alınmış (10-20 gün arası)", weight: 15 });
    } else if (patient.daysInAdvance > 5) {
        score += 5;
    }

    // 3. Son Ziyaretten Bu Yana Geçen Gün Faktörü
    if (patient.daysSinceLastVisit > 150) {
        score += 25;
        reasons.push({ text: "Son ziyaretten uzun süre geçmiş (150+ gün)", weight: 25 });
    } else if (patient.daysSinceLastVisit > 90) {
        score += 15;
        reasons.push({ text: "Son ziyaretten bu yana zaman geçmiş (90+ gün)", weight: 15 });
    } else if (patient.daysSinceLastVisit > 30) {
        score += 5;
    }

    // 4. Muayene Ücreti Faktörü (Hafif artış)
    if (patient.fee > 200) {
        score += 10;
        reasons.push({ text: "Yüksek muayene ücreti (£200+)", weight: 10 });
    } else if (patient.fee > 100) {
        score += 5;
    }

    // 5. Randevu / Hasta Tipi Faktörü
    if (patient.appointmentType === "Yeni Hasta") {
        score += 15;
        reasons.push({ text: "Yeni hasta kaydı", weight: 15 });
    } else {
        score += 5; // Kontrol hastası için çok az ek
    }

    // Skoru 100 ile sınırla
    score = Math.min(score, 100);

    // Seviye belirleme
    let level = "low";
    if (score >= 70) {
        level = "high";
    } else if (score >= 40) {
        level = "medium";
    }

    // Sebepleri ağırlıklarına göre sıralayıp metinleştirme
    reasons.sort((a, b) => b.weight - a.weight);
    const topReasonsText = reasons.slice(0, 2).map(r => r.text).join(" + ") || "Standart no-show risk profili";

    return {
        score: score,
        level: level,
        reasons: topReasonsText
    };
}

// İstatistikleri ve Listeyi Güncelle
function updateDashboard() {
    // 1. İstatistik Hesaplamaları
    const totalPatients = patients.length;
    const highRiskCount = patients.filter(p => p.riskLevel === "high").length;
    
    const sumRisk = patients.reduce((acc, curr) => acc + curr.riskScore, 0);
    const avgRisk = totalPatients > 0 ? Math.round(sumRisk / totalPatients) : 0;

    // 2. İstatistikleri DOM'a yaz
    document.getElementById('val-total-patients').textContent = totalPatients;
    document.getElementById('val-high-risk').textContent = highRiskCount;
    document.getElementById('val-avg-risk').textContent = `${avgRisk}%`;

    // 3. Listeyi filtrele, sırala ve çiz
    renderPatientList();
}

// Listeyi Render Etme Fonksiyonu
function renderPatientList() {
    const listContainer = document.getElementById('patient-list');
    
    // Filtreleme işlemleri
    let filtered = patients.filter(p => {
        // İsim arama
        const matchesSearch = p.name.toLowerCase().includes(activeFilters.search.toLowerCase());
        
        // Risk seviyesi filtresi
        const matchesRisk = activeFilters.risk === 'all' || p.riskLevel === activeFilters.risk;
        
        // Klinik tipi filtresi
        const matchesClinic = activeFilters.clinic === 'all' || p.clinicType === activeFilters.clinic;

        return matchesSearch && matchesRisk && matchesClinic;
    });

    // Risk skoruna göre yüksekten düşüğe sırala
    filtered.sort((a, b) => b.riskScore - a.riskScore);

    // Sayacı güncelle
    document.getElementById('list-count').textContent = filtered.length;

    // Boş durum kontrolü
    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h3>Uyuşan Hasta Bulunamadı</h3>
                <p>Seçtiğiniz filtrelere veya arama kriterine uygun hasta kaydı bulunmuyor.</p>
            </div>
        `;
        return;
    }

    // Kartları oluştur
    listContainer.innerHTML = filtered.map(p => {
        let riskClass = "risk-low-style";
        let riskLabel = "Düşük Risk";
        if (p.riskLevel === "high") {
            riskClass = "risk-high-style";
            riskLabel = "Yüksek Risk";
        } else if (p.riskLevel === "medium") {
            riskClass = "risk-medium-style";
            riskLabel = "Orta Risk";
        }

        const showMessageButton = p.riskLevel === "high" || p.riskLevel === "medium";
        const buttonHTML = showMessageButton 
            ? `<button class="btn btn-primary btn-sm reminder-trigger" data-id="${p.id}">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Hatırlatma Mesajı Üret
               </button>`
            : `<span class="text-muted"><i class="fa-solid fa-circle-check text-teal"></i> Hatırlatma Gerekmiyor</span>`;

        return `
            <article class="patient-card ${riskClass}">
                <div class="card-header">
                    <div class="patient-name-info">
                        <h4>${p.name}</h4>
                        <div class="patient-meta-row">
                            <span><i class="fa-solid fa-user"></i> ${p.age} Yaş</span>
                            <span><i class="fa-solid fa-hospital"></i> ${p.clinicType}</span>
                            <span><i class="fa-solid fa-clipboard-question"></i> ${p.appointmentType}</span>
                        </div>
                    </div>
                    <div class="risk-badge">
                        <span class="score">${p.riskScore}</span>
                        <span class="label">${riskLabel}</span>
                    </div>
                </div>

                <div class="card-details-grid">
                    <div class="detail-item">
                        <span class="label">Randevu Saati</span>
                        <span class="value">${p.time}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Kliniğe Uzaklık</span>
                        <span class="value">${p.distance} km</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Rezervasyon Öncesi</span>
                        <span class="value">${p.daysInAdvance} gün önce</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Son Ziyaret</span>
                        <span class="value">${p.daysSinceLastVisit} gün önce</span>
                    </div>
                    <div class="detail-item" style="grid-column: span 2">
                        <span class="label">Muayene Ücreti</span>
                        <span class="value">£${p.fee}</span>
                    </div>
                </div>

                <div class="risk-reasons-box ${p.riskLevel}-reasons">
                    <div class="reasons-title">
                        <i class="fa-solid fa-circle-info"></i> Risk Faktörleri:
                    </div>
                    <div class="reasons-text">${p.riskReasons}</div>
                </div>

                <div class="card-footer">
                    ${buttonHTML}
                </div>
            </article>
        `;
    }).join('');

    // Kartlar oluştuktan sonra "Mesaj Üret" butonlarına tıklandığında modalı açacak listener'lar
    document.querySelectorAll('.reminder-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const patientId = parseInt(e.currentTarget.getAttribute('data-id'));
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                openReminderModal(patient);
            }
        });
    });
}

// Event Listeners Kurulumu
function setupEventListeners() {
    // 1. Arama Çubuğu
    document.getElementById('search-input').addEventListener('input', (e) => {
        activeFilters.search = e.target.value;
        renderPatientList();
    });

    // 2. Risk Filtresi
    document.getElementById('filter-risk').addEventListener('change', (e) => {
        activeFilters.risk = e.target.value;
        renderPatientList();
    });

    // 3. Klinik Filtresi
    document.getElementById('filter-clinic').addEventListener('change', (e) => {
        activeFilters.clinic = e.target.value;
        renderPatientList();
    });

    // 4. Modalları Kapatma Eventleri
    document.getElementById('close-settings-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('close-reminder-btn').addEventListener('click', closeReminderModal);

    // Dışarı tıklayınca modal kapatma
    window.addEventListener('click', (e) => {
        const settingsModal = document.getElementById('settings-modal');
        const reminderModal = document.getElementById('reminder-modal');
        if (e.target === settingsModal) closeSettingsModal();
        if (e.target === reminderModal) closeReminderModal();
    });

    // 5. Gemini Ayarlar Paneli Tetikleyici
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);

    // 6. Gemini Ayarlar Butonları
    document.getElementById('save-settings-btn').addEventListener('click', saveAPISettings);
    document.getElementById('clear-settings-btn').addEventListener('click', clearAPISettings);
    document.getElementById('toggle-key-visibility').addEventListener('click', toggleAPIKeyVisibility);

    // 7. Hatırlatıcı Butonları
    document.getElementById('copy-message-btn').addEventListener('click', copyReminderMessage);
}

// API Ayarları Yönetimi
function loadAPISettings() {
    const savedKey = localStorage.getItem('gemini_api_key');
    const statusDiv = document.getElementById('api-status');
    const settingsBtn = document.getElementById('settings-btn');
    
    if (savedKey) {
        document.getElementById('api-key-input').value = savedKey;
        statusDiv.className = "status-indicator success";
        statusDiv.innerHTML = `<i class="fa-solid fa-circle-check"></i> Gemini API Anahtarı kayıtlı. Mesajlar gerçek AI ile üretilecek.`;
        settingsBtn.classList.remove('btn-secondary');
        settingsBtn.classList.add('btn-primary');
        settingsBtn.querySelector('span').textContent = "API Aktif";
    } else {
        document.getElementById('api-key-input').value = '';
        statusDiv.className = "status-indicator";
        statusDiv.style.display = "none";
        settingsBtn.classList.remove('btn-primary');
        settingsBtn.classList.add('btn-secondary');
        settingsBtn.querySelector('span').textContent = "Gemini API Ayarı";
    }
}

function saveAPISettings() {
    const keyInput = document.getElementById('api-key-input').value.trim();
    if (keyInput) {
        localStorage.setItem('gemini_api_key', keyInput);
        loadAPISettings();
        closeSettingsModal();
    } else {
        alert("Lütfen geçerli bir API anahtarı girin veya 'Anahtarı Sil' butonunu kullanın.");
    }
}

function clearAPISettings() {
    localStorage.removeItem('gemini_api_key');
    loadAPISettings();
    closeSettingsModal();
}

function toggleAPIKeyVisibility() {
    const input = document.getElementById('api-key-input');
    const icon = document.querySelector('#toggle-key-visibility i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

// Modal Açma/Kapatma Fonksiyonları
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    loadAPISettings();
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function openReminderModal(patient) {
    selectedPatientForReminder = patient;
    const modal = document.getElementById('reminder-modal');
    
    // Hasta bilgilerini modal içerisine yerleştir
    document.getElementById('modal-patient-name').textContent = patient.name;
    document.getElementById('modal-patient-details').textContent = `${patient.age} Yaş | ${patient.clinicType} (${patient.appointmentType})`;
    
    const riskBadge = document.getElementById('modal-patient-risk-badge');
    riskBadge.textContent = `${patient.riskScore}% - ${patient.riskLevel === 'high' ? 'Yüksek Risk' : 'Orta Risk'}`;
    riskBadge.className = `badge risk-${patient.riskLevel}-style`;
    
    // Mesaj alanını temizle
    const textArea = document.getElementById('reminder-text-area');
    textArea.value = "";
    textArea.style.display = "none";
    
    // Status göster
    const aiStatus = document.getElementById('ai-generation-status');
    aiStatus.className = "ai-status-box show";
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Mesaj Üretim Sürecini Başlat
    generateReminderMessage(patient);
}

function closeReminderModal() {
    const modal = document.getElementById('reminder-modal');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    selectedPatientForReminder = null;
}

// AI Mesaj Üretimi Karar & Çağrı Mekanizması
async function generateReminderMessage(patient) {
    const apiKey = localStorage.getItem('gemini_api_key');
    const textArea = document.getElementById('reminder-text-area');
    const aiStatus = document.getElementById('ai-generation-status');
    
    if (apiKey) {
        // Gerçek Gemini API'sine istek at
        try {
            const prompt = `Sen bir klinik randevu asistanısın. Aşağıdaki bilgilere sahip hasta için nazik, sıcak, profesyonel ve hastayı kliniğe gelmeye teşvik eden Türkçe bir randevu hatırlatma mesajı yaz.
Hasta Adı: ${patient.name}
Randevu Saati: ${patient.time}
Klinik Tipi: ${patient.clinicType} (Tüm randevularımız ve muayenelerimiz bu branşa özeldir)
Randevu Tipi: ${patient.appointmentType} (Yeni Kayıt / Rutin Kontrol)
Hastanın kliniğe uzaklığı: ${patient.distance} km
Son ziyaretten beri geçen gün sayısı: ${patient.daysSinceLastVisit} gün (Uzun bir süre geçtiğini hatırlatıp gelmesini önemle teşvik et)
Kurallar:
1. Hitap samimi, saygılı ve nazik olmalı ("Sayın ${patient.name}" veya "${patient.name} Hanım/Bey" şeklinde).
2. Randevu saati olan ${patient.time} belirtilmeli.
3. Branşa özel bir detay ekle (örn. Dental ise ağız sağlığı, Dermatoloji ise cilt sağlığı, GP ise genel sağlık kontrolü, Fizyoterapi ise ağrısız hareket özgürlüğü gibi).
4. Mesaj doğrudan hastaya gönderilecek bir taslak olmalı. Başında veya sonunda "Tabii, işte mesaj:" gibi ek açıklamalar, başlıklar veya tırnak işaretleri asla yer almamalıdır. Doğrudan mesaj metni ile başla.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error("Gemini API isteği başarısız oldu.");
            }

            const data = await response.json();
            const aiMessage = data.candidates[0].content.parts[0].text.trim();
            
            textArea.value = aiMessage;
            aiStatus.classList.remove('show');
            textArea.style.display = "block";
            
            // WhatsApp Linkini Güncelle
            updateWhatsAppLink(patient.name, aiMessage);
            
        } catch (error) {
            console.error("Gemini API hatası, yerel motora geçiliyor...", error);
            // Hata durumunda yerel akıllı motor devreye girer
            const fallbackMessage = generateLocalTemplateMessage(patient);
            textArea.value = fallbackMessage;
            aiStatus.classList.remove('show');
            textArea.style.display = "block";
            updateWhatsAppLink(patient.name, fallbackMessage);
        }
    } else {
        // API key yoksa doğrudan yerel motoru çağır (simülasyon efekti eklemek için 800ms bekletelim)
        setTimeout(() => {
            const localMessage = generateLocalTemplateMessage(patient);
            textArea.value = localMessage;
            aiStatus.classList.remove('show');
            textArea.style.display = "block";
            updateWhatsAppLink(patient.name, localMessage);
        }, 800);
    }
}

// Yerel Akıllı Mesaj Şablon Motoru (Klinik ve Risk Faktörüne Özel)
function generateLocalTemplateMessage(patient) {
    const isNew = patient.appointmentType === "Yeni Hasta";
    let clinicPhrase = "";
    let reasonPhrase = "";
    
    // Klinik Tipi Uyarlaması
    switch(patient.clinicType) {
        case "Dental":
            clinicPhrase = "sağlıklı ve mutlu bir gülüşe giden yolda ilk adımınızı atmak";
            if (!isNew) clinicPhrase = "rutin ağız ve diş bakımlarınızı tamamlayarak gülüşünüzü korumak";
            break;
        case "GP":
            clinicPhrase = "genel sağlık durumunuzu değerlendirmek ve koruyucu hekimlik kontrollerinizi yapmak";
            break;
        case "Dermatology":
            clinicPhrase = "cildinizin sağlığını incelemek ve size özel bakım önerilerimizi planlamak";
            break;
        case "Physiotherapy":
            clinicPhrase = "fiziksel sağlığınızı desteklemek ve ağrısız, hareketli günlerinize yeniden kavuşmanız için tedavinizi planlamak";
            break;
        default:
            clinicPhrase = "sağlık kontrollerinizi gerçekleştirmek";
    }

    // Risk Faktörü / Son Ziyaret Uyarlaması
    if (patient.daysSinceLastVisit > 150) {
        reasonPhrase = ` Kliniğimize son ziyaretiniz üzerinden ${patient.daysSinceLastVisit} gün geçmiş olduğunu fark ettik. Sağlığınızın takibi ve tedavinizin sürekliliği bizim için çok önemli.`;
    } else if (patient.distance > 10) {
        reasonPhrase = " Ulaşımınız konusunda herhangi bir desteğe ihtiyaç duymanız durumunda bizimle iletişime geçmekten lütfen çekinmeyin, size yardımcı olmaktan memnuniyet duyarız.";
    }

    // Mesaj birleştirme
    let message = `Merhaba ${patient.name},\n\n`;
    
    if (isNew) {
        message += `ClinicKeeper ailesine hoş geldiniz! Yarın saat ${patient.time}'da gerçekleştireceğimiz ${patient.clinicType} bölümündeki randevunuzu sevgiyle hatırlatmak isteriz.`;
        message += ` Bu ilk randevumuzda, ${clinicPhrase} için heyecanla sizi bekliyoruz.`;
    } else {
        message += `Yarın saat ${patient.time}'da gerçekleştireceğimiz ${patient.clinicType} randevunuzu nazikçe hatırlatmak isteriz.`;
        message += ` Randevumuzda, ${clinicPhrase} için hazırız.`;
    }

    if (reasonPhrase) {
        message += reasonPhrase;
    }

    message += `\n\nHerhangi bir program değişikliği durumunda randevunuzu iptal etmek veya ertelemek için en az 4 saat öncesinden bizimle iletişime geçmenizi rica ederiz. Böylece size veya ihtiyacı olan başka bir hastamıza yardımcı olabiliriz.\n\nSağlıklı günler dileriz.\nClinicKeeper Ekibi`;

    return message;
}

// WhatsApp Gönderim Linki Oluşturma
function updateWhatsAppLink(patientName, message) {
    const formattedPhone = "905000000000"; // Temsili numara
    const encodedMessage = encodeURIComponent(message);
    const whatsappBtn = document.getElementById('whatsapp-send-btn');
    whatsappBtn.href = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
}

// Mesajı Panoya Kopyalama
function copyReminderMessage() {
    const textArea = document.getElementById('reminder-text-area');
    textArea.select();
    textArea.setSelectionRange(0, 99999); // Mobil için
    
    try {
        navigator.clipboard.writeText(textArea.value);
        const copyBtn = document.getElementById('copy-message-btn');
        const origHTML = copyBtn.innerHTML;
        
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Kopyalandı!`;
        copyBtn.classList.remove('btn-secondary');
        copyBtn.classList.add('btn-primary');
        
        setTimeout(() => {
            copyBtn.innerHTML = origHTML;
            copyBtn.classList.remove('btn-primary');
            copyBtn.classList.add('btn-secondary');
        }, 2000);
    } catch (err) {
        console.error("Panoya kopyalama başarısız oldu: ", err);
    }
}
