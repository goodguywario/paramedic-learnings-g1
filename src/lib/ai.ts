"use server";

import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.LM_STUDIO_BASE_URL ?? "http://localhost:1234/v1",
  apiKey: "lm-studio", // LM Studio ignores the key but the SDK requires a non-empty value
});

const MODEL = process.env.LM_STUDIO_MODEL ?? "local-model";

type TopicRow = {
  id: number;
  title: string;
  summary: string;
  guidance: string;
};

export type SourceAnalysis = {
  summary: string;
  suggestedTopicId: number | null;
  conflictFlag: boolean;
  conflictReason: string | null;
};

export async function analyzeSource(
  source: { title: string; content: string; sourceType: string },
  allTopics: TopicRow[],
  preSelectedTopicId?: number
): Promise<SourceAnalysis> {
  const relevantTopics =
    preSelectedTopicId !== undefined
      ? allTopics.filter((t) => t.id === preSelectedTopicId)
      : allTopics;

  const topicsSection =
    relevantTopics.length > 0
      ? `\n\nAvailable topics to match against:\n${relevantTopics
          .map(
            (t) =>
              `Topic ID ${t.id}: "${t.title}"\nSummary: ${t.summary}\nCurrent guidance: ${t.guidance}`
          )
          .join("\n\n")}`
      : "\n\nNo topics are currently available.";

  const selectionInstruction =
    preSelectedTopicId !== undefined
      ? `The submitter has pre-selected topic ID ${preSelectedTopicId}. Use that as the suggestedTopicId.`
      : `Pick the single best-matching topic ID from the list, or null if none are a good fit.`;

  const prompt = `You are analyzing a submitted source for a paramedic knowledge platform.

Source title: ${source.title}
Source type: ${source.sourceType}
Source content:
${source.content}${topicsSection}

${selectionInstruction}
Check whether this source conflicts with the current guidance of the matched topic.

Respond with a raw JSON object only — no markdown, no explanation:
{
  "summary": "2-3 sentence summary of the key clinical or operational points in this source",
  "suggestedTopicId": <integer topic ID or null>,
  "conflictFlag": <true if the source conflicts with the matched topic's guidance, false otherwise>,
  "conflictReason": "<one sentence explaining the conflict, or null if no conflict>"
}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";

  // Strip markdown fences if the model wraps its output
  const jsonText = raw.startsWith("```")
    ? raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    : raw;

  const parsed = JSON.parse(jsonText) as SourceAnalysis;

  // Guard against hallucinated topic IDs
  if (parsed.suggestedTopicId !== null) {
    const valid = relevantTopics.some((t) => t.id === parsed.suggestedTopicId);
    if (!valid) {
      parsed.suggestedTopicId = null;
      parsed.conflictFlag = false;
      parsed.conflictReason = null;
    }
  }

  return parsed;
}
