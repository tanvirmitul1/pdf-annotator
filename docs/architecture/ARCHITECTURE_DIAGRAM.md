# 🏗️ ARCHITECTURE VISUALIZATION

## 📊 NEW PLATFORM STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WORKHUB PLATFORM                            │
│                     Multi-Service Architecture                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PUBLIC ROUTES (/)                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐                                           │
│  │  Landing Page       │  ← Logged Out Users                       │
│  │  - Service Preview  │                                           │
│  │  - Sign Up CTA      │                                           │
│  └─────────────────────┘                                           │
│                                                                     │
│  ┌─────────────────────┐                                           │
│  │  Auth Pages         │                                           │
│  │  - /auth/login      │                                           │
│  │  - /auth/signup     │                                           │
│  └─────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
                          User Authenticates
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PLATFORM ROUTES (Authenticated)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  /dashboard  →  SERVICE SELECTOR                             │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │   ┌──────────────────┐    ┌──────────────────┐            │  │
│  │   │  📄 Documents    │    │  💬 AI Chat      │            │  │
│  │   │  PDF Annotator   │    │  Assistant       │            │  │
│  │   └────────┬─────────┘    └────────┬─────────┘            │  │
│  │            │                       │                       │  │
│  │            ↓                       ↓                       │  │
│  └────────────┼───────────────────────┼───────────────────────┘  │
│               │                       │                           │
│  ┌────────────┼───────────────────────┼───────────────────────┐  │
│  │  /services/│                       │                       │  │
│  │            │                       │                       │  │
│  │  ┌─────────▼─────────┐   ┌────────▼───────┐              │  │
│  │  │  documents/        │   │  ai-chat/      │              │  │
│  │  ├───────────────────┤   ├────────────────┤              │  │
│  │  │ • Dashboard        │   │ • Chat UI      │              │  │
│  │  │ • Upload           │   │ • Conversations│              │  │
│  │  │ • Viewer           │   │ • Artifacts    │              │  │
│  │  │ • Collections      │   │ • OCR          │              │  │
│  │  │ • Tags             │   │ • Voice        │              │  │
│  │  │ • Trash            │   └────────────────┘              │  │
│  │  │ • Admin            │                                   │  │
│  │  │ • Settings         │                                   │  │
│  │  └───────────────────┘                                   │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  Future Service:  🚀 [Your Next Service]        │   │  │
│  │  │  Easy to add - just copy the pattern!           │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /settings  →  GLOBAL USER SETTINGS                   │  │
│  │  • Profile                                             │  │
│  │  • Service Access                                      │  │
│  │  • Preferences                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 API ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│  API ROUTES (/api)                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                              │
│  │  /auth/*     │  ← Centralized Auth (all services)          │
│  └──────────────┘                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  /services/                                             │  │
│  │                                                         │  │
│  │   ┌────────────────────┐      ┌────────────────────┐  │  │
│  │   │  documents/        │      │  ai-chat/          │  │  │
│  │   ├────────────────────┤      ├────────────────────┤  │  │
│  │   │ • GET /            │      │ • POST /chat       │  │  │
│  │   │ • POST /upload     │      │ • GET /chat/conv   │  │  │
│  │   │ • GET /[id]        │      │ • POST /ocr        │  │  │
│  │   │ • PATCH /[id]      │      └────────────────────┘  │  │
│  │   │ • DELETE /[id]     │                              │  │
│  │   │                    │                              │  │
│  │   │ /annotations/      │                              │  │
│  │   │ • GET /            │                              │  │
│  │   │ • POST /           │                              │  │
│  │   │ • PATCH /[id]      │                              │  │
│  │   │                    │                              │  │
│  │   │ /comments/         │                              │  │
│  │   │ • GET /[id]        │                              │  │
│  │   │ • POST /           │                              │  │
│  │   │                    │                              │  │
│  │   │ /tags/             │                              │  │
│  │   │ • GET /            │                              │  │
│  │   │ • POST /           │                              │  │
│  │   └────────────────────┘                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 💾 DATABASE SCHEMA

```
┌─────────────────────────────────────────────────────────────────┐
│  CORE MODELS                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────────────┐            │
│  │    User      │────────▶│  UserServiceAccess   │            │
│  ├──────────────┤         ├──────────────────────┤            │
│  │ id           │         │ id                   │            │
│  │ email        │         │ userId               │            │
│  │ name         │         │ service  ← ENUM      │            │
│  │ image        │         │ enabled              │            │
│  │ role         │         │ createdAt            │            │
│  │ planId       │         └──────────────────────┘            │
│  └──────────────┘                                              │
│        │                                                        │
│        │                                                        │
│        ├────────▶ Documents (PDF Service)                      │
│        │                                                        │
│        ├────────▶ Annotations (PDF Service)                    │
│        │                                                        │
│        ├────────▶ Conversations (AI Chat Service)              │
│        │                                                        │
│        └────────▶ [Future Service Models]                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  SERVICE TYPE ENUM                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  enum ServiceType {                                             │
│    PDF_ANNOTATOR                                                │
│    AI_CHAT                                                      │
│    // Add more services here                                   │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 MIDDLEWARE PROTECTION

```
┌─────────────────────────────────────────────────────────────────┐
│  MIDDLEWARE FLOW                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Request arrives                                                │
│       ↓                                                         │
│  ┌─────────────────────┐                                       │
│  │ Is user logged in?  │                                       │
│  └─────────┬───────────┘                                       │
│            │                                                    │
│     ┌──────┴──────┐                                            │
│     NO           YES                                            │
│     │             │                                             │
│     ↓             ↓                                             │
│  Redirect     Check route:                                     │
│  to /auth/    • /dashboard  → Allow                            │
│  login        • /services/* → Allow                            │
│               • /settings   → Allow                            │
│               • Other       → Proceed                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 COMPONENT STRUCTURE

```
components/
├── platform/
│   └── service-card.tsx       ← Dashboard cards
│
├── common/
│   ├── protected-shell.tsx    ← Service navigation (updated)
│   ├── logo-mark.tsx
│   ├── theme-toggle.tsx
│   └── user-menu.tsx
│
├── documents/                 ← PDF service components
│   ├── list.tsx
│   ├── dashboard-upload.tsx
│   └── ...
│
└── ui/                        ← shadcn/ui components
    └── ...
```

## 🎨 UI FLOW

```
User Journey:

1. NOT LOGGED IN
   ┌─────────────────┐
   │  Landing Page   │  Shows service preview
   │  (/)            │  CTA to sign up
   └────────┬────────┘
            │ Click "Sign In"
            ↓
   ┌─────────────────┐
   │  Login Page     │
   │  /auth/login    │
   └────────┬────────┘
            │ Authenticate
            ↓

2. LOGGED IN
   ┌─────────────────┐
   │  Dashboard      │  Shows service cards
   │  /dashboard     │  • PDF Annotator
   └────────┬────────┘  • AI Chat
            │            • More...
            │
      ┌─────┴─────┐
      │           │
      ↓           ↓
   ┌─────────┐ ┌─────────┐
   │ Service │ │ Service │
   │    1    │ │    2    │
   └─────────┘ └─────────┘
```

## 🚀 SCALABILITY PATTERN

```
Adding New Service:

Step 1: Database
  ├─ Add to ServiceType enum
  └─ Run migration

Step 2: Registry
  ├─ Add service definition
  └─ lib/services/registry.ts

Step 3: Frontend Routes
  ├─ app/(platform)/services/[new-service]/
  │   ├─ layout.tsx
  │   ├─ page.tsx
  │   └─ [feature]/
  └─ Automatically appears on dashboard!

Step 4: Backend Routes
  └─ app/api/services/[new-service]/
      ├─ route.ts
      └─ [endpoints]/

Total time: 15-30 minutes per service!
```

## 📊 BEFORE vs AFTER

```
BEFORE (Single-Purpose App):
├── app/
│   ├── app/           ← PDF only, hardcoded
│   └── gemma/chat/    ← Isolated, disconnected
└── api/
    ├── documents/     ← Mixed organization
    └── gemma/

AFTER (Multi-Service Platform):
├── app/
│   ├── (public)/      ← Public routes
│   │   └── page.tsx   ← Landing
│   └── (platform)/    ← Authenticated
│       ├── dashboard/ ← Service selector
│       ├── settings/  ← Global settings
│       └── services/  ← All services
│           ├── documents/
│           ├── ai-chat/
│           └── [future]/  ← Easy to add!
└── api/
    ├── auth/          ← Centralized
    └── services/      ← Clean organization
        ├── documents/
        ├── ai-chat/
        └── [future]/  ← Easy to add!
```

## 🎯 BENEFITS VISUALIZATION

```
┌────────────────────────────────────────────────────────────┐
│  SINGLE-PURPOSE                 MULTI-SERVICE              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ❌ Hard to add services      ✅ Add service in 15 min    │
│  ❌ Messy code organization   ✅ Clean, scalable structure │
│  ❌ Confusing routes          ✅ Clear /services/* pattern │
│  ❌ Mixed public/private      ✅ Proper route groups       │
│  ❌ No service selector       ✅ Professional dashboard    │
│  ❌ Hardcoded branding        ✅ Platform branding         │
│  ❌ Scattered APIs            ✅ Organized API structure   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

**This is your new architecture! 🏗️**

Each box represents real, working code that's been implemented.  
The structure is ready - just complete the path updates! 🚀
