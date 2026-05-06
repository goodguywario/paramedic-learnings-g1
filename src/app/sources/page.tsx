import Link from "next/link";
import { db } from "@/db";
import { sources, topics } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatAge } from "@/lib/utils";

const sourceTypeBadge: Record<string, string> = {
  debrief: "bg-blue-50 border-blue-200 text-blue-700",
  research: "bg-violet-50 border-violet-200 text-violet-700",
  guideline: "bg-amber-50 border-amber-200 text-amber-700",
  other: "bg-slate-100 border-slate-200 text-slate-600",
};

export default async function SourcesPage() {
  const rows = await db
    .select({
      id: sources.id,
      title: sources.title,
      sourceType: sources.sourceType,
      submittedBy: sources.submittedBy,
      conflictFlag: sources.conflictFlag,
      createdAt: sources.createdAt,
      suggestedTopicTitle: topics.title,
    })
    .from(sources)
    .leftJoin(topics, eq(sources.suggestedTopicId, topics.id))
    .orderBy(desc(sources.createdAt));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Sources
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Submitted evidence — debrief reports, research findings, and guidelines
          </p>
        </div>
        <Link
          href="/sources/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors shrink-0"
        >
          <span aria-hidden className="text-emerald-400">+</span>
          Submit Source
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <p className="text-slate-500 font-medium">No sources yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Submit the first debrief report or research finding.
          </p>
          <Link
            href="/sources/new"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Submit a source →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((source, i) => (
            <li
              key={source.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <a
                href={`/sources/${source.id}`}
                className="group flex items-start rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-150 hover:-translate-y-px"
              >
                <div
                  className={`w-1 self-stretch shrink-0 ${
                    source.conflictFlag ? "bg-red-400" : "bg-emerald-500"
                  }`}
                />
                <div className="flex-1 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-slate-900 leading-snug">
                        {source.title}
                      </h2>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          sourceTypeBadge[source.sourceType] ??
                          sourceTypeBadge.other
                        }`}
                      >
                        {source.sourceType}
                      </span>
                      {source.conflictFlag && (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          conflict flagged
                        </span>
                      )}
                    </div>
                    <span className="text-slate-300 text-sm group-hover:text-slate-400 transition-colors shrink-0 mt-0.5">
                      →
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-mono text-slate-400">
                    {source.submittedBy} · {formatAge(source.createdAt)}
                    {source.suggestedTopicTitle && (
                      <> · matched to {source.suggestedTopicTitle}</>
                    )}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
