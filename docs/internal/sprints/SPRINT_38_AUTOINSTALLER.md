# Bytepad – Installer gibi kurulum + otomatik güncelleme (en mantıklı yol: PWA + Service Worker)

Bu doküman, Bytepad’i **“installer ile kurulmuş gibi”** kullanıcı cihazına ekletmek ve **yeni sürümler çıktığında kullanıcıya bildirim gösterip tek tıkla güncelleyebilmek** için en düşük maliyet / en yüksek etki yolunu anlatır: **PWA + Service Worker (Workbox) + In-App Update Banner**.

> Hedef: Kullanıcı bir kez “Install” eder. Sonraki sürümlerde uygulama arka planda yeni dosyaları indirir, kullanıcıya “Yeni sürüm hazır” bildirimi gösterir ve tek tıkla yeni sürüme geçer.  
> Ek hedef: İstersen release notlarını GitHub Releases’ten çekip “What’s new” ekranı gösterebilirsin (opsiyonel).

---

## 0) Ön Koşullar

- Bytepad HTTPS üzerinden servis edilmeli (GitHub Pages / Vercel / Netlify vs).
- Projede bir web build pipeline olmalı (Vite/Next/React vb).
- `manifest.json` ve service worker (SW) altyapısı eklenecek.
- Cache stratejisi “app shell + versioned assets” şeklinde tasarlanacak.

---

## 1) PWA Kurulum Deneyimi (Installer hissi)

### 1.1 Web App Manifest (manifest.json)
Yapılacaklar:
- `name`, `short_name`, `start_url`, `scope`, `display: "standalone"`, `background_color`, `theme_color`
- Farklı boyutlarda icon seti: `192x192`, `512x512` (+ maskable önerilir)

Kontrol listesi:
- [ ] Uygulama “Install” önerisi alıyor (Chrome/Edge)
- [ ] “standalone” modda açılıyor (adres çubuğu yok)
- [ ] Offline açılış en azından “son bilinen shell” ile mümkün

### 1.2 Install CTA (opsiyonel)
- “Install Bytepad” butonu (beforeinstallprompt event’ini yakalayıp)
- Kullanıcıyı rahatsız etmeyecek şekilde sadece uygun zamanda göster

---

## 2) Otomatik Güncelleme Mimarisi (PWA)

### 2.1 Temel Prensip
- Yeni sürüm deploy edildiğinde:
  - Browser SW’yi indirir ve “waiting” state’e alır
  - Mevcut açık tab/uygulama kapanana kadar yeni SW aktif olmaz (default davranış)
- Biz bunu kullanıcı dostu yapacağız:
  - “Yeni sürüm hazır” banner/toast göstereceğiz
  - Kullanıcı tıklayınca `skipWaiting()` ile SW’yi aktif edeceğiz
  - Sonra `reload` ile yeni sürüme geçeceğiz

---

## 3) Service Worker: Workbox ile Kurulum (önerilen)

> Workbox, cache stratejilerini stabil ve temiz kurar. “kendi SW’ni yaz” opsiyonu var ama bakım maliyeti daha fazla.

### 3.1 Workbox Entegrasyonu
Yapılacaklar (genel):
- Build sırasında asset manifest üret (precache)
- SW içinde `precacheAndRoute(self.__WB_MANIFEST)` kullan
- Runtime caching kuralları ekle:
  - API çağrıları: `NetworkFirst` veya `StaleWhileRevalidate`
  - Statik görseller: `CacheFirst`
  - HTML shell: genelde `NetworkFirst` (offline fallback ile)

Kontrol listesi:
- [ ] İlk yüklemede offline cache oluşuyor
- [ ] Yeni deploy sonrası SW update bulunuyor
- [ ] “waiting” state tespit edilebiliyor

---

## 4) “Yeni Sürüm Hazır” Bildirimi (In-App)

### 4.1 UI Davranışı
- SW “waiting” olduğunda uygulama UI’da bir banner göster:
  - “Yeni sürüm hazır. Güncelle” (buton)
  - “Sonra” (dismiss)
- “Güncelle” tıklanınca:
  - SW’ye `SKIP_WAITING` mesajı gönder
  - SW aktif olduğunda `window.location.reload()` çalıştır

### 4.2 Teknik Akış
- App tarafı:
  - `navigator.serviceWorker.register(...)`
  - `registration.addEventListener('updatefound', ...)`
  - `registration.waiting` var mı kontrol et
  - `controllerchange` event’inde reload yap

