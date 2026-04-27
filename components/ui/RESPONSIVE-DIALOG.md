# Responsive Dialog Component

A reusable, responsive dialog component that can be used across all modals in the application.

## Features

- **Responsive Design**: Automatically adapts to mobile and desktop screens
- **Configurable Sizes**: Choose from `sm`, `md`, `lg`, `xl`, `2xl`, or `full`
- **Flexible Positioning**: Support for `center`, `top`, `bottom`, or `slide-up` positions
- **Mobile-First**: Full-screen or slide-up behavior on mobile devices
- **Accessible**: Built on Radix UI Dialog with proper ARIA attributes
- **Consistent Styling**: Unified design system across all modals

## Usage

### Basic Usage

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/responsive-dialog"

function MyModal() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>My Modal Title</DialogTitle>
          <DialogDescription>
            Description of the modal content
          </DialogDescription>
        </DialogHeader>
        
        {/* Your content here */}
        <div>Modal content...</div>
      </DialogContent>
    </Dialog>
  )
}
```

### Size Options

```tsx
// Small modal
<DialogContent size="sm">...</DialogContent>

// Medium modal (default)
<DialogContent size="md">...</DialogContent>

// Large modal
<DialogContent size="lg">...</DialogContent>

// Extra large modal
<DialogContent size="xl">...</DialogContent>

// 2XL modal
<DialogContent size="2xl">...</DialogContent>

// Full width modal
<DialogContent size="full">...</DialogContent>
```

### Position Options

```tsx
// Centered (default)
<DialogContent position="center">...</DialogContent>

// Top position
<DialogContent position="top">...</DialogContent>

// Bottom sheet (mobile-friendly)
<DialogContent position="bottom">...</DialogContent>

// Slide-up animation
<DialogContent position="slide-up">...</DialogContent>
```

### Complete Example

```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/responsive-dialog"
import { Button } from "@/components/ui/button"

function DocumentShareDialog() {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        size="2xl" 
        position="center"
        className="gap-0 overflow-hidden rounded-2xl"
      >
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Invite teammates or create a public link.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* Content */}
        </div>

        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Responsive Behavior

### Mobile (< 640px)
- Dialogs use `w-[calc(100%-2rem)]` for consistent margins on all sides
- Padding is reduced (`p-4`) for better space utilization
- Font sizes are adjusted for readability
- Slide-up or bottom sheet positions work like native mobile sheets

### Desktop (>= 640px)
- Dialogs use the specified max-width based on size prop:
  - `sm`: 384px (14rem) - Small confirmations, alerts
  - `md`: 448px (17rem) - Forms, login, simple dialogs
  - `lg`: 512px (20rem) - Medium content, collaboration dialogs
  - `xl`: 576px (24rem) - Larger forms, detailed content
  - `2xl`: 672px (28rem) - Complex dialogs with multiple sections
  - `full`: Full width - Special use cases
- Standard padding (`p-6`) and spacing
- Centered positioning with proper animations

## Migration Guide

### From Old Dialog Component

**Before:**
```tsx
import { Dialog, DialogContent } from "@/components/ui/dialog"

<DialogContent className="max-w-2xl">
  {/* content */}
</DialogContent>
```

**After:**
```tsx
import { Dialog, DialogContent } from "@/components/ui/responsive-dialog"

<DialogContent size="2xl">
  {/* content */}
</DialogContent>
```

## Props

### DialogContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "full"` | `"md"` | Controls the maximum width of the dialog |
| `position` | `"center" \| "top" \| "bottom" \| "slide-up"` | `"center"` | Controls the position and animation of the dialog |
| `showCloseButton` | `boolean` | `true` | Whether to show the close button in the top-right corner |
| `className` | `string` | - | Additional Tailwind CSS classes |

## Size Guide

Choose the appropriate size based on your content:

| Size | Width | Use Case | Example |
|------|-------|----------|---------|
| `sm` | 384px | Delete confirmations, simple alerts | Delete document dialog |
| `md` | 448px | Login forms, simple inputs, shortcuts | Auth modal, keyboard shortcuts |
| `lg` | 512px | Collaboration dialogs, medium forms | Document collaboration |
| `xl` | 576px | Larger forms, detailed content | Settings dialogs |
| `2xl` | 672px | Complex dialogs with multiple sections | Document share dialog |
| `full` | 100% | Special full-screen dialogs | Image viewer, code editor |

### Examples

```tsx
// Small confirmation dialog
<DialogContent size="sm">
  <DialogTitle>Delete this item?</DialogTitle>
  {/* Simple yes/no confirmation */}
</DialogContent>

// Medium form or login
<DialogContent size="md">
  <DialogTitle>Sign In</DialogTitle>
  {/* Login form */}
</DialogContent>

// Large collaboration dialog
<DialogContent size="lg">
  <DialogTitle>Team Members</DialogTitle>
  {/* Member list and invite form */}
</DialogContent>

// Extra large complex dialog
<DialogContent size="2xl">
  <DialogTitle>Share Document</DialogTitle>
  {/* Multiple sections: links, invites, member list */}
</DialogContent>
```

## Best Practices

1. **Choose the right size**: Use the smallest size that fits your content comfortably
2. **Use ScrollArea for long content**: Wrap scrollable content in the ScrollArea component
3. **Responsive padding**: Use smaller padding on mobile (e.g., `p-4 sm:p-6`)
4. **Responsive font sizes**: Use responsive text classes (e.g., `text-xs sm:text-sm`)
5. **Flexible layouts**: Use flexbox with responsive direction (e.g., `flex-col sm:flex-row`)

## Examples in Codebase

- **Document Share Dialog**: `components/viewer/document-share-dialog.tsx`
- **Auth Modal**: `components/auth/auth-modal.tsx`
- **Shortcuts Overlay**: `components/viewer/shortcuts-overlay.tsx`
- **Document List Delete Confirm**: `components/documents/list.tsx`

## Notes

- The old `@/components/ui/dialog` component is still available but deprecated
- All new modals should use `@/components/ui/responsive-dialog`
- The responsive dialog maintains backward compatibility with the old API
