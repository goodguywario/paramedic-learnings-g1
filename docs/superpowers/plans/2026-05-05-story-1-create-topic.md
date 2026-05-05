# Story 1: Create a Topic Manually — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full end-to-end thin slice for Story 1 — a form to create a topic (title, summary, guidance, creator name), persisted atomically in two tables, with a list page and a detail page as the redirect target.

**Architecture:** Co-located Server Action and Zod schema inside the route folder. Two Drizzle tables (`topics` + `topic_versions`) created in a three-step transaction. Playwright E2E tests written before implementation (TDD); tests go green as pages are added.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM 0.45+, PostgreSQL (Docker port 15432), Zod 4, React 19 (`useActionState`), Playwright, Tailwind CSS v4

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/db/schema.ts` | Drizzle table definitions for `topics` and `topic_versions` |
| Create | `src/app/topics/new/schema.ts` | Zod validation schema for the create-topic form |
| Create | `src/app/topics/new/actions.ts` | `createTopic` Server Action (transaction + redirect) |
| Create | `src/app/topics/new/TopicForm.tsx` | Client component — form UI with `useActionState` |
| Create | `src/app/topics/new/page.tsx` | Form page (Server Component wrapper) |
| Create | `src/app/topics/page.tsx` | Topic list page (Server Component) |
| Create | `src/app/topics/[id]/page.tsx` | Topic detail page (Server Component) |
| Create | `src/app/topics/[id]/not-found.tsx` | 404 page for unknown topic IDs |
| Modify | `src/app/page.tsx` | Add navigation links to list and form |
| Create | `playwright.config.ts` | Playwright base config + dev-server wiring |
| Create | `e2e/create-topic.spec.ts` | E2E tests covering Story 1 acceptance criteria |
| Modify | `package.json` | Add `test:e2e` script |
| Auto-generated | `drizzle/0000_*.sql` | Drizzle migration SQL |

---

## Task 1: Set Up Playwright

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
```

Expected: `@playwright/test` appears in `package.json` devDependencies.

- [ ] **Step 2: Install Chromium**

```bash
npx playwright install chromium
```

Expected: Download completes and ends with `Playwright build of chromium installed.`

- [ ] **Step 3: Add the test:e2e script to `package.json`**

Add `"test:e2e"` to the `scripts` block so the full block reads:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 4: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "chore: add Playwright for E2E testing"
```

---

## Task 2: Write Failing E2E Tests

**Files:**
- Create: `e2e/create-topic.spec.ts`

- [ ] **Step 1: Create `e2e/create-topic.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("creates a topic and sees it on the list and detail page", async ({ page }) => {
  await page.goto("/topics/new");

  await page.fill('[name="title"]', "Hypothermia Management");
  await page.fill('[name="summary"]', "Guidelines for managing hypothermia in prehospital settings.");
  await page.fill(
    '[name="guidanceText"]',
    "Do not actively rewarm a pulseless patient.\nMaintain horizontal position during transport.",
  );
  await page.fill('[name="createdBy"]', "Mario Test");

  await page.click('[type="submit"]');

  await expect(page).toHaveURL(/\/topics\/[0-9a-f-]+$/);
  await expect(page.locator("h1")).toContainText("Hypothermia Management");
  await expect(page.getByText("Mario Test")).toBeVisible();
  await expect(page.getByText("Do not actively rewarm")).toBeVisible();

  await page.goto("/topics");
  await expect(page.getByText("Hypothermia Management")).toBeVisible();
  await expect(page.getByText("Guidelines for managing hypothermia")).toBeVisible();
});

test("shows field errors when form is submitted empty", async ({ page }) => {
  await page.goto("/topics/new");
  await page.click('[type="submit"]');

  await expect(page).toHaveURL("/topics/new");
  await expect(page.getByText(/at least/i).first()).toBeVisible();
});

