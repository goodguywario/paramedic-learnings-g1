import { db } from "@/db";
import { topics } from "@/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { SubmitSourceForm } from "./SubmitSourceForm";

export default async function NewSourcePage() {
  const allTopics = await db
    .select({ id: topics.id, title: topics.title })
    .from(topics)
    .orderBy(asc(topics.title));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/sources"
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8 inline-block"
      >
        ← Sources
      </Link>

      <div className="mb-8 border-l-4 border-l-emerald-500 pl-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Submit a source
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit a debrief report, research finding, or guideline. AI will
          summarise it and check for conflicts with existing guidance.
        </p>
      </div>

      <SubmitSourceForm topics={allTopics} />
    </div>
  );
}
