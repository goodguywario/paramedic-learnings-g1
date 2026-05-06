# Knowledge Base Chat Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating chat widget that lets authenticated users ask natural-language questions answered by the operational guidance in the database.

**Architecture:** A self-contained Client Component (`ChatWidget`) mounts in the root layout and renders a fixed bottom-right button and chat window. User messages are sent to a Server Action that searches topics/sources via ILIKE, builds a grounded LLM prompt using the existing `getLLMClient()`, and returns a response with source attributions. No new database tables are required.

**Tech Stack:** Next.js App Router, Drizzle ORM (`ilike`, `or`, `eq`), Tailwind CSS (slate palette), Anthropic SDK via `src/lib/llm-client.ts`, React `useState`/`useRef`/`useEffect`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/app/chat/actions.ts` | **Create** | Server Action: knowledge retrieval + LLM call |
| `src/app/components/ChatWidget.tsx` | **Create** | Client Component: floating button + chat window UI |
| `src/app/layout.tsx` | **Modify** | Mount `<ChatWidget />` inside `<body>` |

---

### Task 1: Chat Server Action

**Files:**
- Create: `src/app/chat/actions.ts`

- [ ] **Step 1: Create the file with all types and the `searchKnowledgeBase` helper**

Create `src/app/chat/actions.ts` with this exact content:

```typescript
"use server";

import { Anthropic } from "@anthropic-ai/sdk";
import { db } from "@/db";
import { topics, sources } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";
import { getLLMClient, getModelName } from "@/lib/llm-client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SourceAttribution {
  topicId: number;
  topicTitle: string;
  area: string | null;
}

export interface ChatResponse {
  content: string;
  sources: SourceAttribution[];
}

interface TopicContext {
  id: number;
  title: string;
  area: string | null;
  summary: string;
  guidance: string;
  sources: Array<{ title: string; content: string; sourceType: string }>;
}

async function searchKnowledgeBase(query: string): Promise<TopicContext[]> {
  const pattern = `%${query}%`;

  const matchedTopics = await db
    .select()
    .from(topics)
    .where(
      or(
        ilike(topics.title, pattern),
        ilike(topics.summary, pattern),
        ilike(topics.guidance, pattern),
      ),
    )
    .limit(5);

  const result: TopicContext[] = [];

  for (const topic of matchedTopics) {
    const topicSources = await db
      .select({
        title: sources.title,
        content: sources.content,
        sourceType: sources.sourceType,
      })
      .from(sources)
      .where(eq(sources.topicId, topic.id));

    result.push({
      id: topic.id,
      title: topic.title,
      area: topic.area,
      summary: topic.summary,
      guidance: topic.guidance,
      sources: topicSources,
    });
  }

  return result;
}

export async function chat(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const contextTopics = await searchKnowledgeBase(message);

  const contextBlock =
    contextTopics.length > 0
      ? contextTopics
          .map((t) => {
            const sourcesText =
              t.sources.length > 0
                ? t.sources
                    .map(
                      (s) =>
                        `  - ${s.title} (${s.sourceType}): ${s.content}`,
                    )
                    .join("\n")
                : "  - No sources attached";
            return `## ${t.title} (${t.area ?? "general"})\nSummary: ${t.summary}\nGuidance: ${t.guidance}\nSources:\n${sourcesText}`;
          })
          .join("\n\n")
      : "No specific topics matched your query. Answer based on general paramedic best practice.";

  const systemPrompt = `You are a knowledgeable assistant for paramedic personnel. Answer questions using the operational guidance below. Be concise, practical, and accurate. If the provided knowledge does not cover the question, say so clearly.

KNOWLEDGE BASE:
${contextBlock}`;

  const { client } = await getLLMClient();
  const modelName = getModelName();

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [...history, { role: "user", content: message }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );

  if (!textBlock) {
    throw new Error("No text response from LLM");
  }

  const attributions: SourceAttribution[] = contextTopics.map((t) => ({
    topicId: t.id,
    topicTitle: t.title,
    area: t.area,
  }));

  return {
    content: textBlock.text,
    sources: attributions,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see "ilike is not exported", verify `drizzle-orm` version ≥ 0.28 — it is (`^0.45.1` in package.json).

- [ ] **Step 3: Commit**

```bash
git add src/app/chat/actions.ts
git commit -m "feat: add chat Server Action with knowledge retrieval"
```

---

### Task 2: ChatWidget Client Component

**Files:**
- Create: `src/app/components/ChatWidget.tsx`

- [ ] **Step 1: Create the file**

Create `src/app/components/ChatWidget.tsx` with this exact content:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  chat,
  ChatMessage,
  SourceAttribution,
} from "@/app/chat/actions";

interface UIMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  sources?: SourceAttribution[];
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setIsLoading(true);

    const history: ChatMessage[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      const response = await chat(trimmed, history);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.content,
          sources: response.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "error",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-colors hover:bg-slate-700"
        aria-label={isOpen ? "Close chat" : "Open knowledge assistant"}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Knowledge Assistant
            </h2>
          </div>

          {/* Message list */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-sm text-slate-400">
                Ask me anything about the operational guidance.
              </p>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
                      {msg.content}
                    </div>
                  </div>
                )}

                {msg.role === "assistant" && (
                  <div className="flex flex-col gap-1">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex max-w-[85%] flex-wrap gap-1">
                        {msg.sources.map((s) => (
                          <a
                            key={s.topicId}
                            href={`/topics/${s.topicId}`}
                            className="text-xs text-slate-400 underline hover:text-slate-700"
                          >
                            {s.topicTitle}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.role === "error" && (
                  <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-1 px-3 py-2">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 px-3 py-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about guidance..."
                disabled={isLoading}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send"
                className="flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ChatWidget.tsx
git commit -m "feat: add ChatWidget client component"
```

---

### Task 3: Mount ChatWidget in Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add import and mount the widget**

Open `src/app/layout.tsx`. Make two changes:

**Add the import** after the existing imports (around line 4):

```tsx
import { ChatWidget } from "./components/ChatWidget";
```

**Mount the widget** inside `<body>`, after the closing `</footer>` tag and before `</body>`:

```tsx
        <ChatWidget />
      </body>
```

The full updated file should look like this:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserProfile from "./components/UserProfile";
import { ChatWidget } from "./components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paramedic Learnings",
  description:
    "A knowledge platform for ambulance personnel: capture and improve operational guidance with AI-assisted analysis and human approval.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-[family-name:var(--font-geist-sans)]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                Paramedic Learnings
              </span>
            </a>
            <div className="flex items-center gap-6">
              <a href="/topics" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Topics
              </a>
              <UserProfile />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
          Built for ambulance personnel — share knowledge, save lives.
        </footer>
        <ChatWidget />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify manually**

```bash
npm run dev
```

Open http://localhost:3000. You should see:
- A dark circular button in the bottom-right corner of every page
- Clicking it opens a chat window with a header "Knowledge Assistant" and a green dot
- Typing a message (e.g. "How do I manage cardiac arrest?") and submitting shows a user bubble on the right and an assistant response on the left
- Source topic links appear below the assistant response (e.g. "Cardiac Arrest Management")
- Typing a follow-up question uses the conversation history correctly
- Clicking the button again closes the window
- The button renders on /topics, /dashboard, and /topics/[id] — all routes

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: mount ChatWidget in root layout"
```
