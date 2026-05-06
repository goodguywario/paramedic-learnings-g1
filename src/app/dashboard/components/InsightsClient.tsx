"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
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
        <div className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
              ul: ({ node, ...props }) => <ul className="mb-3 ml-4 list-disc" {...props} />,
              ol: ({ node, ...props }) => <ol className="mb-3 ml-4 list-decimal" {...props} />,
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-slate-900" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-slate-900" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-semibold mb-2 text-slate-900" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
              em: ({ node, ...props }) => <em className="italic" {...props} />,
              code: ({ node, inline, ...props }: any) =>
                inline ? (
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-900" {...props} />
                ) : (
                  <code className="block bg-slate-100 p-3 rounded mb-3 font-mono text-sm text-slate-900 overflow-x-auto" {...props} />
                ),
            }}
          >
            {insights}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
