# Version Locations

Bu dosya, bytepad versiyonunun single-source mekanizmasını açıklar.

**Artık elle senkron tutulan bir liste değil, script + CI ile denetlenen bir liste.**
Bir yer güncellemeyi kaçırırsa `npm run check:version` (ve CI'daki karşılığı)
kırmızı döner. Bu dosyanın kendisi de denetlenen lokasyonlardan biri
(aşağıdaki footer).

---

## İki bağımsız versiyon zinciri

Bytepad'de tek değil, **iki** versiyon kaynağı var:

1. **App versiyonu** — kaynak: kök `package.json`'daki `"version"` alanı.
   Masaüstü uygulamasını, web/PWA build'ini ve Electron'un içine gömülü
   MCP server'ı kapsar.
2. **`docker/mcp-server` versiyonu** — kaynak: `docker/mcp-server/package.json`'daki
   `"version"` alanı. **Bilinçli olarak app versiyonundan bağımsız** — bu
   alt proje kendi bağımlılık grafiğine sahip (app'in express 5'ine karşı
   kendi express 4'ü, kendi Docker build context'i), packaged Electron
   build'leri onu hiç içermiyor bile (bkz. `electron/services/dockerService.ts`
   içindeki `IMAGE_NOT_FOUND_MESSAGE` yorumu). App'in her patch'inde bu
   subproject'i de bump etmeye zorlamak, iki bağımsız release döngüsünü
   yapay olarak birbirine kenetlerdi — bunun yerine her ikisi de kendi
   `package.json`'ından beslenen ayrı kaynaklar.

---

## App versiyonu — lokasyonlar

| Dosya | Nasıl | Not |
|-------|-------|-----|
| `package.json` | `"version": "x.x.x"` | **Kaynak.** |
| `src/services/updateService.ts` | — | Artık literal değil. `src/utils/appVersion.ts` üzerinden Electron'da canlı `app.getVersion()`, web'de build-time `__APP_VERSION__` sabiti kullanır. |
| `electron/server/mcp/index.ts` | `app.getVersion()` | Main process içinde çalıştığı için doğrudan canlı okur, literal değil. |
| `src/components/layout/StatusBar.tsx` | `bytepad v{appVersion}` | `src/utils/appVersion.ts` state'inden, literal değil. |
| `src/components/common/SettingsPanel.tsx` | `bytepad v{appVersion}` | Aynı mekanizma. |
| `README.md` | Badge: `version-x.x.x-green` | Manuel literal, `check:version` ile denetlenir. |
| `public/sw.js` | `const APP_VERSION = 'x.x.x'` | Manuel literal. `CACHE_NAME` bundan türer — eski kalırsa cache rotation sessizce çalışmaz (bir kez oldu, bkz. internal issue #20). |
| `SECURITY.md` | `| x.x.x (latest) |` satırı | Diğerlerinden farklı: tam patch değil, **minor seri** (`x.x.x` → `x.x.x` biçiminde ama örn. `0.25.x`) ister. |
| `docs/VERSION_LOCATIONS.md` | Bu dosyanın en altındaki footer | Kendi kendini de takip eder. |

`package-lock.json` **denetlenmiyor** — elle düzenlenmiyor, `npm install --package-lock-only`
ile üretiliyor; onu bir "manuel lokasyon" gibi kontrol etmek npm'in kendi
çıktısını tekrar kontrol etmek olurdu.

## `docker/mcp-server` versiyonu — lokasyonlar

| Dosya | Nasıl | Not |
|-------|-------|-----|
| `docker/mcp-server/package.json` | `"version": "x.x.x"` | **Kaynak.** |
| `docker/mcp-server/Dockerfile` | `LABEL version="x.x.x"` | Manuel literal. Bir tam release boyunca eski kalmıştı — bu yüzden bu dosya var. |
| `docker/mcp-server/src/routes.ts` | `version: 'x.x.x'` | Health endpoint response. |
| `docker/mcp-server/src/server.ts` | `version: 'x.x.x'` (createMCPServer) ve `\|\| 'x.x.x'` (health fallback) | İki ayrı satır, ikisi de denetleniyor. |
| `docker-compose.yml` | `image: bytepad/mcp-server:x.x.x` | |
| `README.md` | Docker Compose örneği içindeki `image:` satırı | Aynı dosyada app badge'i de var — ikisi ayrı regex ile ayrı ayrı denetleniyor. |
| `electron/services/dockerService.ts` | `const IMAGE_TAG = 'x.x.x'` | Electron'un pull/build ettiği image tag'i — packaged build'de subproject kaynak koddan gelmediği için bu literal kalmak zorunda. |

`docker/mcp-server/package-lock.json` da aynı sebeple denetlenmiyor.

---

## Versiyon Güncelleme Adımları

### App versiyonu bump

```bash
# 1. Her yeri güncelle
node scripts/bump-version.js 0.26.0

# 2. package-lock.json'u güncelle
npm install --package-lock-only

# 3. Denetle
npm run check:version
npm run lint
npm run build

# 4. CHANGELOG.md'ye bir giriş ekle

# 5. Commit, tag, push
git add -A
git commit -m "chore: bump version to 0.26.0"
git tag v0.26.0
git push origin main --tags

# 6. GitHub Release oluştur
gh release create v0.26.0 --title "bytepad v0.26.0" --draft --generate-release-notes
```

### `docker/mcp-server` versiyonu bump (bağımsız, sadece gerektiğinde)

```bash
node scripts/bump-mcp-version.js 0.26.0
cd docker/mcp-server && npm install --package-lock-only && cd ../..
npm run check:version
```

---

## CI Guard

`.github/workflows/ci.yml` içindeki **"Version consistency"** adımı her push/PR'da
`npm run check:version` çalıştırır ve **blocking**'dir — bu branch'te zaten
yeşil olduğu için (script + CI ile ilk kez böyle bir denetim var), report-only
yapıp "bir gün blocking yaparız" demek anlamsız; ilk günden blocking.

---

## Notlar

- `electron/server/routes/health.ts` versiyon döndürmüyor (bilinçli — bkz. dosyadaki yorum), bu yüzden listede yok.
- Docker image publish edilirse registry'deki tag de `docker/mcp-server` versiyonuna göre güncellenmelidir.
- `docker/mcp-server/src/server.ts`'teki `process.env.npm_package_version` fallback'i: konteyner `CMD ["node", "dist/server.js"]` ile başlıyor, yani `npm run` üzerinden çalışmıyor — bu env var pratikte hiç set olmuyor ve health endpoint'te fiilen hep literal fallback görünüyor. Bu script'in kapsamı dışında bırakıldı (davranış değişikliği, sadece literal senkronu değil); ayrı bir issue konusu.

---

*Son güncelleme: v0.25.0*
