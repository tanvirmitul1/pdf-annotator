# OCR System Documentation

## Overview

The OCR (Optical Character Recognition) system automatically extracts text from images using the kagoj.ai API. It features:

- **Auto-OCR**: Automatically processes images when attached
- **Real-time Progress**: Live status updates during processing
- **Error Handling**: Comprehensive error messages with retry functionality
- **Cancel Support**: Abort ongoing OCR requests
- **Cache Support**: Redis/Database caching for fast repeated lookups
- **Beautiful UI**: Modern, polished interface with visual feedback

## Architecture

```
┌─────────────────────────────────────────────┐
│         User attaches image                  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   useAttachments Hook                        │
│   - Auto-triggers OCR                        │
│   - Manages state (loading/progress/errors)  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   OCR Service (ocr-service.ts)               │
│   - Makes API request to kagoj.ai            │
│   - Handles errors & retries                 │
│   - Parses response                          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   AttachmentPreview Component                │
│   - Shows progress indicators                │
│   - Displays error messages                  │
│   - Retry/Cancel buttons                     │
└─────────────────────────────────────────────┘
```

## Features

### 1. Auto-OCR on Image Attach

When a user selects an image:
1. Image is validated and added to attachments
2. OCR automatically starts processing
3. Progress updates appear in real-time
4. On completion, text is stored in attachment

### 2. Visual States

**Loading State**:
- Pulsing ring around image (primary color)
- Spinning loader icon
- Progress text (e.g., "Sending to OCR service...")
- Cancel button to abort

**Success State**:
- Green checkmark badge
- Green ring around image
- Optional cache badge (⚡ Redis / 💾 Database)

**Error State**:
- Red alert badge
- Red ring around image
- Error message on hover
- Retry button

**Idle State**:
- Normal border
- Hover overlay with OCR button

### 3. Error Handling

**Error Types**:
- `INVALID_FILE`: Unsupported file type
- `TIMEOUT`: Processing took too long (>16 min)
- `NETWORK`: Connection issues or cancellation
- `SERVER`: API service error
- `UNKNOWN`: Unexpected errors

**User Feedback**:
- Clear error messages in plain English
- Specific guidance (e.g., "Try a smaller image")
- Retry button for transient failures
- TraceId included for debugging

### 4. Cache Support

The OCR service supports two-tier caching:
- **Redis** (⚡): Fast in-memory cache, 24hr TTL
- **Database** (💾): Persistent fallback storage

Cache is based on: filename, file size, output type, layout algorithm

Badge indicators show cache hits for transparency.

## UI/UX Design

### Attachment Card States

```
┌────────────────────────┐
│  ┌──────────────────┐  │
│  │                  │  │  ← Image preview
│  │   IMAGE HERE     │  │
│  │                  │  │
│  └──────────────────┘  │
│    [✓]         [⚡]     │  ← Status badges
└────────────────────────┘
    ▲              ▲
    │              └─ Cache badge
    └─ Success badge

┌────────────────────────┐
│  ┌──────────────────┐  │
│  │     [SPINNER]    │  │  ← Loading overlay
│  │  "Processing..."  │  │
│  │      [CANCEL]     │  │
│  └──────────────────┘  │
└────────────────────────┘

┌────────────────────────┐
│  ┌──────────────────┐  │
│  │       [!]        │  │  ← Error overlay
│  │  "OCR failed"     │  │
│  │      [RETRY]      │  │
│  └──────────────────┘  │
└────────────────────────┘
```

### Color System

- **Primary** (Blue): Loading state, OCR running
- **Success** (Green): OCR complete, text extracted
- **Error** (Red): OCR failed, needs retry
- **Cache** (Blue/Purple): Cached result

### Animations

- Smooth ring transitions (200ms)
- Fade-in overlays (opacity 0 → 1)
- Spinner rotation
- Hover lift effect (-translate-y-0.5)

## API Integration

### Endpoint

```
POST https://kagoj.ai/api/ocr/process/v3/
```

### Authentication

```typescript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request

```typescript
FormData {
  file: File
  outputFileType: "txt"
  layoutAlgorithm: "1"
}
```

### Response

**Success** (200):
```
Text content (plain string)

