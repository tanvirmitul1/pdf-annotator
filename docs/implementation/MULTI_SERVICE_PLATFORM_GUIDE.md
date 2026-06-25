# MULTI-SERVICE PLATFORM TRANSFORMATION GUIDE

## ✅ COMPLETED STEPS

### Phase 1: Branding & Metadata ✅
- [x] Updated `package.json` → `workhub-platform`
- [x] Updated `README.md` → Multi-service platform description
- [x] Updated `app/layout.tsx` → "WorkHub - All Your Productivity Tools"
- [x] Updated theme localStorage key → `workhub-theme`

### Phase 2: Database Schema ✅
- [x] Added `ServiceType` enum (DOCUMENTS, AI_CHAT)
- [x] Added `UserServiceAccess` model
- [x] Generated Prisma client
- [x] Created service registry (`lib/services/registry.ts`)

## 📋 REMAINING IMPLEMENTATION STEPS

### Phase 3: File Structure Reorganization

#### Step 1: Create New Directory Structure
```bash
mkdir app\(public)
mkdir app\(platform)
mkdir app\(platform)\dashboard
mkdir app\(platform)\services
mkdir app\(platform)\services\documents
mkdir app\(platform)\services\ai-chat
```

#### Step 2: Move Existing Routes

**Move PDF Annotator:**
```
app/app/(main)/*           → app/(platform)/services/documents/*
app/app/(viewer)/*         → app/(platform)/services/documents/(viewer)/*
app/api/documents/*        → app/api/services/documents/*
app/api/annotations/*      → app/api/services/documents/annotations/*
app/api/share-links/*      → app/api/services/documents/share-links/*
```

**Move AI Chat:**
```
app/gemma/chat/*           → app/(platform)/services/ai-chat/*
app/api/gemma/chat/*       → app/api/services/ai-chat/*
```

**Reorganize Auth:**
```
app/login/*                → app/(public)/auth/login/*
app/signup/*               → app/(public)/auth/signup/*
```

### Phase 4: Create New Pages

#### 1. Landing Page (`app/(public)/page.tsx`)
```tsx
// Two states:
// - Logged out: Marketing page with service cards
// - Logged in: Redirect to /dashboard
```

#### 2. Dashboard (`app/(platform)/dashboard/page.tsx`)
```tsx
// Service selector with cards:
// - Document Annotator
// - AI Chat Assistant
// - Coming soon cards (disabled)
```

#### 3. Platform Layout (`app/(platform)/layout.tsx`)
```tsx
// Common layout for all services:
// - Top nav with service switcher
// - Breadcrumbs
// - User menu
```

### Phase 5: Update Middleware

Update `middleware.ts`:
```typescript
// Protect patterns:
// - /services/* → requires auth
// - /dashboard → requires auth
// - /auth/* → redirect to dashboard if logged in

if (req.nextUrl.pathname.startsWith("/services") && !req.auth?.user) {
  const loginUrl = new URL("/auth/login", req.url)
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}
```

### Phase 6: Update All Internal Links

Find and replace across codebase:
```
/app → /services/documents
/gemma/chat → /services/ai-chat
/login → /auth/login
/signup → /auth/signup
```

Files to update:
- All components with navigation
- All API redirects
- All middleware logic
- All internal Link components

### Phase 7: Create Service Components

#### Service Card Component
**Location:** `components/platform/service-card.tsx`
```tsx
interface ServiceCardProps {
  service: ServiceConfig;
  disabled?: boolean;
}
```

#### Service Nav Component
**Location:** `components/platform/service-nav.tsx`
```tsx
// Displays current service and allows switching
```

#### Breadcrumb Component
**Location:** `components/platform/breadcrumbs.tsx`
```tsx
// Shows navigation hierarchy
// Dashboard > Documents > Document Name
```

### Phase 8: Update API Routes

**Pattern for all API routes:**
```
Before: /api/documents/*
After:  /api/services/documents/*

Before: /api/gemma/chat/*
After:  /api/services/ai-chat/*
```

**Files to update:**
- All RTK Query API slices
- All fetch() calls
- All API route handlers

### Phase 9: Seed Database

Update `prisma/seed.ts`:
```typescript
// Add service access for existing users
await prisma.userServiceAccess.createMany({
  data: [
    { userId: user.id, service: "DOCUMENTS", enabled: true },
    { userId: user.id, service: "AI_CHAT", enabled: true },
  ],
  skipDuplicates: true,
});
```

### Phase 10: Run Migration

```bash
pnpm db:migrate --name add_service_access
pnpm db:seed
```

## 🎨 UI DESIGN SPECS

