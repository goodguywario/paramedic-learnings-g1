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
