# Sprint 41: Code Signing (Windows & macOS)

**Goal:** Uygulamayı imzalayarak güvenlik uyarılarını kaldırmak
**Duration:** 2-3 gün (setup) + onay süreleri
**Priority:** HIGH
**Status:** PLANNED

---

## Problem

| Platform | Mevcut Durum |
|----------|--------------|
| Windows | SmartScreen "Windows protected your PC" uyarısı |
| macOS | "unidentified developer" uyarısı, Gatekeeper engeli |

---

## Araştırma Sonuçları

### Windows Seçenekleri

| Seçenek | Maliyet | SmartScreen | Notlar |
|---------|---------|-------------|--------|
| **SignPath Foundation** | **ÜCRETSİZ** | Reputation gerekir | OSS için en iyi seçenek |
| Certum OSS Certificate | $29/yıl | Reputation gerekir | Ucuz alternatif |
| EV Certificate | $200-500/yıl | Anında güvenilir | Pahalı |

### macOS Seçenekleri

| Seçenek | Maliyet | Gatekeeper | Notlar |
|---------|---------|------------|--------|
| **Apple Developer Program** | **$99/yıl** | ✅ Geçer | Tek geçerli yol |
| Fee Waiver (Nonprofit) | Ücretsiz | ✅ Geçer | Sadece tüzel kişilikler |
| Ad-hoc signing | Ücretsiz | ❌ Geçmez | Dağıtım için kullanılamaz |
| 3rd party certificates | - | ❌ Geçmez | Apple kabul etmiyor |

---

## Gerçekçi Değerlendirme

### Windows: SignPath Foundation (ÜCRETSİZ)

