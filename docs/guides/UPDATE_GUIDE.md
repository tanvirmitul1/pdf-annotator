# 🔄 CRITICAL UPDATE GUIDE - Path Replacements

## ✅ COMPLETED MIGRATIONS

### Services Moved:
- ✅ `/app/app` → `/app/(platform)/services/documents`
- ✅ `/app/gemma/chat` → `/app/(platform)/services/ai-chat`
- ✅ `/app/api/documents` → `/app/api/services/documents`
- ✅ `/app/api/annotations` → `/app/api/services/documents/annotations`
- ✅ `/app/api/comments` → `/app/api/services/documents/comments`
- ✅ `/app/api/tags` → `/app/api/services/documents/tags`
- ✅ `/app/api/gemma` → `/app/api/services/ai-chat`

### New Components:
- ✅ Service Selector Dashboard: `/dashboard`
- ✅ Landing Page: `/` (public)
- ✅ Service Cards Component
- ✅ Platform Layout
- ✅ Updated Middleware

---

## 🚨 REQUIRED: Global Search & Replace

You MUST perform these search-and-replace operations across the ENTIRE codebase:

### 1. Frontend Route Updates

| Search For | Replace With | Files Affected |
|------------|-------------|----------------|
| `href="/app"` | `href="/services/documents"` | Navigation, Links |
| `router.push("/app"` | `router.push("/services/documents"` | Client components |
| `redirect("/app"` | `redirect("/services/documents"` | Server components |
| `pathname.startsWith("/app")` | `pathname.startsWith("/services/documents")` | Conditionals |
| `"/app/"` | `"/services/documents/"` | String comparisons |
| `href="/gemma/chat"` | `href="/services/ai-chat"` | Navigation |
| `router.push("/gemma/chat"` | `router.push("/services/ai-chat"` | Client components |

### 2. API Endpoint Updates

| Search For | Replace With | Files Affected |
|------------|-------------|----------------|
| `"/api/documents"` | `"/api/services/documents"` | Fetch calls, RTK Query |
| `"/api/annotations"` | `"/api/services/documents/annotations"` | Fetch calls |
| `"/api/comments"` | `"/api/services/documents/comments"` | Fetch calls |
| `"/api/tags"` | `"/api/services/documents/tags"` | Fetch calls |
| `"/api/gemma/chat"` | `"/api/services/ai-chat/chat"` | Chat API calls |
| `"/api/gemma/ocr"` | `"/api/services/ai-chat/ocr"` | OCR API calls |
| `\`/api/documents/` | `\`/api/services/documents/` | Template literals |
| `\`/api/gemma/` | `\`/api/services/ai-chat/` | Template literals |

### 3. Middleware Path Updates

Already completed in `middleware.ts`:
- ✅ Changed protected paths to `/services/:path*` and `/dashboard`
- ✅ Redirects to `/dashboard` instead of `/app`

### 4. Redux/RTK Query Updates

Search in `features/` directory:

| Search For | Replace With |
|------------|-------------|
| `api/documents` | `api/services/documents` |
| `api/annotations` | `api/services/documents/annotations` |
| `api/comments` | `api/services/documents/comments` |

---

## 📁 Files Requiring Manual Updates

### High Priority Files:

#### Navigation Components
- `components/common/protected-shell.tsx` - Update navigation links
- `components/navigation/*` - Update all href attributes
- `components/documents/document-card.tsx` - Update document links
- Any breadcrumb components

#### Redux Store & API Slices
- `features/documents/documents-api.ts` - Update all endpoints
- `features/annotations/annotations-api.ts` - Update all endpoints
- `features/comments/comments-api.ts` - Update all endpoints
- `app/(platform)/services/ai-chat/_store/conversations-api.ts` - Update endpoints

#### Components Using Navigation
- Search for all files with:
  - `useRouter()`
  - `usePathname()`
  - `Link` from next/link
  - `href=` attributes

---

## 🔧 AUTOMATED SEARCH & REPLACE COMMANDS

### Using VS Code:
1. Press `Ctrl+Shift+H` (Find in Files)
2. Enable regex with `.*` button
3. **Important**: Check "Match Whole Word" for clean replacements

