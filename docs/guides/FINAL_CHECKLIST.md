# ✅ FINAL CHECKLIST - Complete the Transformation

## 🎯 GOAL: Make all services work with new paths

---

## 📝 STEP 1: Global Search & Replace (15 minutes)

Open VS Code, press `Ctrl+Shift+H`, and do these replacements:

### Round 1: Frontend Routes (8 replacements)

| # | Search | Replace | Notes |
|---|--------|---------|-------|
| 1 | `href="/app"` | `href="/services/documents"` | Navigation links |
| 2 | `href="/app/` | `href="/services/documents/` | Subpage links |
| 3 | `router.push("/app"` | `router.push("/services/documents"` | Client navigation |
| 4 | `router.push("/app/` | `router.push("/services/documents/` | Client subpages |
| 5 | `redirect("/app"` | `redirect("/services/documents"` | Server redirects |
| 6 | `redirect("/app/` | `redirect("/services/documents/` | Server subpages |
| 7 | `pathname.startsWith("/app")` | `pathname.startsWith("/services/documents")` | Conditionals |
| 8 | `pathname === "/app"` | `pathname === "/services/documents"` | Exact matches |

### Round 2: API Endpoints (6 replacements)

| # | Search | Replace | Notes |
|---|--------|---------|-------|
| 9 | `"/api/documents` | `"/api/services/documents` | Document API |
| 10 | `'/api/documents` | `'/api/services/documents` | Single quotes |
| 11 | `"/api/annotations` | `"/api/services/documents/annotations` | Annotations API |
| 12 | `"/api/comments` | `"/api/services/documents/comments` | Comments API |
| 13 | `"/api/tags` | `"/api/services/documents/tags` | Tags API |
| 14 | `"/api/gemma` | `"/api/services/ai-chat` | Chat API |

### Round 3: Template Literals (4 replacements)

| # | Search (use regex .*) | Replace | Notes |
|---|--------|---------|-------|
| 15 | `` `/api/documents/` `` | `` `/api/services/documents/` `` | Documents |
| 16 | `` `/api/gemma/` `` | `` `/api/services/ai-chat/` `` | Chat |
| 17 | `` `/app/documents/` `` | `` `/services/documents/(viewer)/documents/` `` | Viewer |
| 18 | `href={\`/app/` | `href={\`/services/documents/` | Dynamic hrefs |

---

## 📝 STEP 2: Manual File Updates (5 minutes)

### Check RTK Query API Slices:

```bash
# Find and update these files:
features/documents/documents-api.ts
features/annotations/annotations-api.ts
features/comments/comments-api.ts
```

**Look for:**
- `baseUrl` or endpoint definitions
- Replace `/api/documents` → `/api/services/documents`
- Replace `/api/annotations` → `/api/services/documents/annotations`

### Check Document Card Links:

```bash
# Find document card component
components/documents/document-card.tsx  # or similar
```

**Look for:**
- Links to `/app/documents/[id]`
- Replace with `/services/documents/(viewer)/documents/[id]`

---

## 📝 STEP 3: Verify Build (3 minutes)

```bash
# Run these commands:
pnpm typecheck
pnpm lint
pnpm build
```

**Expected result:** All should pass without errors

**If errors:**
- TypeScript errors → Check imports
- Lint errors → Run `pnpm lint --fix`
- Build errors → Check for missed path updates

---

## 📝 STEP 4: Test in Development (5 minutes)

```bash
pnpm dev
```

### Test Checklist:

#### Landing & Dashboard:
- [ ] Navigate to http://localhost:3000
- [ ] (Logged out) Shows landing page with service preview
- [ ] (Logged in) Redirects to `/dashboard`
- [ ] Dashboard shows 2 service cards

