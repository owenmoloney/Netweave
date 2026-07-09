# CURSOR BUILD PROMPT: Professional Network Visualization App ("Netweave")

> **Instructions for Cursor:** Read this entire document before writing a single line of code. This is a complete engineering specification. Follow it precisely. Where implementation choices are left to you, prefer simplicity and correctness over cleverness. Build in the order defined in the Development Phases section.

---

## 1. Product Overview

**Netweave** is a browser-based, interactive graph visualization tool for managing a personal professional network. The primary interface is a force-directed graph canvas where the user ("You") is the central node. From that anchor, users build a living map of people and companies they've encountered, with typed, annotated edges representing real relationships.

The app is a **single-user, local-first** tool. No multi-tenancy. No collaboration. The network is saved to a backend database and loaded on login. The experience should feel like a spatial, zoomable notebook — calm, dark, precise — not a social media product.

**Core value proposition:** Replace flat spreadsheets and contact lists with a navigable spatial memory of your professional world.

---

## 2. Core Features

### 2.1 Graph Canvas
- Force-directed graph rendered on an HTML5 Canvas (via D3 + custom rendering, NOT SVG for performance)
- Zoom (scroll wheel), pan (drag background), and node drag (drag individual nodes)
- Three node types: **Self** (1, fixed center), **Person**, **Company**
- Edges between: Self↔Person, Self↔Company, Person↔Company, Person↔Person
- Node labels render below nodes; truncate at 20 chars with ellipsis
- Edge thickness encodes relationship strength (1–5 scale → 1px–4px stroke)
- Nodes glow subtly on hover; selected node gets a highlight ring
- Cluster proximity: company nodes naturally attract their associated people nodes via a custom force modifier

### 2.2 Node Management
**Person node fields:**
- `id`: UUID (auto)
- `fullName`: string (required)
- `jobTitle`: string
- `companyId`: UUID (FK, optional — links to a Company node)
- `email`: string
- `linkedInUrl`: string
- `avatarInitials`: derived from fullName (auto)
- `notes`: rich text (plain text stored, rendered with line breaks)
- `createdAt`, `updatedAt`: timestamps

**Company node fields:**
- `id`: UUID (auto)
- `name`: string (required)
- `industry`: string
- `location`: string
- `website`: string
- `notes`: plain text
- `logoInitials`: derived from name (auto)
- `createdAt`, `updatedAt`: timestamps

### 2.3 Edge / Connection Management
**Edge fields:**
- `id`: UUID (auto)
- `sourceId`: UUID (FK → node id)
- `targetId`: UUID (FK → node id)
- `relationshipType`: enum — `['met_at_event', 'colleague', 'intro_by', 'client', 'mentor', 'recruiter', 'friend', 'other']`
- `howMet`: string
- `whereMet`: string (location or event name)
- `whyTalked`: string (context/purpose)
- `dateOfInteraction`: date
- `strength`: integer 1–5
- `followUpNotes`: plain text
- `createdAt`, `updatedAt`: timestamps

### 2.4 Node Detail Panel
- Slides in from the right (400px fixed-width drawer)
- Shows all node fields in view mode
- Inline edit mode (toggle with Edit button)
- Lists all edges connected to this node, with quick-navigate to the other end
- Delete node (with confirmation — warns that all edges will be removed)
- Add new edge from this node

### 2.5 Search
- Global search bar (Cmd+K shortcut) that fuzzy-searches all node names/titles
- Results appear in a floating dropdown; clicking a result pans+zooms to that node and opens its detail panel

### 2.6 Network Save/Load
- Auto-save on every mutation (debounced 500ms) via REST API
- Manual "Save" button in header as fallback
- On load, fetch full graph state and initialize the force simulation with saved x/y positions

---

## 3. User Flows

