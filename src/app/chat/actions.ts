"use server";

import { Anthropic } from "@anthropic-ai/sdk";
import { db } from "@/db";
import { topics, sources } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";
import { getLLMClient, getModelName } from "@/lib/llm-client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SourceAttribution {
  topicId: number;
  topicTitle: string;
  area: string | null;
}

export interface ChatResponse {
  content: string;
  sources: SourceAttribution[];
}

interface TopicContext {
  id: number;
  title: string;
  area: string | null;
  summary: string;
  guidance: string;
  sources: Array<{ title: string; content: string; sourceType: string }>;
}

async function searchKnowledgeBase(query: string): Promise<TopicContext[]> {
  const pattern = `%${query}%`;

  const matchedTopics = await db
    .select()
    .from(topics)
    .where(
      or(
        ilike(topics.title, pattern),
        ilike(topics.summary, pattern),
        ilike(topics.guidance, pattern),
      ),
    )
    .limit(5);

  const result: TopicContext[] = [];

  for (const topic of matchedTopics) {
    const topicSources = await db
      .select({
        title: sources.title,
        content: sources.content,
        sourceType: sources.sourceType,
      })
      .from(sources)
      .where(eq(sources.topicId, topic.id));

    result.push({
      id: topic.id,
      title: topic.title,
      area: topic.area,
      summary: topic.summary,
      guidance: topic.guidance,
      sources: topicSources,
    });
  }

  return result;
}

export async function chat(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  const contextTopics = await searchKnowledgeBase(message);

  const contextBlock =
    contextTopics.length > 0
      ? contextTopics
          .map((t) => {
            const sourcesText =
              t.sources.length > 0
                ? t.sources
                    .map(
                      (s) =>
                        `  - ${s.title} (${s.sourceType}): ${s.content}`,
                    )
                    .join("\n")
                : "  - No sources attached";
            return `## ${t.title} (${t.area ?? "general"})\nSummary: ${t.summary}\nGuidance: ${t.guidance}\nSources:\n${sourcesText}`;
          })
          .join("\n\n")
      : "No specific topics matched your query. Answer based on general paramedic best practice.";

  const systemPrompt = `You are a knowledgeable assistant for paramedic personnel. Answer questions using the operational guidance below. Be concise, practical, and accurate. If the provided knowledge does not cover the question, say so clearly.

KNOWLEDGE BASE:
${contextBlock}`;

  const { client } = await getLLMClient();
  const modelName = getModelName();

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [...history, { role: "user", content: message }],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );

  if (!textBlock) {
    throw new Error("No text response from LLM");
  }

  const attributions: SourceAttribution[] = contextTopics.map((t) => ({
    topicId: t.id,
    topicTitle: t.title,
    area: t.area,
  }));

  return {
    content: textBlock.text,
    sources: attributions,
  };
}
