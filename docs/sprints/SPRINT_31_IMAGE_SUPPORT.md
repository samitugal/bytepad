# Sprint 31: Image Support in Notes

## Overview
Add ability to include and view images in notes.

## Status: PLANNED
- Target: 2026-01-17

## Tasks

### 1. Image Paste/Drop [HIGH]
- [ ] Paste images from clipboard
- [ ] Drag & drop image files
- [ ] Convert to base64 or store as blob

### 2. Image Storage [HIGH]
- [ ] Decide storage strategy (base64 in note vs separate storage)
- [ ] Handle large images (compression, size limits)
- [ ] Migrate existing notes if needed

### 3. Image Preview [MEDIUM]
- [ ] Render images in preview mode
- [ ] Thumbnail in edit mode
- [ ] Click to enlarge/view full size

### 4. Image Markdown Syntax [MEDIUM]
- [ ] Support standard markdown: ![alt](url)
- [ ] Support local images: ![alt](local:imageId)

## Acceptance Criteria
- [ ] Images can be pasted/dropped into notes
- [ ] Images render correctly in preview
- [ ] Images persist across sessions
