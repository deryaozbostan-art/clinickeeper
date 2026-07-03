# ClinicKeeper - Hasta No-Show Risk ve Geri Kazanım Asistanı

ClinicKeeper, özel kliniklerin randevularına gelmeme (no-show) riski yüksek hastalarını önceden tespit etmesini ve bu hastalar için yapay zeka (AI) destekli, kişiselleştirilmiş hatırlatma ve geri kazanım mesajları hazırlamasını sağlayan tek sayfalık modern bir web uygulamasıdır.

## 🚀 Özellikler

- **Dinamik Risk Analizi**: Makine öğrenimi bulgularına dayanan kural tabanlı bir algoritma ile hastaların randevuya gelmeme risk skorlarını (0-100) anlık olarak hesaplar.
- **Akıllı Gruplandırma ve Sıralama**: Hastaları risk düzeylerine göre (Yüksek: Kırmızı, Orta: Sarı, Düşük: Yeşil) gruplandırır ve risk oranına göre yüksekten düşüğe doğru sıralar.
- **İstatistik Paneli**: Toplam hasta sayısı, yüksek risk grubundaki hasta sayısı ve genel ortalama risk skorunu içeren anlık özet bilgileri görüntüler.
- **Gelişmiş Arama ve Filtreleme**: Hasta ismine göre canlı arama yapmayı; risk derecesi ve klinik branş tipine göre filtreleme yapmayı sağlar.
- **Yapay Zeka (AI) Mesaj Üretimi**:
  - **Gemini API Desteği**: Kendi Gemini API Anahtarınızı girerek doğrudan Gemini 2.5 Flash modelinin hastaya özel, branş odaklı ve son derece doğal Türkçe hatırlatma mesajları yazmasını sağlayabilirsiniz.
  - **Yerel Akıllı Şablon Motoru (Fallback)**: API anahtarınız olmasa bile hastanın yaş, klinik branşı, son gelişi ve randevu detaylarını analiz ederek yüksek düzeyde kişiselleştirilmiş profesyonel mesajlar oluşturur.
- **Eylem Odaklı Taslak Onayı**: Üretilen mesajları doktor onayına sunar; düzenleme, panoya kopyalama ve doğrudan WhatsApp üzerinden yönlendirme seçenekleri sunar.
- **Aesthetic UI/UX**: Tıbbi ve kurumsal havaya uygun, Plus Jakarta Sans fontunu kullanan, modern glassmorphism efektleri ve yumuşak mikro geçişler içeren tamamen responsive mobil uyumlu arayüz.

## 📂 Dosya Yapısı

- `index.html` - Uygulamanın temel semantik iskeleti ve modal yapıları.
- `index.css` - UI/UX tasarım kuralları, renk paleti ve animasyonlar.
- `app.js` - Hasta veri tabanı, risk algoritmaları, filtreleme mantığı ve Gemini API entegrasyonu.

## 💻 Nasıl Çalıştırılır?

1. Proje klasöründeki **`index.html`** dosyasını herhangi bir modern web tarayıcısına (Chrome, Edge, Firefox, Safari vb.) sürükleyip bırakarak veya çift tıklayarak doğrudan çalıştırabilirsiniz. Herhangi bir yerel sunucu kurulumuna gerek yoktur.
2. Gerçek Gemini API ile çalışmak isterseniz:
   - Sağ üstteki **"Gemini API Ayarı"** butonuna tıklayın.
   - API anahtarınızı girip **Kaydet** butonuna basın. (Girdiğiniz anahtar tarayıcınızın `localStorage` alanında güvenli bir şekilde saklanır ve harici hiçbir üçüncü şahıs sunucuya gönderilmez.)
