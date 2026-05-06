import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, count } from "drizzle-orm";

export default async function UserProfile() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <a
        href="/auth/login"
        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        Login
      </a>
    );
  }

  const [{ value: unreadCount }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return (
    <div className="flex items-center gap-4">
      <a
        href="/notifications"
        className="relative text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
            {unreadCount}
          </span>
        )}
      </a>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-emerald-700">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-sm">
          <p className="font-medium text-slate-900">{user.name || "User"}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
