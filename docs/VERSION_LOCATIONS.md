# Version Locations

Bu dosya, bytepad versiyonunun güncellenmesi gereken tüm lokasyonları listeler.
Yeni versiyon çıkarken bu listeyi kontrol et.

---

## Ana Dosyalar

| Dosya | Satır/Alan | Açıklama |
|-------|------------|----------|
| `package.json` | `"version": "x.x.x"` | Ana paket versiyonu |
| `package-lock.json` | `"version": "x.x.x"` | Lock dosyası (npm install ile güncellenir) |
| `README.md` | Badge: `version-x.x.x-green` | GitHub badge |

---

## UI Komponentleri

| Dosya | Satır/Alan | Açıklama |
|-------|------------|----------|
| `src/components/layout/StatusBar.tsx` | `<span>bytepad vX.X.X</span>` | Alt durum çubuğu (sağ) |
| `src/components/common/SettingsPanel.tsx` | `<span>bytepad vX.X.X</span>` | Settings modal footer |

---

## Servisler

| Dosya | Satır/Alan | Açıklama |
|-------|------------|----------|
| `src/services/updateService.ts` | `const CURRENT_VERSION = 'x.x.x'` | Update checker için mevcut versiyon |

---

## Electron / MCP Server

| Dosya | Satır/Alan | Açıklama |
|-------|------------|----------|
| `electron/server/mcp/index.ts` | `version: 'x.x.x'` | MCP Server info |
| `electron/services/dockerService.ts` | `const IMAGE_TAG = 'x.x.x'` | Docker image tag |

---

## Docker

| Dosya | Satır/Alan | Açıklama |
|-------|------------|----------|
| `docker-compose.yml` | `image: bytepad/mcp-server:x.x.x` | Docker image tag |
| `docker/mcp-server/Dockerfile` | `LABEL version="x.x.x"` | Image label |
| `docker/mcp-server/package.json` | `"version": "x.x.x"` | Docker MCP server paket versiyonu |
| `docker/mcp-server/src/routes.ts` | `version: 'x.x.x'` | Health endpoint response |
| `docker/mcp-server/src/server.ts` | `version: ... \|\| 'x.x.x'` | Health endpoint fallback |

---

## Versiyon Güncelleme Adımları

```bash
# 1. Tüm dosyaları güncelle (yukarıdaki listeye göre)

# 2. package-lock.json'u güncelle
npm install --package-lock-only

# 3. Lint ve build kontrolü
npm run lint
npm run build

# 4. Commit
git add -A
git commit -m "chore: bump version to X.X.X"

# 5. Tag oluştur
git tag vX.X.X

# 6. Push
git push origin main --tags

# 7. GitHub Release oluştur
gh release create vX.X.X --title "bytepad vX.X.X" --draft --generate-release-notes
```

---

## Hızlı Kontrol Komutu

Tüm versiyon referanslarını bulmak için:

```bash
# Mevcut versiyonu ara (örn: 0.24.2)
grep -r "0\.24\.1" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" --include="*.md" . | grep -v node_modules | grep -v dist
```

---

## Notlar

- `package-lock.json` manuel düzenlenmez, `npm install` ile güncellenir
- `electron/server/routes/health.ts` dinamik olarak `process.env.npm_package_version` kullanır, manuel güncelleme gerekmez
- Docker image publish edilirse registry'deki tag de güncellenmelidir

---

*Son güncelleme: v0.24.2*
