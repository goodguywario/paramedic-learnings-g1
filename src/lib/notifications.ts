import { db } from "@/db";
import { subscriptions, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface NotificationPayload {
  userId: number;
  topicId: number;
  topicTitle: string;
  userEmail: string;
  userName: string;
  action: "subscribed" | "updated" | "conflict_flagged";
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  console.log(
    `[NOTIFICATION STUB] Would send ${payload.action} notification to ${payload.userEmail}`,
    payload
  );
}

export async function notifyTopicSubscribers(
  topicId: number,
  topicTitle: string,
  action: "updated" | "conflict_flagged"
): Promise<void> {
  const subs = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.topicId, topicId));

  if (subs.length === 0) return;

  const message =
    action === "updated"
      ? `"${topicTitle}" has been updated with new guidance.`
      : `"${topicTitle}" may conflict with newly submitted evidence.`;

  await db.insert(notifications).values(
    subs.map(({ userId }) => ({ userId, topicId, message }))
  );
}