Headers:
- X-Trace-Id: abc123...
- X-Project-Id: project_001
- X-Cache-Hit: "redis" | "database" | absent
```

**Error** (400/408/500):
```json
{
  "error": "Error message",
  "message": "Detailed description",
  "trace_id": "abc123...",
  "status": "OCR_FAILED"
}
```

## Usage in Chat

When sending a message with images:

1. **Gateway Backend (text-only)**:
   - Waits for OCR to complete before sending
   - Includes OCR text in message context
   - Blocks submission if OCR fails
   - Shows error: "OCR failed, cannot send to gateway API"

2. **Local Backend (multimodal)**:
   - Sends images directly (base64)
   - OCR text included as additional context
   - Model processes both image + OCR text

## Code Examples

### Triggering OCR Manually

```typescript
const { runOcrOnAttachment } = useAttachments();

// Run OCR on specific attachment
runOcrOnAttachment("attachment-123");
```

### Retrying Failed OCR

```typescript
const { retryOcr } = useAttachments();

// Retry OCR after failure
retryOcr("attachment-123");
```

### Canceling Ongoing OCR

```typescript
const { cancelOcr } = useAttachments();

// Cancel in-progress OCR
cancelOcr("attachment-123");
```

### Checking OCR Status

```typescript
const { attachments, ocrLoading, ocrErrors } = useAttachments();

const attachment = attachments[0];
const isProcessing = ocrLoading[attachment.id];
const error = ocrErrors[attachment.id];
const hasText = !!attachment.ocrText;

if (hasText) {
  console.log("OCR Text:", attachment.ocrText);
  console.log("Trace ID:", attachment.ocrTraceId);
  console.log("Cache Hit:", attachment.ocrCacheHit);
}
```

## Edge Cases Handled

✅ **File too large**: Validation before upload
✅ **Invalid file type**: User-friendly error message
✅ **Network timeout**: Retry with exponential backoff
✅ **Empty text result**: "Image may not contain readable text"
✅ **API rate limit**: Displays specific error
✅ **User cancels**: Clean state cleanup
✅ **Multiple simultaneous requests**: Independent tracking per image
✅ **Component unmount during OCR**: Cleanup prevents memory leaks
✅ **No text detected**: Clear error message
✅ **Gateway + image without OCR**: Blocks submission with helpful error

## Performance

- **Auto-OCR**: Starts immediately on attachment
- **Parallel Processing**: Multiple images processed concurrently
- **Cache Hits**: Near-instant for repeated images (⚡ <100ms)
- **Progress Updates**: Real-time status (every 2s polling interval)
- **Debounced UI**: Smooth animations without janky updates

## Accessibility

- ARIA labels on all interactive buttons
- Keyboard navigation support
- Screen reader announcements for state changes
- High contrast error states
- Focus management on retry/cancel

## Future Enhancements

- [ ] Batch OCR for multiple images
- [ ] OCR confidence scores
- [ ] Language detection display
- [ ] Text editing before sending
- [ ] OCR history/cache viewer
- [ ] Custom OCR settings (layout algorithm selection)
- [ ] Progress percentage (if API supports it)
- [ ] Downloadable OCR results
- [ ] Copy extracted text to clipboard

## Troubleshooting

**OCR never completes**:
- Check network connection
- Verify API token is valid
- Check console for errors

**Empty text result**:
- Image may be too blurry
- Text may be too small
- Try higher resolution image

**Timeout errors**:
- Image too large (try compressing)
- Document too complex
- Try splitting into smaller images

**Cache not working**:
- Filename or file size changed
- Cache expired (24hr TTL)
- Redis connection issue

## Developer Notes

### Adding Progress Steps

Edit `ocr-service.ts` to add custom progress messages:

```typescript
onProgress?.("Custom step...");
```

### Customizing Timeout

Change timeout in `ocr-service.ts`:

```typescript
const OCR_TIMEOUT = 960000; // 16 minutes (default)
```

### Using Different OCR Provider

Implement the same interface in `ocr-service.ts`:

```typescript
export interface OcrResult {
  text: string;
  traceId?: string;
  projectId?: string;
  cacheHit?: "redis" | "database" | null;
}
```

Then swap the implementation in `OcrService.processImage()`.

## Conclusion

The OCR system provides a seamless, production-ready experience for extracting text from images. With auto-processing, beautiful UI, comprehensive error handling, and excellent performance, it sets a high bar for modern SaaS applications.
