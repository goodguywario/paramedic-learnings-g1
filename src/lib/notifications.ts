import { SessionUser } from "./auth";

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

  if (process.env.EMAIL_SERVICE_API_KEY) {
    try {
      // This will be implemented in Story 8 with real email service
      // await emailService.send({
      //   to: payload.userEmail,
      //   subject: `Topic "${payload.topicTitle}" ${payload.action}`,
      //   body: ...
      // });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }
}

export async function notifyTopicSubscribers(
  topicId: number,
  topicTitle: string,
  action: "updated" | "conflict_flagged"
): Promise<void> {
  console.log(
    `[NOTIFICATION STUB] Would notify subscribers of topic "${topicTitle}" about ${action}`
  );
  // Story 8: Query subscriptions table and send email to all subscribers
}
