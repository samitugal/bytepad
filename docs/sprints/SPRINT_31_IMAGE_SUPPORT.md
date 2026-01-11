# Sprint 31: Image Support in Notes

## Overview
Add ability to include and view images in notes.

## Status: CANCELLED ❌
- Cancelled: 2026-01-11

## Cancellation Reason
Image paste/drop feature was cancelled due to **Gist storage limitations**:

1. **Base64 encoding** - Pasted images are converted to base64, which increases file size by ~33%
2. **Gist limits** - GitHub Gist has size limits (~100MB total, but practical limits are much lower)
3. **Data bloat** - A few images could quickly fill the entire Gist storage quota
4. **Sync issues** - Large base64 strings cause slow sync and potential data corruption
5. **Note content pollution** - Base64 strings make note content unreadable in editor

## Alternative Solution
Users can add images via external URLs:

```markdown
![My Image](https://example.com/image.png)
```

External URL images are rendered in preview mode with:
- Max height: 400px
- Click to open full size
- Alt text as caption
- Lazy loading

## Lessons Learned
- Local-first apps with cloud sync need careful consideration of data size
- Base64 image storage is not suitable for text-based sync backends
- Consider dedicated image hosting (Imgur, Cloudinary) for future implementation