### Landing Page (Logged Out)
```
┌─────────────────────────────────────────────┐
│  [WorkHub Logo]    Login | Sign Up          │
├─────────────────────────────────────────────┤
│                                              │
│     All Your Productivity Tools             │
│           In One Place                       │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │📄 Documents  │  │💬 AI Chat    │        │
│  │ Annotate PDFs│  │ Smart assist │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
│         [Get Started Free]                   │
└─────────────────────────────────────────────┘
```

### Dashboard (Logged In)
```
┌─────────────────────────────────────────────┐
│ WorkHub          Settings   [User Menu]     │
├─────────────────────────────────────────────┤
│                                              │
│  Welcome back, John!                         │
│                                              │
│  Your Services                               │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │📄 Documents  │  │💬 AI Chat    │        │
│  │ 12 documents │  │ 5 chats      │        │
│  │              │  │              │        │
│  │  [Open →]    │  │  [Open →]    │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │🚀 Coming     │  │🚀 Coming     │        │
│  │   Soon       │  │   Soon       │        │
│  │              │  │              │        │
│  │  [Disabled]  │  │  [Disabled]  │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

### Service Page Layout
```
┌─────────────────────────────────────────────┐
│ [<- Dashboard] | Documents | Settings | User│
├─────────────────────────────────────────────┤
│ Dashboard > Documents > My Document          │
├─────────────────────────────────────────────┤
│                                              │
│         [Service-specific content]           │
│                                              │
└─────────────────────────────────────────────┘
```

## 🔧 MIGRATION CHECKLIST

### Pre-Migration
- [ ] Backup database
- [ ] Test in development first
- [ ] Document all custom API routes
- [ ] List all internal links

### Migration
- [ ] Run database migration
- [ ] Update all route files
- [ ] Update all API calls
- [ ] Update middleware
- [ ] Update navigation components
- [ ] Test all services independently

### Post-Migration
- [ ] Verify all routes work
- [ ] Test authentication flow
- [ ] Test service switching
- [ ] Verify API calls
- [ ] Update documentation
- [ ] Deploy to production

## 🚀 QUICK START (After Migration)

### Adding a New Service

1. **Update Enum** (`prisma/schema.prisma`)
```prisma
enum ServiceType {
  DOCUMENTS
  AI_CHAT
  NEW_SERVICE  // Add here
}
```

2. **Register Service** (`lib/services/registry.ts`)
```typescript
{
  id: "NEW_SERVICE",
  name: "New Service",
  description: "Description here",
  icon: YourIcon,
  path: "/services/new-service",
  enabled: true,
}
```

3. **Create Routes**
```
app/(platform)/services/new-service/
  ├── page.tsx
  ├── layout.tsx
  └── [specific routes]

app/api/services/new-service/
  └── route.ts
```

4. **Grant Access** (in seed or admin panel)
```typescript
await prisma.userServiceAccess.create({
  data: {
    userId: user.id,
    service: "NEW_SERVICE",
    enabled: true,
  },
});
```

That's it! The new service appears in the dashboard automatically.

## 📁 FINAL STRUCTURE

```
app/
├── (public)/                  # Unauthenticated routes
│   ├── page.tsx              # Landing page
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── privacy/
│   ├── terms/
│   └── layout.tsx
│
├── (platform)/               # Authenticated platform
│   ├── dashboard/           # Service selector
│   │   └── page.tsx
│   ├── settings/            # Global settings
│   │   └── page.tsx
│   ├── services/
│   │   ├── documents/       # PDF Annotator
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   └── layout.tsx
│   │   └── ai-chat/         # AI Chat
│   │       ├── page.tsx
│   │       └── layout.tsx
│   └── layout.tsx           # Platform layout
│
└── api/
    ├── auth/
    └── services/
        ├── documents/
        └── ai-chat/
```

## 🎯 BENEFITS OF NEW ARCHITECTURE

1. **Scalability**: Add unlimited services without restructuring
2. **Isolation**: Each service is independent and modular
3. **User Control**: Service-level access management
4. **Clarity**: Clear URL structure reflects app hierarchy
5. **Flexibility**: Easy to add/remove services
6. **Professional**: Multi-service platform vs single-purpose app

---

## 📞 NEXT STEPS

This guide provides the complete blueprint. Would you like me to:

1. **Implement the dashboard page** (service selector with cards)
2. **Create the migration script** to reorganize routes
3. **Update a specific service** (Documents or AI Chat)
4. **Implement the platform layout** with service nav

Choose what you'd like me to build next, or I can proceed with implementing the complete transformation step-by-step!
