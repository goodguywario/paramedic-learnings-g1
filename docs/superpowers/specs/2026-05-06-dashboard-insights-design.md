# Dashboard with AI-Generated Insights — Design Spec

**Date:** 2026-05-06  
**Feature:** Analytics dashboard showing aggregated insights about the topic collection  
**Stack:** Next.js App Router, Server Components, Drizzle ORM, Anthropic SDK (LM Studio + cloud fallback)

---

## Overview

The Dashboard page (`/dashboard`) displays aggregated AI-generated insights about the entire topic collection alongside a collapsible list of all topics. The page prioritizes insights (analytics view) with the topic list as secondary reference material.

**Key characteristic:** Insights are generated fresh on every page load by analyzing the current topic collection, ensuring analysis is always up-to-date.

---

## Requirements

### Functional Requirements

1. **Page Route:** `src/app/dashboard/page.tsx` — accessible at `/dashboard`
2. **Authentication:** Requires authenticated user (redirect to login if not)
3. **Insights Generation:**
   - Fetch all topics from database
   - Include basic metadata: title, area (clinical/operational category), source count
   - Call LLM to analyze and generate insights
   - Display prose insights (3-4 paragraphs of analysis)
4. **Topic List:**
   - Display all topics below insights in a scrollable container
   - Show: title, area, source count per topic
   - Each topic links to its detail page (`/topics/[id]`)
   - Keep secondary to insights (smaller, lower visual weight)
5. **Async Loading:**
   - Page renders immediately with topic list
   - Insights load asynchronously in parallel
   - Show loading state while insights are being generated
   - Handle errors gracefully if insight generation fails

### Non-Functional Requirements

- **Performance:** Insights should generate within 1-2 seconds (LM Studio) or 3-5 seconds (cloud API)
- **Consistency:** All topics in database are included in insights analysis
- **Reliability:** Graceful fallback if LM fails; page doesn't break
- **Security:** User must be authenticated; no unauthenticated dashboard access

---

## Architecture

### High-Level Data Flow

```
User navigates to /dashboard
    ↓
Server fetches topics + source counts from database
    ↓
Server renders DashboardPage with:
  - Topic list (rendered immediately)
  - InsightsClient component (client-side)
    ↓
Client hydrates and calls generateInsights() Server Action
    ↓
Server Action:
  - Calls getLLMClient() (auto-switches local/cloud)
  - Sends topics to LLM with analysis prompt
  - Returns prose insights
    ↓
Client receives insights and displays them
```

### Component Structure

#### **`src/app/dashboard/page.tsx`** (Server Component)

Responsibilities:
- Check user authentication (redirect if not authenticated)
- Fetch all topics with source counts from database
- Render page layout with topic list and insights container
- Pass topics to `<InsightsClient>` component

```typescript
// Pseudo-code structure
export default async function DashboardPage() {
  const user = await getAuthenticatedUser(); // throws if not authenticated
  const topics = await db.query.topics.findMany(); // with source counts
  
  return (
    <div>
      <h1>Dashboard</h1>
      <InsightsClient topics={topics} />
      <TopicList topics={topics} />
    </div>
  );
}
```

#### **`src/app/dashboard/components/InsightsClient.tsx`** (Client Component)

Responsibilities:
- Mount and call `generateInsights()` Server Action
- Manage loading/error/success states
- Display insights when received

```typescript
// Pseudo-code structure
"use client";

export function InsightsClient({ topics }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateInsights(topics)
      .then(setInsights)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [topics]);

  if (loading) return <div>Generating insights...</div>;
  if (error) return <div>Error: {error}</div>;
  return <InsightsBox text={insights} />;
}
```

#### **`src/app/dashboard/components/TopicList.tsx`** (Server or Client Component)

Responsibilities:
- Display all topics in a collapsible/scrollable container
- Show: title, area, source count
- Optional: links to topic detail pages

---

### Server Action: `generateInsights()`

**Location:** `src/app/dashboard/actions.ts`

**Signature:**
```typescript
export async function generateInsights(topics: TopicWithSourceCount[]): Promise<string>
```

**Inputs:**
- Array of topics with: `id`, `title`, `area`, `sourceCount`

