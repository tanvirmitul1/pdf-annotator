# Admin Panel Enhancement Plan

## Phase 1: Error Logging System

### 1.1 Database Schema
**File**: `prisma/schema.prisma`

Add new `ErrorLog` model:
```prisma
model ErrorLog {
  id            String   @id @default(cuid())
  userId        String?
  userEmail     String?
  userName      String?
  errorType     ErrorType
  errorCode     String?
  message       String
  stack         String?  @db.Text
  url           String?
  method        String?
  statusCode    Int?
  userAgent     String?
  ipAddress     String
  metadata      Json?
  resolved      Boolean  @default(false)
  resolvedBy    String?
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
  
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([errorType])
  @@index([createdAt(sort: Desc)])
  @@index([resolved])
}

enum ErrorType {
  VALIDATION_ERROR
  AUTHENTICATION_ERROR
  AUTHORIZATION_ERROR
  NOT_FOUND_ERROR
  RATE_LIMIT_ERROR
  DATABASE_ERROR
  EXTERNAL_API_ERROR
  FILE_UPLOAD_ERROR
  PROCESSING_ERROR
  INTERNAL_SERVER_ERROR
  UNKNOWN_ERROR
}
```

**Migration**: `pnpm db:migrate --name add_error_logs`

### 1.2 Error Logging Service
**File**: `lib/error-logger.ts`

Create centralized error logging service:
- `logError(error, context)` - Main logging function
- `logApiError(error, request)` - API-specific logging
- `logClientError(error, context)` - Client-side error logging
- Auto-capture: user info, request details, stack trace, metadata

### 1.3 Global Error Handler
**File**: `lib/api/error-handler.ts`

Update existing error handler to log all errors:
- Integrate with error-logger service
- Capture all API errors automatically
- Include request context (method, URL, headers, body)
- Map error types to ErrorType enum

### 1.4 Client-Side Error Boundary
**File**: `components/error-boundary.tsx`

Create React Error Boundary:
- Catch client-side errors
- Send to `/api/errors/log` endpoint
- Show user-friendly error UI
- Include component stack trace

### 1.5 Error Logging API Routes
**Files**: 
- `app/api/errors/log/route.ts` - POST endpoint for client errors
- `app/api/admin/errors/route.ts` - GET list with filters
- `app/api/admin/errors/[id]/route.ts` - GET single, PATCH resolve
- `app/api/admin/errors/stats/route.ts` - GET error statistics

**Features**:
- Date range filtering (startDate, endDate)
- Error type filtering
- User filtering
- Search by message/stack
- Resolved status filtering
- Pagination support
- Mark as resolved functionality

### 1.6 RTK Query Integration
**File**: `features/admin/api.ts`

Add error log endpoints:
```typescript
listAdminErrors: builder.query<PaginatedErrors, ErrorFilters>
getAdminError: builder.query<ErrorLog, string>
resolveAdminError: builder.mutation<void, { id: string; notes?: string }>
getErrorStats: builder.query<ErrorStats, DateRange>
```

---

## Phase 2: Advanced UI Components

### 2.1 Custom Scrollbar Component
**File**: `components/ui/custom-scrollbar.tsx`

Create styled scrollbar wrapper:
- Use `react-custom-scrollbars-2` or CSS-only solution
- Match design system colors
- Smooth scrolling
- Auto-hide on desktop, always visible on mobile
- Thin, modern aesthetic

**Styles**:
```css
/* Webkit browsers */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: neutral-100; }
::-webkit-scrollbar-thumb { background: neutral-300; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: neutral-400; }

/* Firefox */
* { scrollbar-width: thin; scrollbar-color: neutral-300 neutral-100; }
```

### 2.2 Date Range Picker Component
**File**: `components/ui/date-range-picker.tsx`

Create professional date range picker:
- Use `react-day-picker` library
- Preset ranges: Today, Yesterday, Last 7 days, Last 30 days, This month, Custom
- Calendar popup with dual month view
- Time selection optional
- Clear button
- Responsive design

**Props**:
```typescript
interface DateRangePickerProps {
  value: { from: Date | null; to: Date | null }
  onChange: (range: DateRange) => void
  presets?: DateRangePreset[]
  showTime?: boolean
  placeholder?: string
}
```

