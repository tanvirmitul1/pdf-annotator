# ANALYTICS.md

PostHog for product analytics. All events typed.

## Event taxonomy (`/lib/analytics/events.ts`)

```ts
export type AnalyticsEvent =
  // Auth
  | { name: 'user_signed_up'; props: { method: 'google' | 'credentials' } }
  | { name: 'user_signed_in'; props: { method: 'google' | 'credentials' } }
  | { name: 'user_signed_out'; props: {} }

  // Documents
  | { name: 'document_uploaded'; props: { pageCount: number; sizeMb: number; type: 'pdf' | 'image' } }
  | { name: 'document_opened'; props: { documentId: string; pageCount: number } }
  | { name: 'document_renamed'; props: { documentId: string } }
  | { name: 'document_deleted'; props: { documentId: string } }
  | { name: 'document_restored'; props: { documentId: string } }
  | { name: 'document_downloaded'; props: { documentId: string; flavor: 'original' | 'annotated' } }

  // Annotations
  | { name: 'annotation_created'; props: { type: AnnotationType; hasComment: boolean; tagCount: number } }
  | { name: 'annotation_updated'; props: { field: 'comment' | 'tags' | 'color' } }
  | { name: 'annotation_deleted'; props: { type: AnnotationType } }
  | { name: 'annotations_exported'; props: { format: 'json' | 'csv' | 'md'; count: number } }

  // Organization
  | { name: 'tag_created'; props: {} }
  | { name: 'collection_created'; props: {} }
  | { name: 'search_performed'; props: { scope: 'global' | 'document'; resultCount: number } }

  // Share
  | { name: 'share_link_created'; props: { hasPassword: boolean; expiresInDays: number } }
  | { name: 'share_link_viewed'; props: { documentId: string } }
  | { name: 'share_link_revoked'; props: {} }

  // Quota & upgrade
  | { name: 'quota_exceeded'; props: { metric: string; current: number; limit: number } }
  | { name: 'upgrade_cta_clicked'; props: { location: string } }

  // Errors / friction (valuable for UX)
  | { name: 'upload_failed'; props: { reason: string } }
  | { name: 'viewer_error'; props: { error: string; documentId: string } };
```

## Tracking rules

- **Server-side events:** use `track(userId, event)` from `/lib/analytics`.
- **Client-side events:** use `usePostHog()` hook.
- **NEVER log PII** in props (no emails, no names, no document titles, no comment content).
- Sample high-volume events (scroll, zoom) at 1% or use feature timers instead.
- Every new event added to the union type. Type-check catches typos.

## Typed tracker

```ts
// lib/analytics/index.ts
import { AnalyticsEvent } from './events';

export function track<E extends AnalyticsEvent['name']>(
  userId: string,
  name: E,
  props: Extract<AnalyticsEvent, { name: E }>['props']
) {
  if (env.APP_ENV === 'development') return;
  posthog.capture({ distinctId: userId, event: name, properties: props });
}
```

## Funnels to track

1. **Activation:** signup → first upload → first annotation → return next day
2. **Engagement:** document open → annotation created → tag applied
3. **Upgrade intent:** quota exceeded → upgrade CTA clicked → billing page viewed → upgraded (future)

## Dashboards (set up in PostHog)

- Daily/weekly/monthly active users
- Activation funnel conversion
- Documents per active user (distribution)
- Annotations per active user (distribution)
- Error rate by route
- Upgrade CTA click-through by placement

## Consent & privacy

- EU users: PostHog disabled until cookie consent granted.
- Users can opt out in Settings → Privacy.
- Respect Do Not Track header.
- Never track in development.
