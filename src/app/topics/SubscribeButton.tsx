"use client";

import { useState } from "react";
import { toggleSubscription } from "./actions";

export function SubscribeButton({
  topicId,
  initialSubscribed,
}: {
  topicId: number;
  initialSubscribed: boolean;
}) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      const result = await toggleSubscription(topicId);
      setIsSubscribed(result.isSubscribed);
    } catch (error) {
      console.error("Failed to toggle subscription:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
          isSubscribed
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPending ? "..." : isSubscribed ? "✓ Subscribed" : "Subscribe"}
      </button>
      {isSubscribed && (
        <span className="text-sm text-slate-500">
          You're subscribed to updates
        </span>
      )}
    </div>
  );
}
