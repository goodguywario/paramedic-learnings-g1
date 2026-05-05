"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createTopic, type CreateTopicState } from "../actions";
import { AREAS } from "@/db/schema";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5";
const inputClass = "block w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors";

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return <p id={id} className="mt-1.5 text-xs text-red-600 font-mono">{messages[0]}</p>;
}

export function CreateTopicForm() {
  const [state, action, pending] = useActionState<CreateTopicState, FormData>(
    createTopic,
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
          placeholder="e.g. Airway Management"
          className={inputClass}
          aria-describedby={state?.errors?.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" messages={state?.errors?.title} />
      </div>

      <div>
        <label htmlFor="summary" className={labelClass}>
          Summary <span className="text-red-400">*</span>
        </label>
        <input
          id="summary"
          name="summary"
          type="text"
          placeholder="One-sentence description of the topic"
          className={inputClass}
          aria-describedby={state?.errors?.summary ? "summary-error" : undefined}
        />
        <FieldError id="summary-error" messages={state?.errors?.summary} />
      </div>

      <div>
        <label htmlFor="area" className={labelClass}>
          Area
        </label>
        <select
          id="area"
          name="area"
          className={inputClass}
          aria-describedby={state?.errors?.area ? "area-error" : undefined}
        >
          <option value="">— Select area (optional) —</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </option>
          ))}
        </select>
        <FieldError id="area-error" messages={state?.errors?.area} />
      </div>

      <div>
        <label htmlFor="guidance" className={labelClass}>
          Guidance <span className="text-red-400">*</span>
        </label>
        <textarea
          id="guidance"
          name="guidance"
          rows={8}
          placeholder="Full guidance text — procedures, protocols, and clinical recommendations for this topic…"
          className={`${inputClass} resize-y leading-relaxed`}
          aria-describedby={state?.errors?.guidance ? "guidance-error" : undefined}
        />
        <FieldError id="guidance-error" messages={state?.errors?.guidance} />
      </div>

      <div>
        <label htmlFor="rationale" className={labelClass}>
          Rationale
        </label>
        <textarea
          id="rationale"
          name="rationale"
          rows={4}
          placeholder="Why does this guidance exist? Evidence base, background, or clinical reasoning…"
          className={`${inputClass} resize-y leading-relaxed`}
          aria-describedby={state?.errors?.rationale ? "rationale-error" : undefined}
        />
        <FieldError id="rationale-error" messages={state?.errors?.rationale} />
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
              Saving…
            </>
          ) : (
            "Create Topic"
          )}
        </button>
        <Link
          href="/topics"
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