### Command Line (PowerShell):
```powershell
# Replace /app routes
Get-ChildItem -Path . -Include *.tsx,*.ts,*.jsx,*.js -Recurse | 
  ForEach-Object {
    (Get-Content $_.FullName) -replace 'href="/app"', 'href="/services/documents"' |
    Set-Content $_.FullName
  }

# Replace API endpoints
Get-ChildItem -Path . -Include *.tsx,*.ts,*.jsx,*.js -Recurse | 
  ForEach-Object {
    (Get-Content $_.FullName) -replace '"/api/documents', '"/api/services/documents' |
    Set-Content $_.FullName
  }
```

---

## ✅ VERIFICATION CHECKLIST

After completing search & replace:

### Build & Type Check
```bash
pnpm typecheck   # Must pass without errors
pnpm lint        # Must pass
pnpm build       # Must complete successfully
```

### Manual Testing
- [ ] Navigate to `/` - Should show landing page (logged out) or redirect to `/dashboard` (logged in)
- [ ] Navigate to `/dashboard` - Should show service selector cards
- [ ] Click "Document Annotator" card → Should go to `/services/documents`
- [ ] Click "AI Chat" card → Should go to `/services/ai-chat`
- [ ] Upload a PDF in documents service → Should work
- [ ] View a document → URL should be `/services/documents/(viewer)/documents/[id]`
- [ ] Create chat conversation → URL should be `/services/ai-chat?c=[id]`
- [ ] All API calls should work (check Network tab)
- [ ] Settings page should work at `/settings`

### Database
```bash
# Run migration for service access
pnpm db:migrate --name add_service_access

# Re-seed if needed
pnpm db:seed
```

---

## 🎯 PRIORITY ORDER

1. **CRITICAL** - Run search & replace for API endpoints first
2. **HIGH** - Update all `href` and `router.push` calls
3. **MEDIUM** - Update Redux/RTK Query endpoints
4. **LOW** - Update any hardcoded string references

---

## 📊 EXPECTED CHANGES

Estimated files that need updates:
- **Navigation/Links**: ~30-50 files
- **API Calls**: ~20-30 files
- **Redux Slices**: ~5-10 files
- **Components**: ~40-60 files

**Total**: 95-150 files will require path updates

---

## 🆘 TROUBLESHOOTING

### Issue: "Module not found" errors
**Solution**: Check import paths, they should now reference:
- `@/app/(platform)/services/documents/*`
- `@/app/(platform)/services/ai-chat/*`

### Issue: API calls returning 404
**Solution**: Verify API routes were copied correctly and endpoints updated

### Issue: Authentication redirects to wrong page
**Solution**: Check `middleware.ts` and ensure it redirects to `/dashboard`

### Issue: Links still going to old routes
**Solution**: Search for any remaining `/app` or `/gemma` references

---

## 📝 EXAMPLE: Complete File Update

**Before** (`components/documents/document-card.tsx`):
```tsx
<Link href={`/app/documents/${doc.id}`}>
  <Button onClick={() => router.push("/app")}>
```

**After**:
```tsx
<Link href={`/services/documents/(viewer)/documents/${doc.id}`}>
  <Button onClick={() => router.push("/services/documents")}>
```

---

## 🚀 NEXT STEPS AFTER UPDATES

1. Delete old routes (optional, for cleanup):
   ```bash
   rm -rf app/app
   rm -rf app/gemma
   rm -rf app/api/documents (old location)
   rm -rf app/api/annotations (old location)
   rm -rf app/api/comments (old location)
   rm -rf app/api/tags (old location)
   rm -rf app/api/gemma
   ```

2. Update `README.md` with new routes

3. Update any documentation

4. Update `.env.example` if needed

5. Commit changes:
   ```bash
   git add .
   git commit -m "refactor: Transform to multi-service platform architecture"
   ```

---

## 💡 ADDING FUTURE SERVICES

Template for new services:

1. Add to `ServiceType` enum in `schema.prisma`
2. Add to `AVAILABLE_SERVICES` in `lib/services/registry.ts`
3. Create `app/(platform)/services/[new-service]/`
4. Create `app/api/services/[new-service]/`
5. Update middleware matcher if needed
6. Grant access via `UserServiceAccess`

---

**Status**: Foundation complete, path updates required before full functionality


---

## ✅ ADDITIONAL UPDATES COMPLETED

### Root Page Updated
- ✅ `app/page.tsx` - Updated to show multi-service landing page
- ✅ Now redirects to `/dashboard` when logged in (not `/app`)
- ✅ Shows service preview cards for Document Annotator and AI Chat
- ✅ Professional landing page with proper branding

This change is already complete - no action needed!
