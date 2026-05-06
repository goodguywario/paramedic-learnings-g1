import { db } from "@/db";
import { topics, sources } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { InsightsClient } from "./components/InsightsClient";
import { TopicList } from "./components/TopicList";

export const metadata = {
  title: "Dashboard — Paramedic Learnings",
  description: "View insights about your knowledge base",
};

export default async function DashboardPage() {
  // TODO: Add authentication check (see Task 8)

  // Fetch all topics with source counts
  const topicsWithCounts = await db
    .select({
      id: topics.id,
      title: topics.title,
      area: topics.area,
      sourceCount: sql<number>`COUNT(${sources.id})`.mapWith(Number),
    })
    .from(topics)
    .leftJoin(sources, eq(topics.id, sources.topicId))
    .groupBy(topics.id)
    .orderBy(topics.title);

  // Transform to match TopicWithSourceCount interface
  const formattedTopics = topicsWithCounts.map((t) => ({
    id: t.id,
    title: t.title,
    area: t.area,
    sourceCount: t.sourceCount || 0,
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Insights about your operational guidance collection
          </p>
        </div>

        {/* Insights Section */}
        <InsightsClient topics={formattedTopics} />

        {/* Topics Section */}
        <TopicList topics={formattedTopics} />
      </div>
    </div>
  );
}