### Flow A: Add a new person and connect them
1. User clicks "+" button → dropdown: "Add Person" / "Add Company"
2. User selects "Add Person" → modal opens
3. User fills fullName (required), jobTitle, optionally selects existing Company from dropdown
4. On submit: Person node created, edge to Company auto-created if company selected, both appear on canvas
5. Canvas reflows with new node placed near its connected company (or near Self if no company)
6. Detail panel opens automatically for the new person

### Flow B: Add a connection between two existing nodes
1. User opens detail panel for Node A (click node)
2. Clicks "Add Connection" button
3. A modal opens: "Connect [Node A] to..." — searchable dropdown of all other nodes
4. User selects Node B, fills edge metadata (how/where met, strength, date)
5. On submit: edge appears on canvas immediately

### Flow C: Explore the network
1. User scrolls to zoom out, seeing full graph
2. Clicks a company cluster → zooms in (animated)
3. Clicks a person node → detail panel slides in
4. Sees all their connections listed; clicks one to navigate

### Flow D: Edit a node
1. User opens detail panel
2. Clicks "Edit"
3. Fields become input controls in place (no separate page)
4. "Save" / "Cancel" buttons appear
5. Save triggers optimistic UI update + API call

---

## 4. Recommended Tech Stack

### Frontend
| Layer | Library | Why |
|---|---|---|
| Framework | **React 18** with Vite | Fast DX, strong ecosystem, concurrent rendering for smooth animations |
| Graph rendering | **D3.js v7** (force simulation only) + **Canvas API** | D3's force layout is the gold standard; Canvas (not SVG) handles 500+ nodes without lag |
| State management | **Zustand** | Minimal boilerplate, works perfectly with Canvas-based rendering that doesn't need React re-renders for every tick |
| Styling | **Tailwind CSS v3** | Utility-first, consistent spacing; pair with CSS variables for the graph theme |
| UI components | **Radix UI** (primitives) | Accessible modals, dropdowns, tooltips without fighting styles |
| Forms | **React Hook Form** + **Zod** | Performant, schema-driven validation that mirrors backend schemas |
| HTTP client | **TanStack Query v5** | Caching, optimistic updates, loading/error states out of the box |
| Routing | **React Router v6** | Simple — only 2 routes: `/` (graph) and `/login` |
| Date handling | **date-fns** | Lightweight, tree-shakeable |
| Icons | **Lucide React** | Clean, consistent icon set |
| Search fuzzy match | **Fuse.js** | Client-side fuzzy search over node names |

### Backend
| Layer | Choice | Why |
|---|---|---|
| Runtime | **Node.js 20 + Express** | Simple REST API, well-understood, fast to scaffold |
| ORM | **Prisma** | Type-safe schema, auto-generates migrations, great DX with SQLite/PostgreSQL |
| Database | **SQLite** (dev) / **PostgreSQL** (prod) | SQLite for zero-config local dev; Prisma makes the swap trivial |
| Auth | **JWT** (stateless) + **bcrypt** | Simple single-user auth; no OAuth complexity needed |
| Validation | **Zod** (shared with frontend) | Share schema definitions between client and server via a `/shared` package |

### Dev Tooling
- **TypeScript** throughout (strict mode)
- **ESLint** + **Prettier**
- **Vitest** for unit tests
- **Playwright** for E2E tests
- Monorepo structure with **pnpm workspaces**: `/client`, `/server`, `/shared`

---

## 5. Frontend Architecture