#### Document Service:
- [ ] Click "Document Annotator" card
- [ ] URL is `/services/documents`
- [ ] Dashboard shows document list
- [ ] Upload a PDF (small test file)
- [ ] Click to view document
- [ ] URL is `/services/documents/(viewer)/documents/[id]`
- [ ] Annotations work
- [ ] Navigate to Collections, Tags, Trash

#### AI Chat Service:
- [ ] Navigate to `/dashboard`
- [ ] Click "AI Chat Assistant" card
- [ ] URL is `/services/ai-chat`
- [ ] Chat interface loads
- [ ] Send a message
- [ ] Response received
- [ ] Check URL includes `?c=[conversation-id]`

#### Settings:
- [ ] Click user menu → Settings
- [ ] URL is `/settings`
- [ ] Profile information displays

---

## 📝 STEP 5: Check Browser Console (2 minutes)

Open DevTools (F12) and check:

### Console Tab:
- [ ] No errors related to routes
- [ ] No "404 Not Found" for API calls
- [ ] No "Module not found" errors

### Network Tab:
- [ ] All API calls return 200 OK
- [ ] Endpoints use `/api/services/*` paths
- [ ] No requests to old `/api/documents` paths

---

## 📝 STEP 6: Clean Up (Optional - 3 minutes)

If everything works, delete old route folders:

```bash
# Backup first (optional):
git add .
git commit -m "Before cleanup - all working"

# Then delete:
rm -rf app/app
rm -rf app/gemma
rm -rf app/api/documents  # Old location
rm -rf app/api/annotations  # Old location
rm -rf app/api/comments  # Old location
rm -rf app/api/tags  # Old location
rm -rf app/api/gemma
```

---

## 🎉 SUCCESS CRITERIA

You're done when:

✅ All commands pass:
```bash
pnpm typecheck ✓
pnpm lint ✓
pnpm build ✓
```

✅ All pages load:
- `/` → Landing page
- `/dashboard` → Service cards
- `/services/documents` → PDF annotator
- `/services/ai-chat` → Chat

✅ All features work:
- Upload PDF
- View document
- Create annotation
- Send chat message
- All API calls succeed

✅ No console errors

---

## 🆘 TROUBLESHOOTING

### Issue: TypeScript errors about missing modules
**Solution:**
```bash
rm -rf node_modules
pnpm install
pnpm db:generate
```

### Issue: API calls returning 404
**Solution:**
- Check Network tab for failing endpoint
- Search codebase for that endpoint
- Update to new `/api/services/*` path

### Issue: "Cannot find module" errors
**Solution:**
- Check import paths
- Ensure files were copied to new locations
- May need to update imports

### Issue: Redirect loop on login
**Solution:**
- Clear cookies
- Restart dev server
- Check middleware.ts configuration

### Issue: Document viewer not loading
**Solution:**
- Check link format: `/services/documents/(viewer)/documents/[id]`
- Not `/services/documents/[id]`
- Route group `(viewer)` is required

---

## 📊 PROGRESS TRACKER

Mark your progress:

- [ ] Step 1: Global search & replace ✓
- [ ] Step 2: Manual file updates ✓
- [ ] Step 3: Verify build ✓
- [ ] Step 4: Test in development ✓
- [ ] Step 5: Check console ✓
- [ ] Step 6: Clean up (optional) ✓

---

## ⏱️ TIME ESTIMATE

- **Fast track:** 15-20 minutes (automated replacements)
- **Careful review:** 25-35 minutes (check each change)
- **With testing:** 35-45 minutes (thorough validation)

---

## 🎯 AFTER COMPLETION

You'll have:
- ✅ Fully functional multi-service platform
- ✅ Clean, scalable architecture
- ✅ Professional service selector UI
- ✅ Easy to add new services (15 min each)
- ✅ All existing functionality working

---

## 💡 NEXT: ADD YOUR 3RD SERVICE

See `OPTIMIZED_PROMPT.md` for how to add more services!

---

**You've got this! 🚀**

Start with Step 1, work through systematically, and you'll be done in 30 minutes!
