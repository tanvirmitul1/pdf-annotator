# STATE.md

## Three layers, clear ownership

### 1. Server state → RTK Query (always)

Anything from the server. Never `useState` + `fetch`.

### 2. Global client state → Redux Toolkit slices

Persistent, cross-feature, app-wide: auth session, theme, toasts, modal stack, command palette, feature flags cache.

### 3. Ephemeral state → Zustand stores (scoped)

Component-tree-local, disposable: PDF viewer zoom, current page, active tool, in-flight draft annotation, selection state, panel open/closed within a session.

## Why Zustand and not Redux for viewer state

The viewer produces dozens of updates per second (scroll, zoom, cursor). Redux's immutable updates and devtools middleware add overhead and pollute the action log. Zustand has per-selector subscriptions with shallow equality and no action overhead.

Use it for anything that changes faster than ~10Hz or is strictly local to one mounted viewer instance.

If a piece of "ephemeral" state ends up needing to persist across navigation or be read from another feature, promote it to a Redux slice. Document the promotion in DECISIONS.md.

## RTK Query setup

### Base API

One base API in `/store/api.ts` with:

- `baseQuery` pointing to `/api`
- Global `prepareHeaders` (no auth header needed; we use cookies)
- `tagTypes`: see taxonomy below
- Inject endpoints per feature

Feature endpoints live in `/features/<domain>/api.ts` and use `api.injectEndpoints(...)`. This keeps the bundle splittable.

```ts
// store/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
  }),
  tagTypes: [
    'Me', 'Plan', 'Usage',
    'Document', 'Annotation', 'Tag', 'Collection',
    'Bookmark', 'ReadingProgress', 'ShareLink',
    'AuditLog',
  ],
  endpoints: () => ({}),
  keepUnusedDataFor: 60,
});
```

### Tag taxonomy

- `'Document'` (LIST and id)
- `'Annotation'` (LIST, id, and `LIST-${documentId}`)
- `'Tag'` (LIST, id)
- `'Collection'` (LIST, id)
- `'Bookmark'` (`LIST-${documentId}`, id)
- `'ReadingProgress'` (id = documentId)
- `'ShareLink'` (LIST, id)
- `'Plan'`, `'Usage'`, `'Me'`

Every query declares `providesTags`. Every mutation declares `invalidatesTags`. Missing tags = stale data bugs. Reviewers check this.

### Feature endpoint file pattern