```
/client
  /src
    /canvas           # All graph rendering logic
      GraphCanvas.tsx       # Main canvas component, owns the <canvas> element
      useForceSimulation.ts # D3 force simulation hook
      renderNodes.ts        # Pure functions: drawPersonNode, drawCompanyNode, drawSelfNode
      renderEdges.ts        # Pure functions: drawEdge, drawEdgeLabel
      useCanvasInteraction.ts # Hit-testing, drag, zoom, pan handlers
    /components
      /panels
        NodeDetailPanel.tsx   # Right-side drawer
        AddNodeModal.tsx      # Modal for creating Person/Company
        AddEdgeModal.tsx      # Modal for creating connections
      /ui                     # Radix-based design system components
        Button.tsx
        Input.tsx
        Select.tsx
        Modal.tsx
        Drawer.tsx
        Badge.tsx
    /hooks
      useGraph.ts       # Zustand store selectors + actions
      useSearch.ts      # Fuse.js search over nodes
      useKeyboard.ts    # Cmd+K and Escape handlers
    /stores
      graphStore.ts     # Zustand store (see State Management section)
    /api
      nodes.ts          # TanStack Query hooks: useNodes, useCreateNode, useUpdateNode, useDeleteNode
      edges.ts          # useEdges, useCreateEdge, useUpdateEdge, useDeleteEdge
      client.ts         # Axios instance with base URL + auth token interceptor
    /types
      index.ts          # Re-exports from /shared package
    /utils
      colors.ts         # Node color scheme by type
      geometry.ts       # Distance, hit-test helpers
    App.tsx
    main.tsx
```

---

## 6. Backend Architecture

```
/server
  /src
    /routes
      auth.ts           # POST /auth/login, POST /auth/register
      nodes.ts          # CRUD for Person and Company nodes
      edges.ts          # CRUD for edges
      graph.ts          # GET /graph — returns full graph state in one call
    /middleware
      auth.ts           # JWT verification middleware
      validate.ts       # Zod request body validation
    /services
      nodeService.ts    # Business logic (e.g., cascade delete edges on node delete)
      graphService.ts   # Assemble full graph payload
    prisma.ts           # Prisma client singleton
    app.ts              # Express app setup
    server.ts           # Entry point
```

---

## 7. Database Schema (Prisma)

```prisma
// /shared/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = env("DATABASE_PROVIDER") // "sqlite" or "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  nodes        Node[]
  edges        Edge[]
}

model Node {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      NodeType // SELF | PERSON | COMPANY
  // Shared fields
  notes     String?
  posX      Float?   // Last known canvas X position
  posY      Float?   // Last known canvas Y position
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // Person fields (null if Company)
  fullName  String?
  jobTitle  String?
  email     String?
  linkedInUrl String?
  companyId String?  // FK to another Node of type COMPANY
  // Company fields (null if Person)
  companyName String?
  industry    String?
  location    String?
  website     String?
  // Edges
  edgesFrom Edge[] @relation("EdgeSource")
  edgesTo   Edge[] @relation("EdgeTarget")

  @@index([userId])
}

enum NodeType {
  SELF
  PERSON
  COMPANY
}

model Edge {
  id                  String           @id @default(uuid())
  userId              String
  user                User             @relation(fields: [userId], references: [id])
  sourceId            String
  source              Node             @relation("EdgeSource", fields: [sourceId], references: [id], onDelete: Cascade)
  targetId            String
  target              Node             @relation("EdgeTarget", fields: [targetId], references: [id], onDelete: Cascade)
  relationshipType    RelationshipType @default(other)
  howMet              String?
  whereMet            String?
  whyTalked           String?
  dateOfInteraction   DateTime?
  strength            Int              @default(3) // 1–5
  followUpNotes       String?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@index([userId])
  @@index([sourceId])
  @@index([targetId])
}

enum RelationshipType {
  met_at_event
  colleague
  intro_by
  client
  mentor
  recruiter
  friend
  other
}
```

---

## 8. Graph Visualization Approach

### Rendering Pipeline
Do NOT use React for graph rendering. The canvas update loop must be independent of React's render cycle.

1. **D3 Force Simulation** runs in a Web Worker (or directly on the main thread with `requestAnimationFrame`). It computes node x/y positions each tick.
2. **Canvas 2D API** redraws the entire canvas each animation frame using the positions from step 1.
3. **React** only manages UI overlays: the detail panel, modals, search bar, and header.