**Kaynak:** [signpath.org](https://signpath.org/)

**Avantajlar:**
- Open source projeler için tamamen ücretsiz
- Kişisel kimlik doğrulama gerekmez (Foundation vouches)
- HSM'de güvenli anahtar saklama
- CI/CD entegrasyonu kolay
- GitHub Actions desteği

**Gereksinimler:**
- Açık kaynak proje (GitHub'da public repo)
- Aktif geliştirme
- Build'in repo'dan yapıldığının doğrulanması

**Başvuru süreci:**
1. https://signpath.org/apply adresine git
2. GitHub repo linkini ver
3. Proje bilgilerini doldur
4. Onay bekle (1-2 hafta)

**SmartScreen Reputation:**
- İlk imzalamada hala uyarı gösterebilir
- İndirme sayısı arttıkça reputation oluşur
- EV certificate olmadan anında reputation yok

---

### macOS: Apple Developer Program ($99/yıl)

**Gerçek:** macOS için ücretsiz code signing YOK (bireysel geliştiriciler için)

**Fee Waiver sadece şunlara uygulanır:**
- Resmi kayıtlı nonprofit kuruluşlar
- Akredite eğitim kurumları
- Devlet kurumları

**Bireysel OSS geliştiriciler için seçenekler:**

| Yöntem | Açıklama |
|--------|----------|
| $99 öde | En basit yol |
| GitHub Sponsors | Kullanıcılardan bağış topla |
| Open Collective | Proje için fon topla |
| Nonprofit kur | Uzun vadeli çözüm (karmaşık) |

---

## Önerilen Plan

### Faz 1: Windows - SignPath (Ücretsiz)

**Hemen yapılabilir:**

```bash
# 1. SignPath'e başvur
# https://signpath.org/apply

# 2. Onay gelince GitHub Actions workflow ekle
```

**GitHub Actions entegrasyonu:**
```yaml
# .github/workflows/build.yml
- name: Sign Windows executable
  uses: signpath/github-action-submit-signing-request@v1
  with:
    api-token: ${{ secrets.SIGNPATH_API_TOKEN }}
    organization-id: ${{ secrets.SIGNPATH_ORG_ID }}
    project-slug: bytepad
    signing-policy-slug: release-signing
    artifact-configuration-slug: pe
    input-artifact-path: dist-electron/bytepad-*-win-x64.exe
    output-artifact-path: dist-electron/bytepad-signed.exe
```

### Faz 2: macOS - Apple Developer ($99/yıl)

**Karar gerekli:** $99 ödemeye değer mi?

**Eğer evet:**

1. **Apple Developer kaydı:**
   - https://developer.apple.com/programs/enroll/
   - $99/yıl ödeme

2. **Sertifika oluştur:**
   - Developer ID Application certificate
   - Developer ID Installer certificate (opsiyonel)

3. **electron-builder.yml güncellemesi:**
```yaml
mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  identity: "Developer ID Application: Your Name (TEAM_ID)"

afterSign: scripts/notarize.js
```

4. **Notarization script oluştur:**
```javascript
// scripts/notarize.js
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.bytepad.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

5. **GitHub Secrets ekle:**
   - `APPLE_ID` - Apple hesap email
   - `APPLE_APP_PASSWORD` - App-specific password
   - `APPLE_TEAM_ID` - Developer Team ID
   - `CSC_LINK` - Base64 encoded .p12 certificate
   - `CSC_KEY_PASSWORD` - Certificate password

---

## Alternatif: Sadece Windows

macOS için $99 ödemek istemiyorsan:

1. **Windows:** SignPath ile imzala (ücretsiz)
2. **macOS:** İmzasız bırak, README'ye not ekle:
   ```markdown
   ### macOS Installation
   Since the app is not signed, you need to:
   1. Right-click the app → Open
   2. Click "Open" in the dialog
   ```

Bu birçok popüler OSS projenin yaptığı şey.

---

## Maliyet Özeti

| Platform | Seçenek | Yıllık Maliyet |
|----------|---------|----------------|
| Windows | SignPath Foundation | $0 |
| macOS | Apple Developer | $99 |
| **Toplam** | | **$99/yıl** |

**Sadece Windows:** $0/yıl
**Her ikisi:** $99/yıl

---

## Dosyalar

| Dosya | Aksiyon | Açıklama |
|-------|---------|----------|
| `.github/workflows/build.yml` | MODIFY | SignPath entegrasyonu |
| `electron-builder.yml` | MODIFY | macOS signing config |
| `scripts/notarize.js` | CREATE | Notarization script |
| `build/entitlements.mac.plist` | CREATE | macOS entitlements |

---

## Checklist

### Windows (SignPath)
- [ ] SignPath'e başvur
- [ ] Onay gelene kadar bekle (1-2 hafta)
- [ ] API token al
- [ ] GitHub Secrets ekle
- [ ] Workflow güncelle
- [ ] Test release yap

### macOS (Apple Developer)
- [ ] Karar: $99 ödeyecek miyiz?
- [ ] Apple Developer kaydı
- [ ] Developer ID certificate oluştur
- [ ] Notarization script ekle
- [ ] GitHub Secrets ekle
- [ ] Test release yap

---

## Kaynaklar

- [SignPath Foundation](https://signpath.org/) - Ücretsiz Windows code signing
- [Certum OSS Certificate](https://certum.store/open-source-code-signing-code.html) - $29/yıl alternatif
- [Apple Developer Program](https://developer.apple.com/programs/) - $99/yıl
- [Apple Fee Waiver](https://developer.apple.com/support/membership-fee-waiver/) - Sadece nonprofits
- [electron-builder Code Signing](https://www.electron.build/code-signing) - Electron docs
- [electron/notarize](https://github.com/electron/notarize) - Notarization tool

---

## Sonuç ve Öneri

**Önerim:**

1. **Hemen:** SignPath'e başvur (ücretsiz, 1-2 hafta onay süresi)
2. **Karar ver:** macOS için $99 ödeyecek misin?
   - Evet → Apple Developer kaydı yap
   - Hayır → macOS'u imzasız bırak, README'ye talimat ekle

**Gerçekçi beklenti:**
- Windows SmartScreen uyarısı ilk başta devam edebilir (reputation gerekiyor)
- Tam "uyarısız" deneyim için EV certificate ($300+) veya yüksek indirme sayısı gerekli

---

*Created: v0.24.3*
