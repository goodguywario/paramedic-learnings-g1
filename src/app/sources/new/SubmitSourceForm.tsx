"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitSource, type SubmitSourceState } from "../actions";
import { SOURCE_TYPES } from "@/db/schema";

const labelClass =
  "block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5";
const inputClass =
  "block w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-600 font-mono">
      {messages[0]}
    </p>
  );
}

type TopicOption = { id: number; title: string };

export function SubmitSourceForm({ topics }: { topics: TopicOption[] }) {
  const [state, action, pending] = useActionState<SubmitSourceState, FormData>(
    submitSource,
    null
  );

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Post-cardiac arrest debrief — Station 4"
          className={inputClass}
          aria-describedby={state?.errors?.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" messages={state?.errors?.title} />
      </div>

      <div>
        <label htmlFor="sourceType" className={labelClass}>
          Source type <span className="text-red-400">*</span>
        </label>
        <select
          id="sourceType"
          name="sourceType"
          className={inputClass}
          aria-describedby={
            state?.errors?.sourceType ? "sourceType-error" : undefined
          }
        >
          <option value="">— Select type —</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <FieldError id="sourceType-error" messages={state?.errors?.sourceType} />
      </div>

      <div>
        <label htmlFor="topicId" className={labelClass}>
          Related topic{" "}
          <span className="text-slate-400 font-normal normal-case">
            (optional — AI will suggest one if left blank)
          </span>
        </label>
        <select
          id="topicId"
          name="topicId"
          className={inputClass}
          aria-describedby={
            state?.errors?.topicId ? "topicId-error" : undefined
          }
        >
          <option value="">— Let AI suggest —</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <FieldError id="topicId-error" messages={state?.errors?.topicId} />
      </div>

      <div>
        <label htmlFor="content" className={labelClass}>
          Content <span className="text-red-400">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          placeholder="Paste the full debrief report, research finding, or guideline text here…"
          className={`${inputClass} resize-y leading-relaxed`}
          aria-describedby={
            state?.errors?.content ? "content-error" : undefined
          }
        />
        <FieldError id="content-error" messages={state?.errors?.content} />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analysing…
            </>
          ) : (
            "Submit Source"
          )}
        </button>
        <Link
          href="/sources"
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {pending && (
        <p className="text-xs text-slate-400 font-mono">
          Running AI analysis — this may take a few seconds…
        </p>
      )}
    </form>
  );
}