```typescript
// useForceSimulation.ts — simplified structure
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(edges).id(d => d.id).distance(120).strength(0.4))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 20))
  // Custom force: pull person nodes toward their company node
  .force('company-gravity', companyGravityForce(nodes, edges, 0.15));
```

### Node Rendering
Each node type has a distinct visual:
- **Self node:** 48px circle, white fill, user's initials, thick border in accent color `#7C6DEB`
- **Person node:** 36px circle, dark fill `#1E293B`, colored initials, subtle glow on hover
- **Company node:** 36px rounded square (use `roundRect`), fill `#0F172A`, company initials

### Edge Rendering
- Draw edges first (under nodes)
- Edge color: base `rgba(255,255,255,0.15)`, brightens to `rgba(255,255,255,0.45)` on hover of connected node
- Stroke width maps from strength: `[1, 1.5, 2, 3, 4][strength - 1]`
- On hover, render a small tooltip mid-edge showing `relationshipType`

### Zoom/Pan
Maintain a `transform` object `{ x, y, scale }` in Zustand. Apply it via `ctx.setTransform()` before each draw call. Use `wheel` event for zoom (clamp scale to `0.1–3.0`), `mousedown`+`mousemove` for pan.

### Hit Testing
On every `mousemove` and `click`, convert mouse coords to graph-space using the inverse transform, then iterate all nodes checking `distance(mouse, node) < nodeRadius`. Use a spatial index (simple quadtree from D3) if node count exceeds 200.

---

## 9. Component Breakdown

### `GraphCanvas.tsx`
- Owns the `<canvas>` element via `useRef`
- Calls `useForceSimulation` to get live node positions
- Attaches `wheel`, `mousedown`, `mousemove`, `mouseup`, `click` handlers
- On `click`: dispatches `selectNode(id)` to Zustand store
- On `drag end`: dispatches `updateNodePosition(id, x, y)` + fires debounced API call to persist position
- No JSX children inside canvas — overlays are siblings in the parent

### `NodeDetailPanel.tsx`
- `position: fixed; right: 0; top: 0; height: 100vh; width: 400px`
- Slides in with CSS `transform: translateX(...)` animated via `transition`
- Reads `selectedNodeId` from Zustand; fetches node data from local store (not an API call — data is already in Zustand)
- Contains `PersonFields` or `CompanyFields` sub-component based on node type
- `EdgeList` sub-component: lists all edges; each item has a "Go to" button that calls `focusNode(id)` in Zustand (triggers canvas pan+zoom animation)

### `AddNodeModal.tsx`
- Controlled by Zustand `modalState.addNode`
- Uses React Hook Form with Zod schema validation
- Company selector is a searchable `<Select>` populated from existing Company nodes
- On submit: calls `useCreateNode` mutation (TanStack Query), which POSTs to API and updates Zustand store

