# Subscriptions & Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Stories 7 and 8 — auth-aware subscribe/unsubscribe on topic pages, and in-app notifications when topic guidance is updated.

**Architecture:** Add a `notifications` table to store per-user notification records. When an authenticated user updates a topic's guidance, `notifyTopicSubscribers` inserts one notification row per subscriber. A `/notifications` page shows the current user's notifications with links back to the updated topics. Story 7's SubscribeButton already works for authenticated users; the only gap is hiding it gracefully from unauthenticated users.

**Tech Stack:** Next.js App Router, Drizzle ORM, PostgreSQL, Zod, Tailwind CSS v4

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `src/db/schema.ts` | Modify | Add `notifications` table |
| `src/lib/notifications.ts` | Modify | Implement `notifyTopicSubscribers` stub |
| `src/app/topics/actions.ts` | Modify | Add `updateTopicGuidance` server action |
| `src/app/topics/[id]/page.tsx` | Modify | Auth-aware SubscribeButton; show EditGuidanceForm for logged-in users |
| `src/app/topics/[id]/EditGuidanceForm.tsx` | Create | Client form for inline guidance editing |
| `src/app/notifications/page.tsx` | Create | Server page listing current user's notifications |
| `src/app/notifications/actions.ts` | Create | `markAllRead` server action |
| `src/app/components/UserProfile.tsx` | Modify | Add notifications link with unread count badge |

---

## Task 1: Auth-aware SubscribeButton (Story 7 gap)

**Files:**
- Modify: `src/app/topics/[id]/page.tsx`

Currently `SubscribeButton` renders for all users — unauthenticated users who click it get a silent no-op. Fix: render the button only when logged in, show a login link otherwise.

- [ ] **Step 1: Update topic detail page to conditionally render SubscribeButton**

Replace the `<SubscribeButton ... />` line in `src/app/topics/[id]/page.tsx`:

```tsx
{user ? (
  <SubscribeButton topicId={id} initialSubscribed={isSubscribed} />
) : (
  <a
    href={`/auth/login`}
    className="inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
  >
    Login to subscribe
  </a>
)}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Manual verification**

Start `npm run dev`. Open a topic page while logged out — confirm "Login to subscribe" link appears. Log in, reload — confirm "Subscribe" button appears.

---

## Task 2: Add notifications table to schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add `notifications` table to schema**

Add after the `subscriptionsRelations` block in `src/db/schema.ts`:

```typescript
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```
Expected: `Your SQL migration file ➜ drizzle/0005_*.sql`

- [ ] **Step 3: Apply migration**

```bash
npx drizzle-kit migrate
```
Expected: `✓ migrations applied successfully!`

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

---

## Task 3: Implement notifyTopicSubscribers

**Files:**
- Modify: `src/lib/notifications.ts`

Replace the entire file content:

```typescript
import { db } from "@/db";
import { subscriptions, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function notifyTopicSubscribers(
  topicId: number,
  topicTitle: string,
  action: "updated" | "conflict_flagged"
): Promise<void> {
  const subs = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.topicId, topicId));

  if (subs.length === 0) return;

  const message =
    action === "updated"
      ? `"${topicTitle}" has been updated with new guidance.`
      : `"${topicTitle}" may conflict with newly submitted evidence.`;

  await db.insert(notifications).values(
    subs.map(({ userId }) => ({ userId, topicId, message }))
  );
}
```

- [ ] **Step 1: Replace `src/lib/notifications.ts` with the implementation above**

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

---

## Task 4: Add updateTopicGuidance server action

**Files:**
- Modify: `src/app/topics/actions.ts`

- [ ] **Step 1: Add imports for the new action**

Add `update` to the drizzle-orm imports, and import `notifications` utility at the top of `src/app/topics/actions.ts`:

```typescript
import { eq, and, update } from "drizzle-orm";
import { notifyTopicSubscribers } from "@/lib/notifications";
```

Note: `update` is already available through the `db` object — the drizzle-orm import just needs `eq` and `and` which are already there. You only need to add the `notifyTopicSubscribers` import.

- [ ] **Step 2: Add the `updateTopicGuidance` action**

Append to the end of `src/app/topics/actions.ts`:

```typescript
const UpdateGuidanceSchema = z.object({
  guidance: z.string().min(1, "Guidance is required"),
});

export type UpdateGuidanceState = {
  error?: string;
  success?: boolean;
} | null;

export async function updateTopicGuidance(
  topicId: number,
  _prevState: UpdateGuidanceState,
  formData: FormData
): Promise<UpdateGuidanceState> {
  const user = await getSessionUser();
  if (!user) return { error: "Authentication required" };

  const result = UpdateGuidanceSchema.safeParse({
    guidance: formData.get("guidance"),
  });
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors.guidance?.[0] };
  }

  const [updated] = await db
    .update(topics)
    .set({ guidance: result.data.guidance, updatedAt: new Date() })
    .where(eq(topics.id, topicId))
    .returning({ title: topics.title });

  if (!updated) return { error: "Topic not found" };

  await notifyTopicSubscribers(topicId, updated.title, "updated");

  revalidatePath(`/topics/${topicId}`);
  return { success: true };
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

---

## Task 5: EditGuidanceForm component + wire into topic detail page

**Files:**
- Create: `src/app/topics/[id]/EditGuidanceForm.tsx`
- Modify: `src/app/topics/[id]/page.tsx`

- [ ] **Step 1: Create EditGuidanceForm client component**

