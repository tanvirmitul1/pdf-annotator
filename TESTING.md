# TESTING.md

## Stack

- Vitest (unit, integration)
- Playwright (e2e)
- MSW (API mocks in component tests)
- @testing-library/react
- axe-core (a11y in CI)

## What to test

**Must-test:**

- Every API handler: auth, validation, ownership (cross-user 404), quota, happy path
- Every RTK Query endpoint: `providesTags`/`invalidatesTags` correctness
- Every reducer: all action types
- Every service function: business logic paths
- Every form: Zod validation, submit success, submit failure
- Every annotation tool: creates correct position data, renders back correctly after reload
- Viewer: scroll, zoom, search don't regress performance budget
- Auth: Google OAuth flow, credentials flow, session expiry
- Share links: read-only enforcement, expiry, revocation
- Soft delete: can restore within 30 days, gone after purge
- Account deletion: cascades correctly, audit preserved

**Skip-for-now:** pixel-perfect snapshot tests, testing library internals.

## e2e smoke suite (runs on deploy)

1. Signup → verify email → login
2. Upload PDF → see thumbnail → open viewer
3. Highlight text → add comment → tag it → reload → still there
4. Create share link → open in incognito → see read-only
5. Delete account grace → restore → delete confirm → gone

## Coverage target

- Lines: 70%
- Critical paths (auth, authz, quotas, annotation persistence): 90%

Don't chase coverage for its own sake.

## Test templates

### API handler test

```ts
// features/documents/__tests__/create.test.ts
describe('POST /api/documents', () => {
  it('401 when not authenticated', async () => {
    const res = await POST(mockRequest({ body: validBody }));
    expect(res.status).toBe(401);
  });

  it('400 on invalid body', async () => {
    const res = await POST(mockRequest({
      session: userA, body: { bogus: true }
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'VALIDATION_FAILED' }
    });
  });

  it('402 when storage quota exceeded', async () => {
    await seedUsage(userA.id, 'storageBytes', FREE_LIMIT);
    const res = await POST(mockRequest({
      session: userA, body: validBody
    }));
    expect(res.status).toBe(402);
  });

  it('creates document, increments usage, writes audit log', async () => {
    const res = await POST(mockRequest({
      session: userA, body: validBody
    }));
    expect(res.status).toBe(201);
    const doc = (await res.json()).data;
    expect(doc.userId).toBe(userA.id);

    const usage = await prisma.usage.findUnique({
      where: { userId_metric: { userId: userA.id, metric: 'documents' } }
    });
    expect(usage?.value).toBe(1);

    const audit = await prisma.auditLog.findFirst({
      where: { userId: userA.id, action: 'document.create' }
    });
    expect(audit).toBeTruthy();
  });

  it('rate limit returns 429', async () => {
    for (let i = 0; i < 21; i++) {
      await POST(mockRequest({ session: userA, body: validBody }));
    }
    const res = await POST(mockRequest({ session: userA, body: validBody }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});
```

### Cross-user access test (mandatory for every user-owned resource)

```ts
describe('cross-user access is rejected', () => {
  it('userB cannot GET userA document', async () => {
    const doc = await createDocument(userA.id, sample);
    const res = await GET_document(mockRequest({
      session: userB, params: { id: doc.id }
    }));
    expect(res.status).toBe(404); // 404 not 403 — no existence leak
  });

  it('userB cannot DELETE userA document', async () => {
    const doc = await createDocument(userA.id, sample);
    const res = await DELETE_document(mockRequest({
      session: userB, params: { id: doc.id }
    }));
    expect(res.status).toBe(404);
    const stillThere = await prisma.document.findUnique({
      where: { id: doc.id }
    });
    expect(stillThere?.deletedAt).toBeNull();
  });
});
```

### RTK Query endpoint test

```ts
it('invalidates Usage on document create', async () => {
  const store = makeStore();
  store.dispatch(documentsApi.endpoints.listDocuments.initiate({}));
  store.dispatch(planApi.endpoints.getUsage.initiate());

  server.use(
    rest.post('/api/documents', (_req, res, ctx) =>
      res(ctx.json({ data: mockDoc })))
  );

  const spy = jest.spyOn(store, 'dispatch');
  await store.dispatch(
    documentsApi.endpoints.createDocument.initiate(mockInput)
  );

  // Usage tag invalidated → getUsage refetches
  expect(spy).toHaveBeenCalledWith(
    expect.objectContaining({ type: expect.stringMatching(/invalidate/) })
  );
});
```

### Playwright e2e smoke

```ts
test('signup → upload → annotate → persist', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name=email]', `test-${Date.now()}@example.com`);
  await page.fill('[name=password]', 'Str0ngPa$$word!');
  await page.check('[name=acceptTerms]');
  await page.click('button:has-text("Create account")');
  await expect(page).toHaveURL('/app');

  await page.setInputFiles('input[type=file]', './fixtures/sample.pdf');
  await expect(page.locator('[data-testid=doc-card]').first()).toBeVisible();

  await page.locator('[data-testid=doc-card]').first().click();
  await expect(page.locator('[data-testid=pdf-page-1]')).toBeVisible();

  // Select text and highlight
  await page.locator('[data-testid=pdf-page-1]').dblclick();
  await page.click('[data-testid=toolbar-highlight]');
  await page.click('[data-testid=color-yellow]');
  await expect(page.locator('[data-testid=annotation]').first()).toBeVisible();

  // Reload and confirm persistence
  await page.reload();
  await expect(page.locator('[data-testid=annotation]').first()).toBeVisible();
});
```

## CI pipeline

Every PR:

1. Typecheck
2. Lint
3. Unit + integration tests
4. Build
5. Axe-core a11y scan on built pages
6. Lighthouse budget check
7. Bundle size check vs baseline

Merge blocked on any red.
