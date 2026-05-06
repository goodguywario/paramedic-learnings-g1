import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function UserProfile() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
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
