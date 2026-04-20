# Repository Pattern

All database access for user-owned models must flow through repository helpers in this directory.

Rules:

- Route handlers never import raw `prisma.<model>` clients directly.
- Repositories for user-owned models accept `userId` and bake ownership filters into every query.
- Cross-user misses resolve to `null` so handlers can return `404` without leaking existence.
- Repositories `select` only the fields they need.

Example:

```ts
import { prisma } from "@/lib/db/prisma"

export function documentsFor(userId: string) {
  return {
    list: () =>
      prisma.document.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, name: true, lastOpenedAt: true },
      }),
  }
}
```