**Process:**
1. Call `getLLMClient()` to get client (local LM Studio or cloud API)
2. Call `getModelName()` to determine which model to use
3. Format topics into a readable list for the prompt
4. Send to LLM with system prompt requesting 3-4 key insights
5. Parse response and extract text content
6. Return insights as string

**Prompt Strategy:**
- Provide context: "You are analyzing a medical guidance knowledge base"
- List all topics with area and source count
- Request specific types of insights:
  - Clinical area coverage (well-covered vs. sparse)
  - Patterns and gaps
  - Recommendations
- Request prose format (2-3 sentences per insight)

**Error Handling:**
- If LLM call fails (no API key, service down, etc.) → throw error with message
- If response has no text content → throw error "No insights generated"
- Client will catch and display error message

**Caching:** None — always generates fresh insights on page load

---

## UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Paramedic Learnings — Dashboard                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Insights                                                │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ [Generating insights...] (loading state)                │
│ OR                                                       │
│ {prose insights 3-4 paragraphs}                          │
│                                                          │
│ All Topics                                              │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ • Cardiac Arrest Management (Cardiac) — 5 sources       │
│ • Trauma Assessment (Trauma) — 3 sources                │
│ • Respiratory Distress (Respiratory) — 2 sources        │
│ [scroll or collapse]                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### States

- **Loading:** "Generating insights..." spinner or skeleton
- **Success:** Insights displayed in a card or box with prose text
- **Error:** Red error message with retry option or helpful guidance
- **Empty state:** If no topics exist (unlikely, but handle gracefully)

### Styling

- Follow existing Tailwind slate palette from `src/app/layout.tsx`
- Use `max-w-4xl` container width to match existing pages
- Insights box: card with border and subtle background (make it prominent)
- Topic list: simple ul/li list below insights, with subtle divider above it

---

## Database Schema Requirements

### Topics Table (already exists)
- `id` — primary key
- `title` — topic name
- `area` — clinical/operational area (nullable, one of AREAS enum)
- `createdAt`, `updatedAt` — timestamps

### Sources Table
Assumed to exist from the domain model. Schema:
- `id` — primary key
- `topicId` — foreign key to topics
- `sourceType` — type of source (debrief, research, etc.)

**Query pattern:** JOIN topics with sources, GROUP BY topic, COUNT sources

---

## Implementation Checklist

- [ ] Create `src/app/dashboard/page.tsx` (Server Component)
- [ ] Create `src/app/dashboard/actions.ts` with `generateInsights()` Server Action
- [ ] Create `src/app/dashboard/components/InsightsClient.tsx` (Client Component)
- [ ] Create `src/app/dashboard/components/TopicList.tsx` (display component)
- [ ] Add authentication check to dashboard page
- [ ] Write database query to fetch topics + source counts
- [ ] Implement LLM prompt and parsing logic
- [ ] Add error handling for missing API keys and LLM failures
- [ ] Add loading/error UI states
- [ ] Style with Tailwind to match existing pages
- [ ] Test with LM Studio (local) and fallback to cloud API
- [ ] Test error cases (no API key, LM unavailable, no topics)

---

## Edge Cases & Error Handling

1. **No topics in database**
   - Show empty state: "No topics yet. Create one to get started."
   - Still show insights container (can be "No insights available")

2. **LM fails to respond**
   - Don't crash the page
   - Show error: "Unable to generate insights. Please try again later."
   - Keep topic list visible

3. **User not authenticated**
   - Redirect to login page (standard Next.js pattern)

4. **API key missing**
   - Error from `getLLMClient()` will be caught
   - Show: "Configuration error. Please contact an administrator."

5. **LM Studio is down but cloud API available**
   - Auto-fallback handled by `getLLMClient()`
   - No special handling needed — insight generation still succeeds

---

## Testing Strategy

- **Unit:** Test `generateInsights()` Server Action with mocked LLM responses
- **Integration:** Fetch topics from database, call real LLM, verify insights contain expected keywords
- **E2E:** Load dashboard, wait for insights to appear, verify content and styling
- **Error cases:** Test missing API key, network failure, empty topic list

---

## Future Enhancements (Out of Scope)

- Caching insights in database (for performance on future visits)
- Scheduled insight regeneration (e.g., daily)
- User-specific insights (topics they're subscribed to)
- Visualization of topic coverage (charts/graphs)
- Export insights as PDF
