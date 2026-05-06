/**
 * Example: Using the LLM client in a Server Action
 *
 * This shows how to use getLLMClient() to get AI summaries.
 * The client automatically falls back to cloud API if local LM Studio is unavailable.
 */

import { getLLMClient, getModelName } from "./llm-client";

// Example Server Action for generating topic summaries
export async function generateTopicSummary(
  topicTitle: string,
  topicContent: string,
): Promise<string> {
  const { client, isLocal } = await getLLMClient();
  const modelName = getModelName();

  console.log(
    `Generating summary using ${isLocal ? "local" : "cloud"} model: ${modelName}`,
  );

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Provide a concise 2-3 sentence summary of the following operational guidance topic:

Title: ${topicTitle}

Content:
${topicContent}

Summary:`,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (textContent && textContent.type === "text") {
    return textContent.text;
  }

  throw new Error("No text content in response");
}

// Example: Generate stats about topics
export async function generateTopicStats(topics: Array<{ title: string; sources: number }>) {
  const { client, isLocal } = await getLLMClient();
  const modelName = getModelName();

  const topicsList = topics
    .map((t) => `- ${t.title} (${t.sources} sources)`)
    .join("\n");

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Analyze these topics and provide 2-3 key insights about coverage and patterns:

${topicsList}

Insights:`,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (textContent && textContent.type === "text") {
    return textContent.text;
  }

  throw new Error("No text content in response");
}
