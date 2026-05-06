import { db } from "@/db";
import { topics, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatAge } from "../utils";
import { SubscribeButton } from "../SubscribeButton";
import { getSessionUser } from "@/lib/auth";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [topic] = await db
    .select()
    .from(topics)
    .where(eq(topics.id, id))
    .limit(1);

  if (!topic) notFound();

  const user = await getSessionUser();
  let isSubscribed = false;

  if (user) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.topicId, id)))
      .limit(1);
    isSubscribed = !!subscription;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <a
        href="/topics"
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8 inline-block"
      >
        ← Topics
      </a>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            {topic.title}
          </h1>
          {topic.area && (
            <span className="mt-1.5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 shrink-0">
              {topic.area}
            </span>
          )}
        </div>
        <SubscribeButton topicId={id} initialSubscribed={isSubscribed} />
      </div>

      <p className="text-slate-500 text-lg mb-3 leading-relaxed">{topic.summary}</p>

      <p className="text-xs font-mono text-slate-400 mb-10">
        Owned by {topic.createdBy} · Updated {formatAge(topic.updatedAt)}
      </p>

      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Guidance
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {topic.guidance}
        </div>
      </div>

      {topic.rationale && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Rationale
          </div>
          <div className="rounded-lg border border-slate-200 border-l-4 border-l-emerald-500 bg-slate-50 px-6 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {topic.rationale}
          </div>
        </div>
      )}
    </div>
  );
}