### `AddEdgeModal.tsx`
- Pre-populates `sourceId` if opened from a node's detail panel
- Target selector: searchable dropdown of all nodes (filtered to valid targets — can't connect Company→Company)
- Strength selector: custom star-rating component (1–5 stars, rendered as SVG icons)

### `SearchBar.tsx`
- Fixed position, centered, hidden by default
- Triggered by `Cmd+K` (useKeyboard hook)
- Input feeds `useSearch` hook (Fuse.js)
- Selecting a result calls `focusNode(id)`: animates canvas to center that node, selects it, opens detail panel

### `Header.tsx`
- App name / logo (left)
- Node count stats: "12 people · 5 companies · 34 connections" (center)
- Save status indicator: "Saved" / "Saving..." / "Error" (right)
- Add button (right): dropdown "Add Person" / "Add Company"

---

## 10. State Management (Zustand)

```typescript
// /client/src/stores/graphStore.ts

interface GraphStore {
  // Data
  nodes: Map<string, Node>;          // Keyed by ID for O(1) lookup
  edges: Map<string, Edge>;          // Keyed by ID
  
  // Canvas state
  transform: { x: number; y: number; scale: number };
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  
  // UI state
  isPanelOpen: boolean;
  modal: 'addPerson' | 'addCompany' | 'addEdge' | null;
  addEdgeSourceId: string | null;    // Pre-fill for "add edge from this node"
  
  // Save state
  saveStatus: 'saved' | 'saving' | 'error';
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;  // Also removes all connected edges
  addEdge: (edge: Edge) => void;
  updateEdge: (id: string, updates: Partial<Edge>) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  focusNode: (id: string) => void;   // Pan+zoom canvas to node, then select it
  setTransform: (t: Partial<Transform>) => void;
  openModal: (modal: GraphStore['modal'], opts?: { sourceId?: string }) => void;
  closeModal: () => void;
  setSaveStatus: (status: GraphStore['saveStatus']) => void;
}
```

**Key invariant:** Nodes are stored in a `Map<string, Node>`, not an array. This allows `O(1)` lookup during hit testing, edge rendering, and panel population. Convert to array only when passing to D3 simulation.

---

## 11. API Requirements

### Base URL: `/api/v1`
### Auth: All routes except `/auth/*` require `Authorization: Bearer <jwt>` header

```
POST   /auth/register        Body: { email, password }
POST   /auth/login           Body: { email, password } → { token, userId }

GET    /graph                → { nodes: Node[], edges: Edge[] }  ← Load everything at once on app init

GET    /nodes                → Node[]
POST   /nodes                Body: NodeCreatePayload → Node
GET    /nodes/:id            → Node
PATCH  /nodes/:id            Body: Partial<NodeCreatePayload> → Node
DELETE /nodes/:id            → 204 (cascades to edges)

GET    /edges                → Edge[]
POST   /edges                Body: EdgeCreatePayload → Edge
GET    /edges/:id            → Edge
PATCH  /edges/:id            Body: Partial<EdgeCreatePayload> → Edge
DELETE /edges/:id            → 204

PATCH  /nodes/:id/position   Body: { x: number, y: number } → 204
  ↳ Separate lightweight endpoint for position saves (called on drag end, no heavy validation)
```

**Error format (all endpoints):**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "fieldName": "..." } } }
```

**On app init:** Client calls `GET /graph` once and populates the Zustand store. All subsequent reads are from the store (no polling). All mutations go through optimistic update → API call → revert on error.

---

## 12. Authentication

Single-user app. Auth is minimal but present:
- `POST /auth/register` creates the user and returns a JWT
- `POST /auth/login` returns a JWT
- JWT payload: `{ userId, email, iat, exp }`, 7-day expiry
- Token stored in `localStorage` (acceptable for this use case — no sensitive financial data)
- Axios interceptor reads token from localStorage and attaches to every request
- On 401 response: clear token, redirect to `/login`
- On app load: if no token in localStorage, redirect to `/login`
- **No password reset flow in v1** — out of scope

---

## 13. Saving and Loading Networks

### Loading (app init)
```typescript
// In App.tsx, before rendering GraphCanvas
const { data } = useQuery({
  queryKey: ['graph'],
  queryFn: () => api.get('/graph').then(r => r.data),
  staleTime: Infinity,  // Never refetch automatically — we manage state locally
});

