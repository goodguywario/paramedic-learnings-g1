import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/db";
import { topics, AREAS } from "@/db/schema";
import { desc, ilike, eq, and, or } from "drizzle-orm";
import { z } from "zod";
import { TopicFilters } from "./TopicFilters";
import { formatAge } from "./utils";

const areaSchema = z.enum(AREAS).optional().catch(undefined);

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string }>;
}) {
  const { q: rawQ, area: rawArea } = await searchParams;
  const q = rawQ?.trim() || undefined;
  const area = areaSchema.parse(rawArea);

  const allTopics = await db
    .select({
      id: topics.id,
      title: topics.title,
      summary: topics.summary,
      createdBy: topics.createdBy,
      updatedAt: topics.updatedAt,
      area: topics.area,
    })
    .from(topics)
    .where(
      and(
        q ? or(ilike(topics.title, `%${q}%`), ilike(topics.summary, `%${q}%`)) : undefined,
        area ? eq(topics.area, area) : undefined,
      )
    )
    .orderBy(desc(topics.updatedAt));

  const isFiltered = Boolean(q || area);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Topics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Operational guidance for ambulance personnel
          </p>
        </div>
        <Link
          href="/topics/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors shrink-0"
        >
          <span aria-hidden className="text-emerald-400">+</span>
          New Topic
        </Link>
      </div>

      <div className="mb-6">
        <Suspense>
          <TopicFilters />
        </Suspense>
      </div>

      {allTopics.length === 0 && !isFiltered ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-slate-500 font-medium">No topics yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            Create the first operational guidance topic.
          </p>
          <Link
            href="/topics/new"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Create a topic →
          </Link>
        </div>
      ) : allTopics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-slate-500 font-medium">No topics match your search</p>
          <Link
            href="/topics"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-3"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {allTopics.map((topic, i) => (
            <li
              key={topic.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <a
                href={`/topics/${topic.id}`}
                className="group flex items-start rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-150 hover:-translate-y-px"
              >
                <div className="w-1 self-stretch bg-emerald-500 shrink-0" />
                <div className="flex-1 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-900 leading-snug">
                      {topic.title}
                    </h2>
                    <span className="text-slate-300 text-sm group-hover:text-slate-400 transition-colors shrink-0 mt-0.5">
                      →
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {topic.summary}
                  </p>
                  <p className="mt-3 text-xs font-mono text-slate-400">
                    {topic.createdBy} · {formatAge(topic.updatedAt)}
                    {topic.area && (
                      <>
                        {" · "}
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 font-sans">
                          {topic.area}
                        </span>
                      </>
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
