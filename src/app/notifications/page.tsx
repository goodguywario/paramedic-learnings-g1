import { db } from "@/db";
import { notifications, topics } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatAge } from "@/lib/utils";
import { markAllRead } from "./actions";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const rows = await db
    .select({
      id: notifications.id,
      message: notifications.message,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      topicId: notifications.topicId,
      topicTitle: topics.title,
    })
    .from(notifications)
    .leftJoin(topics, eq(notifications.topicId, topics.id))
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));

  const unreadCount = rows.filter((r) => !r.isRead).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Updates on topics you follow
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-2xl">🔔</span>
          </div>
          <p className="text-slate-500 font-medium">No notifications yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Subscribe to topics to be notified when guidance changes.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li key={n.id}>
              <a
                href={`/topics/${n.topicId}`}
                className={`flex items-start gap-4 rounded-lg border px-5 py-4 transition-all hover:shadow-sm hover:-translate-y-px ${
                  n.isRead
                    ? "border-slate-200 bg-white"
                    : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    n.isRead ? "bg-slate-300" : "bg-emerald-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="mt-1 text-xs font-mono text-slate-400">
                    {n.topicTitle && (
                      <span className="text-emerald-600">{n.topicTitle}</span>
                    )}{" "}
                    · {formatAge(n.createdAt)}
                  </p>
                </div>
                <span className="text-slate-300 text-sm shrink-0">→</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