useEffect(() => {
  if (data) {
    graphStore.setNodes(data.nodes);
    graphStore.setEdges(data.edges);
    initSimulation(data.nodes, data.edges);  // Seed D3 with saved positions
  }
}, [data]);
```

### Saving (mutations)
Every mutation (create/update/delete node or edge) does the following:
1. **Optimistic update:** Immediately update Zustand store (canvas redraws)
2. **API call:** Fire the corresponding REST endpoint
3. **On success:** Update Zustand with server-returned data (gets server timestamps, etc.)
4. **On error:** Revert Zustand store to pre-mutation state, show error toast

Node position saves (`PATCH /nodes/:id/position`) are debounced: fire 500ms after drag ends. They do NOT trigger optimistic update (position is already on canvas).

### Export (v1 stretch goal)
`GET /graph/export` returns JSON of the entire graph. Client offers a "Download JSON" button in settings. This is the escape hatch for users who want their data.

---

## 14. Visual Design Specification

**Aesthetic:** Deep-space observatory. Dark, precise, calm. The graph should look like a star map being annotated in real time.

**Color palette:**
- Background: `#070B14` (near-black blue)
- Canvas background: `#070B14` with a very subtle radial gradient `rgba(124,109,235,0.04)` at center
- Surface (panels, modals): `#0F172A`
- Surface elevated: `#1E293B`
- Accent primary: `#7C6DEB` (muted violet)
- Accent secondary: `#38BDF8` (sky blue — used for company nodes)
- Text primary: `#F1F5F9`
- Text muted: `#64748B`
- Danger: `#EF4444`
- Success: `#22C55E`

**Typography:**
- Display / headings: `Inter` (variable font, weight 600–700)
- Body: `Inter` (weight 400)
- Data / monospace (IDs, dates): `JetBrains Mono` (weight 400)
- Type scale: 12 / 14 / 16 / 20 / 24 / 32px

**Node visual spec:**
- Self: 48px circle, border `3px solid #7C6DEB`, fill `#1E293B`, initials in `#F1F5F9` at 18px bold
- Person: 36px circle, fill `#1E293B`, initials in accent color, `1px solid rgba(255,255,255,0.1)` border
- Company: 36px rounded rect (`borderRadius: 8px`), fill `#0F172A`, border `1px solid #38BDF8`
- Hover: add `shadowBlur: 20, shadowColor: accentColor` to `ctx` before drawing
- Selected: thick border `3px solid accentColor`, brighter shadow

**Signature design element:** The edges slowly pulse opacity (0.15 → 0.30 → 0.15) on a 4-second sine cycle, making the network feel alive. Stronger edges (strength 4–5) pulse brighter. Implement as a global `animationTime` value incremented each frame, passed to the edge draw function.

---

## 15. Development Phases

### Phase 1: Foundation (Days 1–3)
- [ ] Monorepo setup: pnpm workspaces, TypeScript config, ESLint, Prettier
- [ ] Prisma schema + migrations, seed script that creates a Self node for new users
- [ ] Express server: auth routes (register, login), JWT middleware
- [ ] React app scaffold: Vite, Tailwind, Zustand store skeleton, React Router
- [ ] `GET /graph` endpoint + client init query
- [ ] Basic canvas rendering: draw 3 hardcoded nodes (Self, 1 Person, 1 Company) with D3 force
- [ ] Zoom/pan working

### Phase 2: Core Graph (Days 4–7)
- [ ] All CRUD API routes for nodes and edges (with Zod validation)
- [ ] TanStack Query mutation hooks for all operations
- [ ] Add Person modal (form + API + canvas update)
- [ ] Add Company modal
- [ ] Add Edge modal (from detail panel or standalone)
- [ ] Node detail panel (view mode)
- [ ] Edit mode in detail panel
- [ ] Delete node (with cascade confirmation)
- [ ] Node hit testing + selection
- [ ] Position save on drag end

### Phase 3: Polish & Search (Days 8–10)
- [ ] Edge pulse animation
- [ ] Hover states (node glow, edge brighten)
- [ ] `focusNode` animation (smooth pan+zoom to node)
- [ ] Search bar (Cmd+K) with Fuse.js
- [ ] Edge detail in node panel (list all connections, go-to links)
- [ ] Save status indicator in header
- [ ] Error toast system
- [ ] Responsive layout (panel collapses on narrow viewport; canvas takes full width)