- SW tarafı:
  - `self.addEventListener('message', ...)` ile `SKIP_WAITING` dinle
  - `self.skipWaiting()` çağır
  - `clients.claim()` ile yeni SW kontrolü alsın

Kontrol listesi:
- [ ] Banner yalnızca gerçekten yeni SW “waiting” olduğunda çıkıyor
- [ ] “Güncelle” tıklayınca yeni sürüme geçiyor
- [ ] Reload sonsuz döngü yapmıyor (controllerchange bir kez tetiklenmeli)

---

## 5) Cache Versiyonlama ve “Eski Sürüm Takılması” Sorunları

Bu kısmı doğru yapmak kritik.

Yapılacaklar:
- Build çıktılarında dosya isimleri hash’li olmalı (ör: `app.8d9a1c.js`)
- HTML entry (`index.html`) güncellendiğinde SW yeni manifest’i görmeli
- API cache stratejilerinde “stale data” riskini yönet:
  - Kullanıcı verileri (gist sync) = network öncelikli
  - UI shell = cache + hızlı açılış

Kontrol listesi:
- [ ] Hard refresh gerektirmeden sürüm geçişi çalışıyor
- [ ] Offline modda “shell” açılıyor
- [ ] Gist sync offline ise uygun hata mesajı var

---

## 6) Sürüm Takibi (Release Notes / Versiyon Gösterimi)

Minimum:
- UI’da bir “Version” alanı göster (build-time env ile)
- Yeni sürüm banner’ında “vX.Y.Z hazır” yaz

Opsiyonel:
- GitHub Releases API’den son release notlarını çekip “What’s new” modal’ı aç
- Bu kısım network bağımlı olacağı için UI graceful degrade yapmalı

Kontrol listesi:
- [ ] Versiyon string’i build ile güncelleniyor
- [ ] “What’s new” yoksa uygulama bozulmuyor

---

## 7) Bildirim Seviyesi 2 (Opsiyonel): Push Notification

> In-app banner çoğu senaryo için yeterli. Push daha agresif ve izin/altyapı ister.

Gerekenler:
- VAPID key
- Push subscription saklama (kullanıcı bazlı)
- Backend: “yeni release” olunca push at
- Kullanıcı izinleri + privacy notları

Öneri:
- İlk etapta yapma. In-app ile başla, ihtiyaç olursa ekle.

---

## 8) Test Planı (Mutlaka)

### 8.1 Lokal/Stage Test
- [ ] İlk kurulum (Install) → standalone açılış
- [ ] Offline açılış testi
- [ ] Yeni deploy:
  - Eski sürüm açıkken yeni deploy et
  - Banner geldi mi?
  - Güncelle tıklayınca yeni sürüm geldi mi?
- [ ] 2 tab açıkken davranış (controllerchange)

### 8.2 Lighthouse
- [ ] PWA audit: installable, manifest, SW, offline

---

## 9) GitHub Actions ile Otomasyon (öneri)

Yapılacaklar:
- main branch’e merge → build → deploy (Pages/Vercel)
- Release tag (vX.Y.Z) atılınca:
  - changelog üret
  - release notes publish et
  - (opsiyonel) app içi “latest version” endpoint’i güncelle

Kontrol listesi:
- [ ] Deploy her merge’de otomatik
- [ ] Version bump süreci net

---

## 10) MVP Yol Haritası

### MVP-1 (1 gün)
- [ ] manifest.json + iconlar
- [ ] SW register + basit precache
- [ ] “Yeni sürüm hazır” banner (skipWaiting + reload)

### MVP-2 (1–2 gün)
- [ ] Workbox’a geçiş
- [ ] Runtime caching kuralları
- [ ] Offline fallback ekranı

### MVP-3 (opsiyonel)
- [ ] Release notes ekranı
- [ ] Push notification altyapısı (gerekiyorsa)

---

## 11) Sonuç

Bu yaklaşım:
- “Installer” hissini PWA install ile verir
- Güncelleme yükünü kullanıcıdan alır (arka planda iner)
- Kullanıcı deneyimini “tek tıkla güncelle”ye indirir
- Bytepad’in privacy-first yaklaşımıyla uyumludur (push gibi izinli işler opsiyonel kalır)

---
