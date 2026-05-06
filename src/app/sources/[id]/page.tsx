import { db } from "@/db";
import { sources, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatAge } from "@/lib/utils";

const sourceTypeBadge: Record<string, string> = {
  debrief: "bg-blue-50 border-blue-200 text-blue-700",
  research: "bg-violet-50 border-violet-200 text-violet-700",
  guideline: "bg-amber-50 border-amber-200 text-amber-700",
  other: "bg-slate-100 border-slate-200 text-slate-600",
};

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [row] = await db
    .select({
      id: sources.id,
      title: sources.title,
      content: sources.content,
      sourceType: sources.sourceType,
      submittedBy: sources.submittedBy,
      topicId: sources.topicId,
      aiSummary: sources.aiSummary,
      suggestedTopicId: sources.suggestedTopicId,
      conflictFlag: sources.conflictFlag,
      conflictReason: sources.conflictReason,
      createdAt: sources.createdAt,
      suggestedTopicTitle: topics.title,
    })
    .from(sources)
    .leftJoin(topics, eq(sources.suggestedTopicId, topics.id))
    .where(eq(sources.id, id))
    .limit(1);

  if (!row) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/sources"
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8 inline-block"
      >
        ← Sources
      </Link>

      <div className="flex items-start gap-3 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
          {row.title}
        </h1>
        <span
          className={`mt-1.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${
            sourceTypeBadge[row.sourceType] ?? sourceTypeBadge.other
          }`}
        >
          {row.sourceType}
        </span>
        {row.conflictFlag && (
          <span className="mt-1.5 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 shrink-0">
            conflict flagged
          </span>
        )}
      </div>

      <p className="text-xs font-mono text-slate-400 mb-10">
        Submitted by {row.submittedBy} · {formatAge(row.createdAt)}
      </p>

      {/* Story 12 — AI summary */}
      {row.aiSummary && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AI Summary
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              AI-generated
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 border-l-4 border-l-emerald-500 bg-slate-50 px-6 py-5 text-sm text-slate-700 leading-relaxed">
            {row.aiSummary}
          </div>
        </div>
      )}

      {/* Story 13 — Suggested topic */}
      {row.suggestedTopicId && row.suggestedTopicTitle && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Suggested Topic
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              AI-generated
            </span>
          </div>
          <a
            href={`/topics/${row.suggestedTopicId}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            {row.suggestedTopicTitle}
            <span className="text-slate-400">→</span>
          </a>
        </div>
      )}

      {/* Story 14 — Conflict flag */}
      {row.conflictFlag && row.conflictReason && (
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Conflict Warning
          </div>
          <div className="rounded-lg border border-red-200 border-l-4 border-l-red-400 bg-red-50 px-6 py-5 text-sm text-red-800 leading-relaxed">
            {row.conflictReason}
          </div>
        </div>
      )}

      {/* Full source content */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Source content
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {row.content}
        </div>
      </div>
    </div>
  );
}