```ts
// features/documents/api.ts
import { api } from '@/store/api';

export const documentsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listDocuments: b.query<Document[], ListDocumentsArgs>({
      query: (args) => ({ url: '/documents', params: args }),
      providesTags: (result) => result
        ? [
            ...result.map(d => ({ type: 'Document' as const, id: d.id })),
            { type: 'Document', id: 'LIST' },
          ]
        : [{ type: 'Document', id: 'LIST' }],
    }),

    getDocument: b.query<Document, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Document', id }],
    }),

    createDocument: b.mutation<Document, CreateDocumentInput>({
      query: (body) => ({ url: '/documents', method: 'POST', body }),
      invalidatesTags: [{ type: 'Document', id: 'LIST' }, 'Usage'],
    }),

    renameDocument: b.mutation<Document, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/documents/${id}`, method: 'PATCH', body: { name }
      }),
      async onQueryStarted({ id, name }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          documentsApi.util.updateQueryData('getDocument', id, (draft) => {
            draft.name = name;
          })
        );
        const listPatch = dispatch(
          documentsApi.util.updateQueryData('listDocuments', undefined, (draft) => {
            const doc = draft.find(d => d.id === id);
            if (doc) doc.name = name;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
          listPatch.undo();
        }
      },
    }),

    deleteDocument: b.mutation<void, string>({
      query: (id) => ({ url: `/documents/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Document', id },
        { type: 'Document', id: 'LIST' },
        'Usage',
      ],
    }),
  }),
});

export const {
  useListDocumentsQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useRenameDocumentMutation,
  useDeleteDocumentMutation,
} = documentsApi;
```

### Optimistic updates

Mutations that affect snappy UX (create annotation, toggle bookmark, rename document) MUST use `onQueryStarted` with `updateQueryData` for optimism, and `.undo()` on failure. Write a test for the rollback path.

### Annotation endpoints (high-frequency; optimistic is critical)

```ts
// features/annotations/api.ts
export const annotationsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listByDocument: b.query<Annotation[], string>({
      query: (documentId) => `/documents/${documentId}/annotations`,
      providesTags: (result, _e, docId) => [
        ...(result?.map(a => ({ type: 'Annotation' as const, id: a.id })) ?? []),
        { type: 'Annotation', id: `LIST-${docId}` },
      ],
    }),

    createAnnotation: b.mutation<Annotation, CreateAnnotationInput>({
      query: (body) => ({
        url: `/documents/${body.documentId}/annotations`,
        method: 'POST', body
      }),
      async onQueryStarted(input, { dispatch, queryFulfilled }) {
        const tempId = `temp-${crypto.randomUUID()}`;
        const optimistic = { ...input, id: tempId, createdAt: new Date().toISOString() };
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            'listByDocument', input.documentId, (draft) => {
              draft.push(optimistic as Annotation);
            }
          )
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            annotationsApi.util.updateQueryData(
              'listByDocument', input.documentId, (draft) => {
                const i = draft.findIndex(a => a.id === tempId);
                if (i >= 0) draft[i] = data;
              }
            )
          );
        } catch {
          patch.undo();
        }
      },
    }),

    updateAnnotation: b.mutation<Annotation, UpdateAnnotationInput>({
      query: ({ id, ...body }) => ({
        url: `/annotations/${id}`, method: 'PATCH', body
      }),
      async onQueryStarted({ id, documentId, ...changes }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            'listByDocument', documentId, (draft) => {
              const a = draft.find(a => a.id === id);
              if (a) Object.assign(a, changes);
            }
          )
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),
  }),
});
```

### Pagination

Use `serializeQueryArgs` + `merge` + `forceRefetch` pattern for infinite lists. Document one canonical example and reuse.

### Debouncing pattern (for chatty updates)

```ts
// hooks/useDebouncedMutation.ts
export function useDebouncedMutation<T, A>(
  trigger: (arg: A) => T,
  delay = 300
) {
  const latestArg = useRef<A | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const call = useCallback((arg: A) => {
    latestArg.current = arg;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (latestArg.current) trigger(latestArg.current);
    }, delay);
  }, [trigger, delay]);

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (latestArg.current) trigger(latestArg.current);
  }, [trigger]);

  useEffect(() => () => flush(), [flush]); // flush on unmount
  return { call, flush };
}
```

Use for annotation comment edits: call on every keystroke, flushes on blur or unmount.

## Redux slices

### Slice rules

- One slice per feature that owns global state.
- State is serializable (no Dates, Maps, class instances).
- Reducers are pure. Side effects go in RTK Query or thunks in `/features/<domain>/thunks.ts`.
- Selectors colocated with slice in `selectors.ts`. Memoize with `createSelector` for derived state.
- No direct state access in components; always selectors.

### Standard slices

- `features/auth/slice` — current session mirror, sign-out action
- `features/theme/slice` — `'light' | 'dark' | 'system'`
- `features/toasts/slice` — queue of toast messages
- `features/modals/slice` — active modal id + payload
- `features/commandPalette/slice` — open state + query

### Persistence

Use `redux-persist` for theme only. Don't persist server-state slices — RTK Query cache handles that through `keepUnusedDataFor`.

## Zustand stores

### Rules

- One store per viewer/editor instance. Create inside a provider component so mounting a new document gets a fresh store.
- Use the `create` + `subscribeWithSelector` middleware.
- Actions defined inside the store creator.
- Read via selector hooks to avoid unnecessary re-renders.

### Example — ViewerStore

```ts
// features/viewer/store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ViewerState {
  documentId: string;
  zoom: number;
  currentPage: number;
  rotation: 0 | 90 | 180 | 270;
  activeTool: ToolId;
  sidebarTab: SidebarTab | null;
  rightPanelAnnotationId: string | null;
  draft: AnnotationDraft | null;

  setZoom: (z: number) => void;
  setPage: (p: number) => void;
  setTool: (t: ToolId) => void;
  openAnnotation: (id: string) => void;
  closeAnnotation: () => void;
  startDraft: (d: AnnotationDraft) => void;
  updateDraft: (patch: Partial<AnnotationDraft>) => void;
  commitDraft: () => Promise<void>;
  discardDraft: () => void;
}

export const createViewerStore = (documentId: string) =>
  create<ViewerState>()(
    subscribeWithSelector((set, get) => ({
      documentId,
      zoom: 1,
      currentPage: 1,
      rotation: 0,
      activeTool: 'select',
      sidebarTab: 'thumbs',
      rightPanelAnnotationId: null,
      draft: null,

      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
      setPage: (currentPage) => set({ currentPage }),
      setTool: (activeTool) => set({ activeTool, draft: null }),
      openAnnotation: (id) => set({ rightPanelAnnotationId: id }),
      closeAnnotation: () => set({ rightPanelAnnotationId: null }),
      startDraft: (draft) => set({ draft }),
      updateDraft: (patch) => set({
        draft: get().draft ? { ...get().draft, ...patch } : null
      }),
      commitDraft: async () => {
        const { draft, documentId } = get();
        if (!draft) return;
        // dispatch to RTK Query here
        set({ draft: null });
      },
      discardDraft: () => set({ draft: null }),
    }))
  );
```

Mount per-document:

```ts
// components/viewer/ViewerProvider.tsx
const Context = createContext<StoreApi<ViewerState> | null>(null);

export function ViewerProvider({ documentId, children }: Props) {
  const storeRef = useRef<StoreApi<ViewerState>>();
  if (!storeRef.current) storeRef.current = createViewerStore(documentId);
  return <Context.Provider value={storeRef.current}>{children}</Context.Provider>;
}

export function useViewer<T>(selector: (s: ViewerState) => T): T {
  const store = useContext(Context);
  if (!store) throw new Error('useViewer outside provider');
  return useStore(store, selector);
}
```

## Forbidden patterns

- `useState` + `useEffect` for fetching. Use RTK Query.
- Mutating Redux state directly outside reducers. Immer is in Toolkit — use it, but only inside reducers.
- Subscribing to the whole Redux store in a component. Use selectors.
- Storing derived data. Derive with selectors.
- Cross-feature imports of slices. Cross-feature reads go through the feature's public API (`features/<name>/index.ts`).
