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

    const areaBreakdown = Object.entries(
      validTopics.reduce(
        (acc, t) => {
          const area = t.area || "uncategorized";
          acc[area] = (acc[area] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    )
      .sort(([, a], [, b]) => b - a)
      .map(([area, count]) => `${area} (${count} topics)`)
      .join(", ");

    const prompt = `You are an analyst reviewing a medical guidance knowledge base for ambulance personnel.

KNOWLEDGE BASE SUMMARY:
- Total topics: ${validTopics.length}
- Clinical areas: ${areaBreakdown}
- Topics with sources: ${validTopics.filter((t) => t.sourceCount > 0).length}

Provide exactly 3-4 insights about this knowledge base. Each insight should be 2-3 sentences and actionable.

FORMAT: Do NOT include thinking, reasoning, or meta-commentary. Only provide clean, polished insights with no preamble or explanation of your analysis process.

Focus on:
1. Coverage strength (which areas are well/poorly covered relative to importance)
2. Source support gaps (which critical topics need more evidence)
3. Recommended priorities for improvement
4. Operational readiness assessment

Insights:`;

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
    console.log("[Dashboard] LLM Response type:", typeof response);
    console.log("[Dashboard] LLM Response keys:", Object.keys(response));
    console.log("[Dashboard] LLM Response:", response);

    if (!response.content) {
      console.error("[Dashboard] Response structure missing 'content' field");
      console.error("[Dashboard] Available keys:", Object.keys(response));
      console.error("[Dashboard] Full response:", response);
      throw new Error("Unexpected LLM response format - no content field");
    }

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
