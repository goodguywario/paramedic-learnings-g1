"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

export async function markAllRead(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
