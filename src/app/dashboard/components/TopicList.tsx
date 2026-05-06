import Link from "next/link";
import { TopicWithSourceCount } from "../actions";

interface TopicListProps {
  topics: TopicWithSourceCount[];
}

export function TopicList({ topics }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">No topics yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 border-t border-slate-200 pt-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">All Topics</h2>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
        <ul className="divide-y divide-slate-200">
          {topics.map((topic) => (
            <li key={topic.id} className="hover:bg-slate-50">
              <Link
                href={`/topics/${topic.id}`}
                className="block p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{topic.title}</h3>
                    {topic.area && (
                      <p className="mt-1 text-sm text-slate-500">
                        Area: <span className="text-slate-700">{topic.area}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-slate-600">
                      {topic.sourceCount} source{topic.sourceCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
