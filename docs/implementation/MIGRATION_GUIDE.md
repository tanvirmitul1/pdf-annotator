# 🚀 Multi-Service Platform Migration Guide

## ✅ COMPLETED (Foundation Phase)

### 1. Branding & Metadata
- ✅ Updated package.json name to `workhub-platform`
- ✅ Updated README.md with new platform description
- ✅ Updated root layout.tsx metadata
- ✅ Updated app/(auth)/layout.tsx title

### 2. Database Schema
- ✅ Added `ServiceType` enum (PDF_ANNOTATOR, AI_CHAT)
- ✅ Added `UserServiceAccess` model
- ✅ Generated Prisma client
- ⚠️ **TODO**: Run migration `pnpm db:migrate --name add_service_access`

### 3. Service Registry System
- ✅ Created `lib/services/registry.ts` with service definitions
- ✅ Service metadata: name, description, icon, path, color

### 4. New UI Components
- ✅ `components/platform/service-card.tsx` - Service selector cards
- ✅ `app/(platform)/layout.tsx` - Platform navigation wrapper
- ✅ `app/(public)/page.tsx` - New landing page with service preview
- ✅ `app/(public)/layout.tsx` - Public layout
- ✅ `app/(platform)/dashboard/page.tsx` - Service dashboard
- ✅ `app/(platform)/settings/page.tsx` - Global settings

### 5. Middleware Updates
- ✅ Updated protected routes: `/services/*` and `/dashboard`
- ✅ Redirect logic for authenticated users

---

## 🔧 REMAINING TASKS (Critical Path)

### Phase A: Route Migration (NEXT PRIORITY)

#### 1. Move PDF Annotator Service
```bash
# Move /app → /services/documents
mkdir app\(platform)\services
mkdir app\(platform)\services\documents
```

**Files to move/update:**
- Move `app/app/` → `app/(platform)/services/documents/`
- Update all imports in moved files
- Update navigation links in components

**API Routes:**
- Move `app/api/documents/` → `app/api/services/documents/`
- Update all API endpoint calls

#### 2. Move AI Chat Service
```bash
mkdir app\(platform)\services\ai-chat
```

**Files to move:**
- Move `app/gemma/chat/` → `app/(platform)/services/ai-chat/`
- Move `app/api/gemma/` → `app/api/services/ai-chat/`
- Update imports and API calls

#### 3. Update Internal Links
Search and replace across codebase:
- `/app` → `/services/documents`
- `/gemma/chat` → `/services/ai-chat`
- `/api/documents` → `/api/services/documents`
- `/api/gemma` → `/api/services/ai-chat`

### Phase B: Seed Data Update

Update `prisma/seed.ts`:
```typescript
// Add service access for seeded users
await prisma.userServiceAccess.createMany({
  data: [
    { userId: testUser.id, service: 'PDF_ANNOTATOR', enabled: true },
    { userId: testUser.id, service: 'AI_CHAT', enabled: true },
  ],
});
```

### Phase C: Redux Store Updates

Files to update:
- `lib/store.ts` - Add service-aware state slicing
- `features/*` API slices - Update endpoints

### Phase D: Component Updates

**Navigation Components:**
- Update `components/navigation/*` with new routes
- Add service breadcrumbs

**Layout Components:**
- Ensure all layouts use new route structure

### Phase E: Testing & Verification

**Test Checklist:**
- [ ] Root `/` shows landing page (logged out)
- [ ] Root `/` redirects to `/dashboard` (logged in)
- [ ] `/dashboard` shows service cards
- [ ] `/services/documents` works (PDF annotator)
- [ ] `/services/ai-chat` works (AI chat)
- [ ] `/settings` accessible
- [ ] All API routes respond correctly
- [ ] Authentication flow works
- [ ] Service access control works

---

## 📝 STEP-BY-STEP EXECUTION PLAN

### Step 1: Database Migration (DO THIS FIRST)
```bash
pnpm db:migrate --name add_service_access
```

### Step 2: Move PDF Annotator
```bash
# Create services directory
mkdir app\(platform)\services
mkdir app\(platform)\services\documents

# Move files (manual or use git mv to preserve history)
# app/app/* → app/(platform)/services/documents/*
```

Then update imports in all moved files.

### Step 3: Move AI Chat
```bash
mkdir app\(platform)\services\ai-chat
# Move app/gemma/chat/* → app/(platform)/services/ai-chat/*
```

### Step 4: Move API Routes
```bash
mkdir app\api\services
mkdir app\api\services\documents
mkdir app\api\services\ai-chat

# Move API routes
```

### Step 5: Global Search & Replace
Use IDE find/replace across entire project:
1. `href="/app` → `href="/services/documents`
2. `router.push("/app` → `router.push("/services/documents`
3. `/api/documents` → `/api/services/documents`
4. `/api/gemma` → `/api/services/ai-chat`
5. `"/gemma/chat"` → `"/services/ai-chat"`

### Step 6: Update Middleware
Already done! ✅

### Step 7: Update Seed Script
Add service access creation in `prisma/seed.ts`

### Step 8: Test Everything
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

---

## 🎯 Quick Start (If Starting Fresh)

If you want to see the new structure working immediately:

1. Run database migration:
   ```bash
   pnpm db:migrate --name add_service_access
   pnpm db:seed
   ```

2. The new landing page and dashboard are already created
3. Access `/dashboard` to see service cards
4. Old routes still work until you migrate them

---

## 🔍 File Location Reference

### New Structure
```
app/
├── (public)/                      # Unauthenticated routes
│   ├── page.tsx                  # ✅ NEW landing page
│   ├── layout.tsx                # ✅ Public layout
│   └── auth/
│       ├── login/
│       └── signup/
│
├── (platform)/                    # Authenticated routes
│   ├── layout.tsx                # ✅ Platform navigation
│   ├── dashboard/
│   │   └── page.tsx              # ✅ Service selector
│   ├── settings/
│   │   └── page.tsx              # ✅ Global settings
│   └── services/
│       ├── documents/            # ⚠️ TODO: Move from /app
│       └── ai-chat/              # ⚠️ TODO: Move from /gemma/chat
│
└── api/
    └── services/
        ├── documents/            # ⚠️ TODO: Move from /api/documents
        └── ai-chat/              # ⚠️ TODO: Move from /api/gemma

components/
└── platform/
    └── service-card.tsx          # ✅ Service cards

lib/
└── services/
    └── registry.ts               # ✅ Service definitions
```

---

## 💡 Adding New Services (Future)

1. Add enum value in `schema.prisma`:
   ```prisma
   enum ServiceType {
     PDF_ANNOTATOR
     AI_CHAT
     NEW_SERVICE  // Add here
   }
   ```

2. Add service definition in `lib/services/registry.ts`

3. Create route: `app/(platform)/services/new-service/`

4. Create API: `app/api/services/new-service/`

5. Grant access via `UserServiceAccess` model

---

## ❓ Need Help?

**Common Issues:**
- **Routes not working?** Check middleware.ts matcher patterns
- **Auth redirects wrong?** Verify callback logic in middleware
- **Imports broken?** Use IDE "Find in Files" to update paths
- **Prisma errors?** Run `pnpm db:generate` after schema changes

**Next Steps:**
Follow the execution plan above, starting with database migration.

The foundation is complete - now we need to migrate the actual services to the new structure! 🚀
