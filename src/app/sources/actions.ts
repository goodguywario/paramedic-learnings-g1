"use server";

import { db } from "@/db";
import { sources, topics, SOURCE_TYPES } from "@/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { analyzeSource } from "@/lib/ai";

const SubmitSourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  sourceType: z.enum(SOURCE_TYPES, { error: "Source type is required" }),
  topicId: z.coerce.number().int().positive().optional(),
});

export type SubmitSourceState = {
  errors?: {
    title?: string[];
    content?: string[];
    sourceType?: string[];
    topicId?: string[];
  };
} | null;

export async function submitSource(
  _prevState: SubmitSourceState,
  formData: FormData
): Promise<SubmitSourceState> {
  const result = SubmitSourceSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    sourceType: formData.get("sourceType"),
    topicId: formData.get("topicId") || undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { title, content, sourceType, topicId } = result.data;

  // Fetch topics for AI analysis
  const allTopics = await db
    .select({
      id: topics.id,
      title: topics.title,
      summary: topics.summary,
      guidance: topics.guidance,
    })
    .from(topics);

  // Run AI analysis — degrade silently on failure
  let aiFields: {
    aiSummary?: string;
    suggestedTopicId?: number;
    conflictFlag?: boolean;
    conflictReason?: string;
  } = {};

  try {
    const analysis = await analyzeSource(
      { title, content, sourceType },
      allTopics,
      topicId
    );
    aiFields = {
      aiSummary: analysis.summary,
      suggestedTopicId: analysis.suggestedTopicId ?? undefined,
      conflictFlag: analysis.conflictFlag,
      conflictReason: analysis.conflictReason ?? undefined,
    };
  } catch {
    // AI unavailable — save without AI fields
  }

  const [inserted] = await db
    .insert(sources)
    .values({
      title,
      content,
      sourceType,
      submittedBy: "system",
      topicId: topicId ?? null,
      ...aiFields,
    })
    .returning({ id: sources.id });

  revalidatePath("/sources");
  redirect(`/sources/${inserted.id}`);
}
