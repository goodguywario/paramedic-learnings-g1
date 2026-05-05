"use server";

import { db } from "@/db";
import { topics, AREAS } from "@/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