Create `src/app/topics/[id]/EditGuidanceForm.tsx`:

```tsx
"use client";

import { useActionState, useState } from "react";
import { updateTopicGuidance, type UpdateGuidanceState } from "../actions";

const inputClass =
  "block w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors";

export function EditGuidanceForm({
  topicId,
  currentGuidance,
}: {
  topicId: number;
  currentGuidance: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const action = updateTopicGuidance.bind(null, topicId);
  const [state, formAction, pending] = useActionState<UpdateGuidanceState, FormData>(
    action,
    null
  );

  if (state?.success && isEditing) {
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="mt-3 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
      >
        Edit guidance
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <textarea
        name="guidance"
        rows={8}
        defaultValue={currentGuidance}
        className={`${inputClass} resize-y leading-relaxed`}
        autoFocus
      />
      {state?.error && (
        <p className="text-xs text-red-600 font-mono">{state.error}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            "Save & notify subscribers"
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Wire EditGuidanceForm into topic detail page**

In `src/app/topics/[id]/page.tsx`, add the import at the top:

```tsx
import { EditGuidanceForm } from "./EditGuidanceForm";
```

Then replace the guidance section (the read-only `<div>` block) with:

```tsx
<div className="mb-8">
  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
    Guidance
  </div>
  <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
    {topic.guidance}
  </div>
  {user && <EditGuidanceForm topicId={id} currentGuidance={topic.guidance} />}
</div>
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Manual verification**

Open a topic while logged in — "Edit guidance" link should appear below the guidance box. Click it, edit, save. Confirm the guidance updates. Check the DB to confirm a notification row was inserted for any subscriber.

---

## Task 6: Notifications page

**Files:**
- Create: `src/app/notifications/page.tsx`
- Create: `src/app/notifications/actions.ts`

- [ ] **Step 1: Create markAllRead server action**

Create `src/app/notifications/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

export async function markAllRead(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  revalidatePath("/notifications");
}
```

- [ ] **Step 2: Create notifications list page**

Create `src/app/notifications/page.tsx`:

```tsx
import { db } from "@/db";
import { notifications, topics } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatAge } from "@/lib/utils";
import { markAllRead } from "./actions";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const rows = await db
    .select({
      id: notifications.id,
      message: notifications.message,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      topicId: notifications.topicId,
      topicTitle: topics.title,
    })
    .from(notifications)
    .leftJoin(topics, eq(notifications.topicId, topics.id))
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));

  const unreadCount = rows.filter((r) => !r.isRead).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Updates on topics you follow
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-2xl">🔔</span>
          </div>
          <p className="text-slate-500 font-medium">No notifications yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Subscribe to topics to be notified when guidance changes.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li key={n.id}>
              <a
                href={`/topics/${n.topicId}`}
                className={`flex items-start gap-4 rounded-lg border px-5 py-4 transition-all hover:shadow-sm hover:-translate-y-px ${
                  n.isRead
                    ? "border-slate-200 bg-white"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    n.isRead ? "bg-slate-300" : "bg-emerald-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="mt-1 text-xs font-mono text-slate-400">
                    {n.topicTitle && (
                      <span className="text-emerald-600">{n.topicTitle}</span>
                    )}{" "}
                    · {formatAge(n.createdAt)}
                  </p>
                </div>
                <span className="text-slate-300 text-sm shrink-0">→</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

---

## Task 7: Add notifications link to nav

**Files:**
- Modify: `src/app/components/UserProfile.tsx`

Show a notifications link with an unread count badge, only when logged in.

- [ ] **Step 1: Update UserProfile to include notification count and link**

Replace the full content of `src/app/components/UserProfile.tsx`:

```tsx
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";

export default async function UserProfile() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <a
        href="/auth/login"
        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        Login
      </a>
    );
  }

  const [{ value: unreadCount }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return (
    <div className="flex items-center gap-4">
      <a
        href="/notifications"
        className="relative text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </a>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-emerald-700">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-sm">
          <p className="font-medium text-slate-900">{user.name || "User"}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
```

Note: This also adds a "Login" link for unauthenticated users where previously nothing was shown.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: End-to-end verification**

1. Sign up / log in as User A
2. Navigate to a topic — click Subscribe
3. Open a different browser / incognito as User B, log in
4. Navigate to the same topic, edit the guidance, save
5. Switch back to User A — the Notifications count in the nav should show `1`
6. Click Notifications — confirm the notification message appears with a link to the topic
7. Click "Mark all as read" — confirm the count disappears and the notification turns grey

---

## Self-Review

**Spec coverage:**
- Story 7 "Allow a user to subscribe from the topic page" ✅ — already done in dev branch
- Story 7 "Show whether the user is currently subscribed" ✅ — already done in dev branch
- Story 7 auth gap ✅ — Task 1
- Story 8 "Create a notification when a new topic version is published" ✅ — Tasks 2-5 (guidance update triggers notification insert)
- Story 8 "Include a link or reference to the updated topic" ✅ — Task 6 (notifications page links back to topic)

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:**
- `updateTopicGuidance` is defined in Task 4 and imported in Task 5's `EditGuidanceForm` ✅
- `notifications` table is defined in Task 2 and used in Tasks 3, 6, 7 ✅
- `markAllRead` is defined in Task 6's `actions.ts` and used in the page's form action ✅
- `formatAge` is imported from `@/lib/utils` (moved there in the sources feature) ✅
