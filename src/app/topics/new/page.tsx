import Link from "next/link";
import { CreateTopicForm } from "./CreateTopicForm";

export default function NewTopicPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <Link
          href="/topics"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <span aria-hidden>←</span>
          Topics
        </Link>
        <div className="border-l-4 border-emerald-500 pl-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            New Topic
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add a new piece of operational guidance for ambulance personnel.
          </p>
        </div>
      </div>

      <CreateTopicForm />
    </div>
  );
}