### 2.3 Advanced Dropdown Component
**File**: `components/ui/advanced-dropdown.tsx`

Enhanced dropdown with:
- Search/filter within options
- Multi-select support
- Grouped options
- Custom option rendering
- Loading states
- Virtualization for large lists (react-window)
- Keyboard navigation
- Clear button

### 2.4 Enhanced Data Table
**File**: `components/admin/enhanced-data-table.tsx`

Improvements to existing DataTable:
- Custom scrollbar integration
- Column resizing
- Column visibility toggle
- Sticky header
- Row expansion for details
- Export to CSV functionality
- Density options (compact, comfortable, spacious)
- Column pinning (freeze columns)

**New Props**:
```typescript
interface EnhancedDataTableProps<T> extends DataTableProps<T> {
  resizable?: boolean
  expandable?: boolean
  expandedContent?: (item: T) => React.ReactNode
  density?: 'compact' | 'comfortable' | 'spacious'
  exportable?: boolean
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
}
```

### 2.5 Professional Filter Panel
**File**: `components/admin/filter-panel.tsx`

Redesigned filter system:
- Collapsible filter sidebar
- Filter chips showing active filters
- Save filter presets
- Clear all filters button
- Filter count badge
- Smooth animations

**Structure**:
```
┌─────────────────────────────────────┐
│ [Search Input]          [Filters ▼] │
├─────────────────────────────────────┤
│ Active: [Date: Last 7d ×] [Type ×]  │
└─────────────────────────────────────┘
```

---

## Phase 3: Error Logs Admin Page

### 3.1 Error Logs Page
**File**: `app/app/(main)/admin/errors/page.tsx`

Features:
- Date range filter (with presets)
- Error type multi-select
- User search/filter
- Resolved status toggle
- Search by message/stack
- Bulk resolve action
- Export filtered results
- Real-time stats cards (total, unresolved, by type)

**Layout**:
```
┌──────────────────────────────────────────────────┐
│ Error Logs                                       │
│ Monitor and resolve application errors           │
├──────────────────────────────────────────────────┤
│ [Total: 1,234] [Unresolved: 45] [Today: 12]     │
├──────────────────────────────────────────────────┤
│ [Search] [Date Range] [Type] [User] [Status]    │
│ Active: [Last 7 days ×] [Validation Error ×]    │
├──────────────────────────────────────────────────┤
│ ☐ Error Type    User      Message      Time     │
│ ☐ VALIDATION    john@...  Invalid...   2m ago   │
│ ☐ AUTH_ERROR    jane@...  Unauthor...  5m ago   │
└──────────────────────────────────────────────────┘
```

### 3.2 Error Detail Modal
**File**: `components/admin/error-detail-modal.tsx`

Detailed error view:
- Full error message
- Stack trace (formatted, syntax highlighted)
- Request details (URL, method, headers)
- User information
- Timestamp
- Metadata JSON viewer
- Mark as resolved button
- Add resolution notes
- Similar errors section

---

## Phase 4: UI/UX Improvements

### 4.1 Table Styling Overhaul
**Updates**: All admin table components

Improvements:
- Remove harsh borders, use subtle shadows
- Better spacing (more breathing room)
- Hover effects with smooth transitions
- Zebra striping optional
- Better typography hierarchy
- Status badges with icons
- Action buttons with tooltips
- Loading shimmer effects

**Design Tokens**:
```css
--table-border: 1px solid hsl(var(--neutral-200))
--table-shadow: 0 1px 3px rgba(0,0,0,0.05)
--table-hover: hsl(var(--neutral-50))
--table-selected: hsl(var(--primary) / 0.1)
--table-header-bg: hsl(var(--neutral-50))
--table-row-spacing: 1rem
```

### 4.2 Dropdown Styling
**Updates**: All Select components

Improvements:
- Smooth open/close animations
- Better focus states
- Search input at top for long lists
- Option icons support
- Grouped options with headers
- Loading skeleton
- Empty state message
- Max height with scroll

### 4.3 Responsive Design
**Updates**: All admin pages

