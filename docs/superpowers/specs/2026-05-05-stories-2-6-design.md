# Stories 2–6: Topic Discovery & Detail — Design Spec

**Date:** 2026-05-05
**Stories:** 2 (List), 3 (Search), 4 (Filter by area), 5 (View detail), 6 (See rationale)
**Builds on:** Story 1 (topic creation, `topics` table, `/topics` list page)

---

## Overview

This slice adds the full read-side of the topics feature: a filterable, searchable list and a detail page that shows guidance and rationale. No new tables are introduced. Two nullable columns are added to the existing `topics` table.

---

## Data Model

### Schema changes (`src/db/schema.ts`)

Add two nullable columns to the `topics` table:

```ts
area: text("area"),        // nullable — existing topics carry no area
rationale: text("rationale"),  // nullable — shown only when present
```

**Area values** — validated at the application layer via Zod enum (not a Postgres enum):

```ts
const AREAS = ["cardiac", "trauma", "respiratory", "neurological", "obstetrics", "pediatrics", "operations"] as const;
```

Using a Zod enum rather than a Postgres enum keeps migrations simple: adding a new area value requires only a code change, not a schema migration.

**Migration steps:**
1. Edit `src/db/schema.ts`
2. `npx drizzle-kit generate`
3. `npx drizzle-kit migrate`

### Impact on Story 1 form

`src/app/topics/new/CreateTopicForm.tsx` gets an optional `area` select field. The `CreateTopicSchema` in `actions.ts` adds `area: areaEnum.optional()`.

---

## List Page — Stories 2, 3, 4

**File:** `src/app/topics/page.tsx` (Server Component, extends existing implementation)

### URL state

Search and filter live in URL query params:

| Param | Type | Effect |
|---|---|---|
| `q` | string | `ilike` match on `title` OR `summary` |
| `area` | area enum value | `eq` match on `area` column |

The page signature becomes (Next.js 15 — `searchParams` is a `Promise`):

```ts
export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string }>;
}) {
  const { q, area } = await searchParams;
```
```

Invalid `area` values parse to `undefined` via Zod; the query runs without an area filter — no crash.

### Filter component

**File:** `src/app/topics/TopicFilters.tsx` (`"use client"`)

A single toolbar row containing:
- A text input (`placeholder="Search topics…"`) with a search icon
- An area `<select>` with "All areas" as the default option, followed by the seven area values

On `onChange`, the component calls `router.replace` with the updated params. No form submission, no full page navigation. The list re-renders as a server response to the new URL.

The filter component is rendered above the topic list inside `TopicsPage`.

### DB query

```ts
const conditions = [];
if (q) conditions.push(or(ilike(topics.title, `%${q}%`), ilike(topics.summary, `%${q}%`)));
if (area) conditions.push(eq(topics.area, area));

const results = await db
  .select({ ... })
  .from(topics)
  .where(conditions.length ? and(...conditions) : undefined)
  .orderBy(desc(topics.updatedAt));
```

### Empty states

- **No topics exist** → existing "No topics yet" prompt with create link (unchanged)
- **Search/filter returns nothing** → "No topics match your search" message with a "Clear filters" link that navigates to `/topics`

### Card display

Each card in the list gains a small area badge rendered next to the timestamp line:

```
system · 2d ago · [cardiac]
```

Badge uses `bg-emerald-50 text-emerald-700 border border-emerald-200` — consistent with the existing emerald accent palette.

---

## Detail Page — Stories 5 & 6

**File:** `src/app/topics/[id]/page.tsx` (new Server Component)

### Routing

Topic cards on the list page become `<a href="/topics/{id}">` wrappers. The existing card hover styles (`hover:border-slate-300 hover:shadow-sm`) already handle the link affordance.

### Data fetching

```ts
const id = Number(params.id);
if (!Number.isInteger(id)) notFound();

const topic = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
if (!topic[0]) notFound();
```

The integer guard runs before any DB query — `Number("abc")` returns `NaN` which is not an integer, so non-numeric IDs never reach Drizzle.

### Page layout (linear, top to bottom)

1. **Back link** — `← Topics` navigates to `/topics`
2. **Title** + optional area badge inline (badge hidden when `area` is null)
3. **Summary** — muted subtitle text
4. **Metadata line** — `Owned by {createdBy} · Updated {formatAge(updatedAt)}` in monospace
5. **Guidance section** — labelled `GUIDANCE`, rendered in a white bordered card
6. **Rationale section** — labelled `RATIONALE`, shown only when `topic.rationale` is non-null; styled with a left emerald border to distinguish it visually from guidance

Source linking for the rationale is deferred to Story 9 (Submit a debrief report) when source entities are introduced.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Unknown `area` param in URL | Zod parse returns `undefined`; query runs without area filter |
| Non-integer or missing `[id]` | `notFound()` called before DB query (integer guard) |
| Valid integer `[id]` with no matching row | `notFound()` called after DB query |
| DB error | Unhandled exception; Next.js default error boundary |

---

## Out of Scope

- Source linking on the rationale section (deferred to Story 9)
- Pagination of the topic list
- Sorting options beyond default `updatedAt desc`
- Subscription / notification features (stretch stories 7–8)
