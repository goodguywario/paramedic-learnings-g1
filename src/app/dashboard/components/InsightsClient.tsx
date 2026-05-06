"use client";

import { useEffect, useState } from "react";
import { generateInsights, TopicWithSourceCount } from "../actions";

interface InsightsClientProps {
  topics: TopicWithSourceCount[];
}

export function InsightsClient({ topics }: InsightsClientProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);
        const result = await generateInsights(topics);
        if (mounted) {
          setInsights(result);
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
          console.error("[InsightsClient] Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchInsights();

    return () => {
      mounted = false;
    };
  }, [topics]);

  return (
    <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Insights</h2>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mb-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
            <p className="text-sm text-slate-600">Generating insights...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded bg-red-50 p-4">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
          <p className="mt-2 text-xs text-red-600">
            Try refreshing the page, or check that your LM Studio server is running.
          </p>
        </div>
      )}

      {insights && !loading && (
        <div className="prose prose-sm max-w-none text-slate-700">
          <p className="whitespace-pre-wrap">{insights}</p>
        </div>
      )}
    </div>
  );
}
