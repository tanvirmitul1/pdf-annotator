export const ANALYTICS_CONSENT_COOKIE = "pdf-annotator-analytics-consent"

export type AnalyticsConsent = "accepted" | "rejected" | "unknown"

export type AnalyticsEvent =
  | { name: "user_signed_up"; props: { method: "google" | "credentials" } }
  | { name: "user_signed_in"; props: { method: "google" | "credentials" } }
  | { name: "user_signed_out"; props: Record<string, never> }
  | { name: "document_uploaded"; props: { pageCount: number; sizeMb: number; type: "pdf" | "image" } }
  | { name: "document_opened"; props: { documentId: string; pageCount: number } }
  | { name: "document_renamed"; props: { documentId: string } }
  | { name: "document_deleted"; props: { documentId: string } }
  | { name: "document_restored"; props: { documentId: string } }
  | { name: "document_downloaded"; props: { documentId: string; flavor: "original" | "annotated" } }
  | { name: "annotation_created"; props: { type: string; hasComment: boolean; tagCount: number } }
  | {
      name: "annotation_updated"
      props: { field: "comment" | "tags" | "color" | "status" | "assignee" }
    }
  | { name: "annotation_deleted"; props: { type: string } }
  | { name: "annotations_exported"; props: { format: "json" | "csv" | "md"; count: number } }
  | { name: "tag_created"; props: Record<string, never> }
  | { name: "collection_created"; props: Record<string, never> }
  | { name: "search_performed"; props: { scope: "global" | "document"; resultCount: number } }
  | { name: "share_link_created"; props: { hasPassword: boolean; expiresInDays: number } }
  | { name: "share_link_viewed"; props: { documentId: string } }
  | { name: "share_link_revoked"; props: Record<string, never> }
  | { name: "quota_exceeded"; props: { metric: string; current: number; limit: number } }
  | { name: "upgrade_cta_clicked"; props: { location: string } }
  | { name: "upload_failed"; props: { reason: string } }
  | { name: "viewer_error"; props: { error: string; documentId: string } }