test("preserves input values after failed submission", async ({ page }) => {
  await page.goto("/topics/new");
  await page.fill('[name="title"]', "My Draft Topic");
  await page.click('[type="submit"]');

  await expect(page.locator('[name="title"]')).toHaveValue("My Draft Topic");
});
```

- [ ] **Step 2: Start Postgres and the dev server, then run the tests to confirm they fail**

In a terminal:
```bash
docker compose up -d
npm run dev
```

Wait for `Ready in ...ms`, then in another terminal:
```bash
npm run test:e2e
```

Expected: All 3 tests FAIL — the first because `/topics/new` does not exist yet (404 or wrong page). This is the expected "red" state before implementation.

- [ ] **Step 3: Commit**

```bash
git add e2e/create-topic.spec.ts
git commit -m "test: add failing E2E tests for Story 1 (red state)"
```

---

## Task 3: Define the Drizzle Schema and Run Migration

**Files:**
- Modify: `src/db/schema.ts`
- Auto-generated: `drizzle/0000_*.sql`

- [ ] **Step 1: Replace `src/db/schema.ts` entirely**

```ts
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  currentVersionId: uuid("current_version_id"),
});

export const topicVersions = pgTable("topic_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  guidanceText: text("guidance_text").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Note: `currentVersionId` has no FK constraint — a circular reference between `topics` and `topic_versions` would complicate the migration. The Server Action's transaction enforces consistency instead.

- [ ] **Step 2: Ensure Postgres is running**

```bash
docker compose up -d
```

Expected: Container already running or started successfully.

- [ ] **Step 3: Generate the migration**

```bash
npx drizzle-kit generate
```

Expected: A new file appears at `drizzle/0000_<auto-name>.sql` containing `CREATE TABLE "topics"` and `CREATE TABLE "topic_versions"` DDL statements.

- [ ] **Step 4: Apply the migration**

```bash
npx drizzle-kit migrate
```

Expected: Output ends with migration applied, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add topics and topic_versions schema + migration"
```

---

## Task 4: Create the Zod Validation Schema

**Files:**
- Create: `src/app/topics/new/schema.ts`

- [ ] **Step 1: Create `src/app/topics/new/schema.ts`**

```ts
import { z } from "zod";

export const createTopicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be at most 120 characters."),
  summary: z
    .string()
    .trim()
    .min(10, "Summary must be at least 10 characters.")
    .max(400, "Summary must be at most 400 characters."),
  guidanceText: z
    .string()
    .trim()
    .min(10, "Guidance must be at least 10 characters.")
    .max(10_000, "Guidance must be at most 10,000 characters."),
  createdBy: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(120, "Name must be at most 120 characters."),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors. If Zod emits a type error on the chain, confirm the import path is `from "zod"` — Zod 4 still exports from the root, not from `"zod/v4"`.

- [ ] **Step 3: Commit**

```bash
git add src/app/topics/new/schema.ts
git commit -m "feat: add Zod schema for topic creation"
```

---

## Task 5: Create the Server Action

**Files:**
- Create: `src/app/topics/new/actions.ts`

- [ ] **Step 1: Create `src/app/topics/new/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics, topicVersions } from "@/db/schema";
import { createTopicSchema, type CreateTopicInput } from "./schema";

export type FormState = {
  fieldErrors?: Partial<Record<keyof CreateTopicInput, string[]>>;
  formError?: string;
  values?: Partial<Record<keyof CreateTopicInput, string>>;
};

export async function createTopic(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    guidanceText: formData.get("guidanceText"),
    createdBy: formData.get("createdBy"),
  };

  const parsed = createTopicSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"],
      values: Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
      ) as FormState["values"],
    };
  }

  const newTopicId = await db.transaction(async (tx) => {
    const [topic] = await tx
      .insert(topics)
      .values({
        title: parsed.data.title,
        summary: parsed.data.summary,
        createdBy: parsed.data.createdBy,
      })
      .returning({ id: topics.id });

    const [version] = await tx
      .insert(topicVersions)
      .values({
        topicId: topic.id,
        guidanceText: parsed.data.guidanceText,
        createdBy: parsed.data.createdBy,
      })
      .returning({ id: topicVersions.id });

    await tx
      .update(topics)
      .set({ currentVersionId: version.id })
      .where(eq(topics.id, topic.id));

    return topic.id;
  });

  revalidatePath("/topics");
  redirect(`/topics/${newTopicId}`);
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors. The `"use server"` directive is resolved by the Next.js compiler; tsc may warn about unknown directives — that is expected and harmless.

- [ ] **Step 3: Commit**

```bash
git add src/app/topics/new/actions.ts
git commit -m "feat: add createTopic Server Action with transaction"
```

---

## Task 6: Create the TopicForm Client Component

**Files:**
- Create: `src/app/topics/new/TopicForm.tsx`

- [ ] **Step 1: Create `src/app/topics/new/TopicForm.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { createTopic, type FormState } from "./actions";

const initialState: FormState = {};

export function TopicForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createTopic,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.formError && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          {state.formError}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={state.values?.title ?? ""}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {state.fieldErrors?.title?.map((err) => (
          <p key={err} className="mt-1 text-sm text-red-600">
            {err}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-slate-700">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          maxLength={400}
          rows={3}
          defaultValue={state.values?.summary ?? ""}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {state.fieldErrors?.summary?.map((err) => (
          <p key={err} className="mt-1 text-sm text-red-600">
            {err}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="guidanceText" className="block text-sm font-medium text-slate-700">
          Guidance
        </label>
        <textarea
          id="guidanceText"
          name="guidanceText"
          required
          maxLength={10000}
          rows={8}
          defaultValue={state.values?.guidanceText ?? ""}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {state.fieldErrors?.guidanceText?.map((err) => (
          <p key={err} className="mt-1 text-sm text-red-600">
            {err}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="createdBy" className="block text-sm font-medium text-slate-700">
          Your name
        </label>
        <input
          id="createdBy"
          name="createdBy"
          type="text"
          required
          maxLength={120}
          defaultValue={state.values?.createdBy ?? ""}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {state.fieldErrors?.createdBy?.map((err) => (
          <p key={err} className="mt-1 text-sm text-red-600">
            {err}
          </p>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create topic"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/topics/new/TopicForm.tsx
git commit -m "feat: add TopicForm client component with useActionState"
```

---

## Task 7: Create the Form Page

**Files:**
- Create: `src/app/topics/new/page.tsx`

- [ ] **Step 1: Create `src/app/topics/new/page.tsx`**

```tsx
import { TopicForm } from "./TopicForm";

export default function NewTopicPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Create a topic</h1>
      <p className="mt-2 text-sm text-slate-500">
        Add a new operational guidance topic for the team.
      </p>
      <div className="mt-8">
        <TopicForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the form page renders in the browser**

Open `http://localhost:3000/topics/new`. You should see a form with four labelled fields and a "Create topic" button. Submitting an empty form should show inline error messages and stay on the same URL.

- [ ] **Step 3: Commit**

```bash
git add src/app/topics/new/page.tsx
git commit -m "feat: add /topics/new form page"
```

---

## Task 8: Create the Topic List Page

**Files:**
- Create: `src/app/topics/page.tsx`

- [ ] **Step 1: Create `src/app/topics/page.tsx`**

```tsx
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { topics, topicVersions } from "@/db/schema";

export default async function TopicsPage() {
  const rows = await db
    .select({
      id: topics.id,
      title: topics.title,
      summary: topics.summary,
    })
    .from(topics)
    .leftJoin(topicVersions, eq(topics.currentVersionId, topicVersions.id))
    .orderBy(desc(topics.createdAt));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Topics</h1>
        <Link
          href="/topics/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New topic
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-slate-500">
          No topics yet.{" "}
          <Link href="/topics/new" className="text-blue-600 hover:underline">
            Create the first one.
          </Link>
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200">
          {rows.map((row) => (
            <li key={row.id} className="py-4">
              <Link
                href={`/topics/${row.id}`}
                className="block text-lg font-medium text-slate-900 hover:text-blue-600"
              >
                {row.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">{row.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the list page renders in the browser**

Open `http://localhost:3000/topics`. You should see the "Topics" heading, a "+ New topic" button, and the empty-state message. After creating a topic via the form, refreshing this page should show it.

- [ ] **Step 3: Commit**

```bash
git add src/app/topics/page.tsx
git commit -m "feat: add /topics list page"
```

---

## Task 9: Create the Detail Page and Not-Found Page

**Files:**
- Create: `src/app/topics/[id]/not-found.tsx`
- Create: `src/app/topics/[id]/page.tsx`

- [ ] **Step 1: Create `src/app/topics/[id]/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Topic not found</h1>
      <p className="mt-4 text-slate-500">
        This topic does not exist or may have been removed.
      </p>
      <Link href="/topics" className="mt-6 inline-block text-blue-600 hover:underline">
        ← Back to topics
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/topics/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { topics, topicVersions } from "@/db/schema";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      title: topics.title,
      summary: topics.summary,
      createdBy: topics.createdBy,
      createdAt: topics.createdAt,
      guidanceText: topicVersions.guidanceText,
    })
    .from(topics)
    .innerJoin(topicVersions, eq(topics.currentVersionId, topicVersions.id))
    .where(eq(topics.id, id));

  if (!row) notFound();

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(row.createdAt);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/topics" className="text-sm text-slate-500 hover:text-slate-700">
        ← All topics
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">{row.title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {row.createdBy} · {formattedDate}
      </p>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Summary</h2>
        <p className="mt-2 text-slate-600">{row.summary}</p>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Guidance</h2>
        <p className="mt-2 whitespace-pre-line text-slate-600">{row.guidanceText}</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify both pages in the browser**

1. Submit the form at `/topics/new` with valid data — you should land on the detail page showing all four fields.
2. Visit `http://localhost:3000/topics/not-a-real-id` — you should see the "Topic not found" page, not a crash.

- [ ] **Step 4: Commit**

```bash
git add src/app/topics/[id]/page.tsx src/app/topics/[id]/not-found.tsx
git commit -m "feat: add /topics/[id] detail and not-found pages"
```

---

## Task 10: Add Navigation to the Home Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Paramedic Learnings
      </h1>
      <p className="mt-4 text-lg text-slate-500">
        A starting point for the agentic-coding course. The skeleton is intentionally empty — the
        user stories in{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700">
          docs/user-stories.md
        </code>{" "}
        are yours to implement.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Begin with <strong>Story 1: Create a topic manually</strong>.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/topics"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Browse topics
        </Link>
        <Link
          href="/topics/new"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Create a topic
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify home page shows the navigation buttons**

Open `http://localhost:3000`. You should see two buttons: "Browse topics" and "Create a topic". Both should navigate correctly.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add navigation links to home page"
```

---

## Task 11: Run E2E Tests and Verify All Pass

- [ ] **Step 1: Ensure prerequisites are running**

```bash
docker compose up -d
```

If the dev server is not already running, start it in a separate terminal and wait for `Ready in ...ms`:

```bash
npm run dev
```

- [ ] **Step 2: Run the full Playwright test suite**

```bash
npm run test:e2e
```

Expected output:
```
Running 3 tests using 1 worker

  ✓  [chromium] › create-topic.spec.ts:3:1 › creates a topic and sees it on the list and detail page
  ✓  [chromium] › create-topic.spec.ts:24:1 › shows field errors when form is submitted empty
  ✓  [chromium] › create-topic.spec.ts:33:1 › preserves input values after failed submission

  3 passed
```

- [ ] **Step 3: If any test fails, open the Playwright HTML report for traces and screenshots**

```bash
npx playwright show-report
```

Fix the issue, then re-run `npm run test:e2e` until all 3 pass.

- [ ] **Step 4: Run TypeScript and lint checks**

```bash
npx tsc --noEmit && npm run lint
```

Expected: No TypeScript errors, no lint errors.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Story 1 complete — create topic, list, and detail pages with E2E tests"
```
