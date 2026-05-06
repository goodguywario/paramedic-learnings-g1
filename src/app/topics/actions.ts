"use server";

import { db } from "@/db";
import { topics, AREAS, subscriptions } from "@/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { eq, and } from "drizzle-orm";

const CreateTopicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  guidance: z.string().min(1, "Guidance is required"),
  area: z.enum(AREAS).optional(),
  rationale: z.string().optional(),
});

export type CreateTopicState = {
  errors?: {
    title?: string[];
    summary?: string[];
    guidance?: string[];
    area?: string[];
    rationale?: string[];
  };
} | null;

export async function createTopic(
  _prevState: CreateTopicState,
  formData: FormData
): Promise<CreateTopicState> {
  const result = CreateTopicSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    guidance: formData.get("guidance"),
    area: formData.get("area") || undefined,
    rationale: formData.get("rationale") || undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await db.insert(topics).values({
    ...result.data,
    createdBy: "system",
  });

  revalidatePath("/topics");
  redirect("/topics");
}

export async function toggleSubscription(
  topicId: number
): Promise<{ isSubscribed: boolean }> {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.topicId, topicId)
      )
    )
    .limit(1);

  let isSubscribed: boolean;

  if (existing) {
    await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.topicId, topicId)
        )
      );
    isSubscribed = false;
  } else {
    await db.insert(subscriptions).values({
      userId: user.id,
      topicId: topicId,
    });
    isSubscribed = true;

    const [topic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, topicId))
      .limit(1);

    if (topic) {
      await sendNotification({
        userId: user.id,
        topicId,
        topicTitle: topic.title,
        userEmail: user.email,
        userName: user.name || "User",
        action: "subscribed",
      });
    }
  }

  revalidatePath(`/topics/${topicId}`);
  return { isSubscribed };
}