Improvements:
- Mobile-optimized tables (card view on small screens)
- Collapsible filters on mobile
- Touch-friendly action buttons
- Swipe actions on mobile
- Bottom sheet for filters on mobile

### 4.4 Loading States
**Updates**: All admin pages

Improvements:
- Skeleton loaders matching actual content
- Shimmer animation
- Progressive loading (load visible rows first)
- Optimistic updates
- Error retry UI

---

## Phase 5: Developer Experience

### 5.1 Component Documentation
**File**: `components/admin/README.md`

Document all reusable components:
- Props interface
- Usage examples
- Styling customization
- Accessibility notes
- Performance considerations

### 5.2 Storybook Setup (Optional)
**Files**: `.storybook/` directory

Create stories for:
- DataTable with all variants
- FilterPanel
- DateRangePicker
- AdvancedDropdown
- All admin page layouts

### 5.3 Type Safety
**File**: `types/admin.ts`

Centralized type definitions:
- All admin API types
- Filter types
- Table column types
- Error log types
- Reusable generic types

### 5.4 Utility Functions
**File**: `lib/admin-utils.ts`

Helper functions:
- `formatErrorType(type)` - Human-readable error types
- `getErrorSeverity(error)` - Calculate severity
- `exportToCSV(data, filename)` - Export functionality
- `formatDateRange(range)` - Display date ranges
- `buildFilterQuery(filters)` - Convert filters to API params

---

## Implementation Order

### Sprint 1: Error Logging Foundation (2-3 hours)
1. Database schema + migration
2. Error logging service
3. Global error handler integration
4. Error logging API routes
5. RTK Query endpoints

### Sprint 2: Core UI Components (2-3 hours)
1. Custom scrollbar
2. Date range picker
3. Advanced dropdown
4. Enhanced data table
5. Filter panel

### Sprint 3: Error Logs Page (1-2 hours)
1. Error logs admin page
2. Error detail modal
3. Bulk actions
4. Export functionality

### Sprint 4: UI Polish (1-2 hours)
1. Table styling improvements
2. Dropdown styling
3. Responsive design
4. Loading states
5. Animations

### Sprint 5: Apply to All Pages (1 hour)
1. Update Users page with new components
2. Update Documents page
3. Update API Keys page
4. Update Activity page
5. Add date range filters to all

---

## Dependencies to Install

```bash
pnpm add react-day-picker date-fns
pnpm add react-window react-window-infinite-loader
pnpm add @tanstack/react-virtual
pnpm add react-syntax-highlighter
pnpm add @types/react-syntax-highlighter -D
```

---

## File Structure

```
app/
├── api/
│   ├── errors/
│   │   └── log/route.ts
│   └── admin/
│       └── errors/
│           ├── route.ts
│           ├── [id]/route.ts
│           └── stats/route.ts
├── app/(main)/admin/
│   └── errors/
│       └── page.tsx
components/
├── admin/
│   ├── enhanced-data-table.tsx
│   ├── filter-panel.tsx
│   ├── error-detail-modal.tsx
│   └── README.md
├── ui/
│   ├── custom-scrollbar.tsx
│   ├── date-range-picker.tsx
│   └── advanced-dropdown.tsx
├── error-boundary.tsx
lib/
├── error-logger.ts
├── admin-utils.ts
└── api/
    └── error-handler.ts
features/
└── admin/
    └── api.ts (update)
types/
└── admin.ts
prisma/
└── schema.prisma (update)
```

---

## Success Criteria

✅ All errors automatically logged to database
✅ Admin can view, filter, search error logs
✅ Date range filtering on all admin tables
✅ Custom scrollbars throughout admin panel
✅ Professional dropdown styling
✅ Mobile-responsive admin panel
✅ Export functionality for all tables
✅ Bulk actions on all tables
✅ Loading states and animations
✅ Type-safe throughout
✅ Well-documented components
✅ Scalable architecture for future features

---

## Future Enhancements (Post-MVP)

- Error grouping (similar errors)
- Error trends/analytics dashboard
- Email notifications for critical errors
- Slack/Discord integration
- Error replay (reproduce user session)
- Source map integration for stack traces
- Performance monitoring integration
- Custom error rules/alerts
- Error assignment to team members
- SLA tracking for error resolution
