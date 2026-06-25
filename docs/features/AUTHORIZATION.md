# AUTHORIZATION.md

Read this before writing ANY database query or API route.

## The One Rule

Every query touching user-owned data filters by `userId` from the authenticated session. No exceptions.

**User-owned models:** Document, Annotation, Tag, Collection, Bookmark, ReadingProgress, ShareLink, Usage, AuditLog.

## Getting the user

- **Server Components:** `const user = await requireUser()` — throws if none.
- **Route handlers:** `const user = await requireUser()` at the top.
- **Never** trust userId from the request body or params. Always from session.

## The repository pattern

All DB access for user-owned models goes through `/lib/db/repositories`. Repositories take a `userId` and bake it into every query.

Example:

```ts
// lib/db/repositories/documents.ts
export function documentsFor(userId: string) {
  return {
    list: () => prisma.document.findMany({
      where: { userId, deletedAt: null }
    }),
    get: (id: string) => prisma.document.findFirst({
      where: { id, userId, deletedAt: null }
    }),
    // ...
  };
}
```

**Never** import the raw `prisma.document` client in route handlers. Use the repository. Grep for `prisma.document.` outside `/lib/db` — should return zero hits in route handlers.

## Existence leaks

When a resource exists but belongs to another user, return **404, not 403**. Never confirm existence to unauthorized users.

## Share links

ShareLink is the one exception: `/share/[token]` routes are public.

- Fetch by token, check `expiresAt` and `revokedAt`.
- Load document WITHOUT user scoping (token is the authorization).
- Render in strict read-only mode. Never render edit UI.
- Increment `viewCount`. Rate-limit by IP.

## Audit log

Every destructive action writes to `AuditLog`:

- create, update, delete, restore, share, revoke, export, login, password-change, plan-change, account-delete.

**Fields:** `userId`, `action`, `resourceType`, `resourceId`, `metadata`, `ipAddress`.

## Tests required

For every user-owned resource, write an integration test proving that user A cannot read/update/delete user B's resource (expects 404).

```ts
describe('cross-user access is rejected', () => {
  it('userB cannot GET userA document', async () => {
    const doc = await createDocument(userA.id, sample);
    const res = await GET_document(mockRequest({
      session: userB, params: { id: doc.id }
    }));
    expect(res.status).toBe(404); // 404 not 403 — no existence leak
  });
});
```
