"use server";

import { getLLMClient, getModelName } from "@/lib/llm-client";

// Simple validation
export interface TopicWithSourceCount {
  id: number;
  title: string;
  area: string | null;
  sourceCount: number;
}

export async function generateInsights(
  topics: TopicWithSourceCount[],
): Promise<string> {
  // Validate inputs
  if (!topics || topics.length === 0) {
    return "No topics in the knowledge base yet. Create a topic to get started.";
  }

  try {
    const { client, isLocal } = await getLLMClient();
    const modelName = getModelName();

    // Format topics for the LLM prompt
    const topicsList = topics
      .map(
        (t) =>
          `- ${t.title} (${t.area || "uncategorized"}) — ${t.sourceCount} source${t.sourceCount !== 1 ? "s" : ""}`,
      )
      .join("\n");

    const prompt = `You are an analyst reviewing a medical guidance knowledge base for ambulance personnel. Analyze these operational topics and provide 3-4 key insights about coverage, gaps, and patterns.

Topics in the knowledge base:
${topicsList}

Total topics: ${topics.length}
Clinical areas covered: ${new Set(topics.map((t) => t.area || "uncategorized")).size}

Provide insights in plain prose (2-3 sentences each). Focus on:
1. Which clinical/operational areas are well-covered vs. sparse
2. Any notable patterns or gaps in guidance
3. Recommendations for the knowledge base (optional)

Keep insights actionable and brief. Start with your first insight:`;

    const response = await client.messages.create({
      model: modelName,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text") {
      return textBlock.text;
    }

    throw new Error("No text content in LLM response");
  } catch (error) {
    // Log error for debugging
    console.error("[Dashboard] Failed to generate insights:", error);

    // Return user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("API configuration error. Please check your environment variables.");
      }
      if (error.message.includes("No text content")) {
        throw new Error("Failed to parse LLM response. Please try again.");
      }
    }

    throw new Error("Unable to generate insights. Please try again later.");
  }
}
