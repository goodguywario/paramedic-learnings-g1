"use server";

import { Anthropic } from "@anthropic-ai/sdk";
import { z } from "zod";
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
  const escaped = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const pattern = `%${escaped}%`;

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

  // N+1 is acceptable here: limit(5) caps iterations, ~41 topics total
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

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

export async function chat(
  rawMessage: string,
  rawHistory: ChatMessage[],
): Promise<ChatResponse> {
  const message = z.string().trim().min(1).max(500).parse(rawMessage);
  const history = z.array(ChatMessageSchema).max(20).parse(rawHistory);

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
                        `  - ${s.title} (${s.sourceType}): ${s.content.slice(0, 500)}`,
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

  const { client, isLocal } = await getLLMClient();
  const modelName = getModelName(isLocal);

  try {
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...history, { role: "user", content: message }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );

    if (!textBlock) throw new Error("No text response from LLM");

    const attributions: SourceAttribution[] = contextTopics.map((t) => ({
      topicId: t.id,
      topicTitle: t.title,
      area: t.area,
    }));

    return {
      content: textBlock.text,
      sources: attributions,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    if (msg.includes("econnrefused") || msg.includes("connect")) {
      throw new Error("Cannot connect to the model server. Check that LM Studio is running.");
    }
    if (msg.includes("no text response")) throw err;
    throw new Error("Failed to generate a response. Please try again.");
  }
}