### Phase 4: Hardening (Days 11–14)
- [ ] Unit tests: Zustand store actions, graph service, Zod schemas
- [ ] E2E tests: add person → connect to company → verify graph (Playwright)
- [ ] Error boundary around canvas
- [ ] Loading skeleton for initial graph fetch
- [ ] 404 / disconnected state handling
- [ ] Input sanitization on backend
- [ ] Environment variable documentation (`.env.example`)

---

## 16. Future Features (Do Not Build in v1)

These are documented so the architecture supports them — do not implement now:

- **Timeline view:** Chronological feed of interactions (dateOfInteraction across all edges)
- **Strength decay:** Auto-dim edges where `dateOfInteraction` > 6 months ago
- **Import from LinkedIn CSV:** Parse LinkedIn connections export and bulk-create nodes/edges
- **Tags/Groups:** Color-code nodes by tag (e.g., "investors", "engineers")
- **Relationship graph analytics:** Degree centrality, bridge nodes, cluster detection (D3 has these)
- **Mobile app:** React Native, sharing the same API
- **Multi-user / team networks:** Shared graphs, requires full auth overhaul
- **Reminders:** "Follow up with X" surfaced on login (needs a jobs/notifications system)

---

## 17. Testing Requirements

### Unit Tests (Vitest)
- `graphStore.ts`: test all actions, especially `deleteNode` (verify edges removed), `focusNode` (verify transform computed correctly)
- `nodeService.ts`: test cascade delete logic
- `graphService.ts`: test that `/graph` response assembles correctly
- Zod schemas: test valid + invalid payloads for each endpoint

### Integration Tests (Vitest + Supertest)
- Auth flow: register → login → access protected route → 401 with bad token
- Full node lifecycle: create → read → update → delete
- Edge cascade: create person + company + edge → delete person → verify edge gone

### E2E Tests (Playwright)
```
test('user can add a person and company and connect them')
test('clicking a node opens the detail panel')
test('editing a node persists after page reload')
test('deleting a node removes it from the canvas')
test('search finds a node and focuses the canvas on it')
```

### Performance Target
- Canvas must maintain 60fps with 200 nodes and 400 edges on a mid-range laptop
- Initial graph load (cold cache) must complete under 800ms for 500-node networks
- All API mutations must resolve under 200ms (SQLite / local PostgreSQL)

---

## 18. File Naming and Code Conventions

- All React components: PascalCase, `.tsx` extension
- All hooks: camelCase, prefix `use`, `.ts` extension
- All utility functions: camelCase, `.ts` extension
- Zod schemas: named `[Entity]Schema`, e.g., `NodeCreateSchema`
- TypeScript types: named `[Entity]`, e.g., `Node`, `Edge`, `User` — exported from `/shared/src/types.ts`
- No default exports except React components and the Zustand store
- No `any` types — use `unknown` and narrow
- All API route handlers must be `async` and wrapped in try/catch

---

## 19. Environment Variables

```bash
# /server/.env
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
JWT_SECRET=change-this-in-production-to-a-random-64-char-string
PORT=3001

# /client/.env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

## 20. Getting Started Commands (for Cursor to scaffold)

```bash
# Root
pnpm init
pnpm add -w typescript prettier eslint

# Server
cd server && pnpm init
pnpm add express prisma @prisma/client zod bcrypt jsonwebtoken
pnpm add -D typescript @types/express @types/bcrypt @types/jsonwebtoken ts-node nodemon vitest supertest

# Client
cd client && pnpm create vite . --template react-ts
pnpm add react-router-dom zustand @tanstack/react-query axios d3 react-hook-form @hookform/resolvers zod date-fns fuse.js lucide-react @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-dropdown-menu tailwindcss
pnpm add -D @types/d3 vitest @playwright/test
```

---

*End of specification. Build Phase 1 first. Confirm each phase is working before proceeding to the next. Do not skip ahead.*
