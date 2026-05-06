"use server";

import { Anthropic } from "@anthropic-ai/sdk";
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

  // Validate topic array elements
  const validTopics = topics.filter(
    (t) => t.title && typeof t.sourceCount === "number" && t.sourceCount >= 0,
  );
  if (validTopics.length === 0) {
    return "No valid topics in the knowledge base yet.";
  }

  try {
    const { client } = await getLLMClient();
    const modelName = getModelName();

    // Format topics for the LLM prompt
    const topicsList = validTopics
      .map(
        (t) =>
          `- ${t.title} (${t.area || "uncategorized"}) — ${t.sourceCount} source${t.sourceCount !== 1 ? "s" : ""}`,
      )
      .join("\n");

    const prompt = `You are an analyst reviewing a medical guidance knowledge base for ambulance personnel. Analyze these operational topics and provide 3-4 key insights about coverage, gaps, and patterns.

Topics in the knowledge base:
${topicsList}

Total topics: ${validTopics.length}
Clinical areas covered: ${new Set(validTopics.map((t) => t.area || "uncategorized")).size}

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
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    if (textBlock) {
      return textBlock.text;
    }

    throw new Error("No text content in LLM response");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Dashboard] Failed to generate insights:", errorMsg);

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      // Connection/network errors
      if (msg.includes("econnrefused") || msg.includes("connect")) {
        console.error("[Dashboard] LM Studio connection failed. Check LM_STUDIO_API_URL and ensure LM Studio is running.");
        throw new Error("Cannot connect to LM model server. Check that LM Studio is running at " + process.env.LM_STUDIO_API_URL);
      }

      // API key errors
      if (msg.includes("api") && msg.includes("key")) {
        console.error("[Dashboard] API key configuration error");
        throw new Error("API configuration error. Please check your environment variables.");
      }

      // Model not found errors
      if (msg.includes("model") || msg.includes("404")) {
        console.error("[Dashboard] Model not found. Check LM_STUDIO_MODEL in .env.local");
        throw new Error("Model not found. Verify LM_STUDIO_MODEL setting matches a loaded model in LM Studio.");
      }

      // Response parsing errors
      if (msg.includes("no text content")) {
        throw new Error("Failed to parse LLM response. Please try again.");
      }
    }

    console.error("[Dashboard] Full error details:", error);
    throw new Error("Unable to generate insights. Check the browser console for details.");
  }
}
