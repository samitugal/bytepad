# Sprint 31: Image Support in Notes

## Overview
Add ability to include and view images in notes.

## Status: COMPLETED ✅
- Completed: 2026-01-11

## Tasks

### 1. Image Paste/Drop [HIGH] ✅
- [x] Paste images from clipboard
- [x] Drag & drop image files
- [x] Convert to base64 for storage

### 2. Image Storage [HIGH] ✅
- [x] Strategy: Base64 embedded in note content
- [x] Handle large images (5MB size limit with alert)
- [x] Images stored as standard Markdown: ![alt](data:...)

### 3. Image Preview [MEDIUM] ✅
- [x] Render images in preview mode
- [x] Styled with border and max-height (400px)
- [x] Click to view full size (opens in new tab)
- [x] Alt text displayed as caption
- [x] Lazy loading enabled for performance

### 4. Image Markdown Syntax [MEDIUM] ✅
- [x] Support standard markdown: ![alt](url)
- [x] Support base64 images: ![alt](data:image/...)

## Implementation Details
- Images pasted or dropped are converted to base64
- Maximum file size: 5MB
- Cursor positioned after inserted image
- Images clickable to view full size
- Alt text from filename shown as caption

## Acceptance Criteria
- [x] Images can be pasted/dropped into notes
- [x] Images render correctly in preview
- [x] Images persist across sessions (stored in note content)
