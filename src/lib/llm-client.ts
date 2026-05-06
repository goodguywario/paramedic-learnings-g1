import { Anthropic } from "@anthropic-ai/sdk";

// Determines which API to use: local LM Studio or cloud Anthropic
let clientInstance: Anthropic | null = null;
let usingLocalModel = false;

async function isLocalServerAvailable(): Promise<boolean> {
  if (process.env.USE_LOCAL_MODEL !== "true") {
    return false;
  }

  const lmStudioUrl = process.env.LM_STUDIO_API_URL || "http://localhost:8000";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`${lmStudioUrl}/v1/models`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function getLLMClient(): Promise<{
  client: Anthropic;
  isLocal: boolean;
}> {
  if (clientInstance && usingLocalModel === (process.env.USE_LOCAL_MODEL === "true")) {
    return { client: clientInstance, isLocal: usingLocalModel };
  }

  const localAvailable = await isLocalServerAvailable();

  if (localAvailable) {
    const lmStudioUrl = process.env.LM_STUDIO_API_URL || "http://localhost:8000";
    clientInstance = new Anthropic({
      apiKey: process.env.API_KEY_LOCAL || "not-needed",
      baseURL: lmStudioUrl,
    });
    usingLocalModel = true;

    console.log(
      `[LLM] Using local LM Studio at ${lmStudioUrl}`,
    );
  } else {
    clientInstance = new Anthropic({
      apiKey: process.env.API_KEY_CLOUD,
    });
    usingLocalModel = false;

    if (process.env.USE_LOCAL_MODEL === "true") {
      console.log(
        "[LLM] Local LM Studio unavailable, falling back to cloud API",
      );
    } else {
      console.log("[LLM] Using cloud API");
    }
  }

  return { client: clientInstance, isLocal: usingLocalModel };
}

// Helper to map model names between local and cloud
export function getModelName(preferLocal: boolean = true): string {
  if (preferLocal && usingLocalModel) {
    // Use a model available in LM Studio (you can change this based on what you download)
    return process.env.LM_STUDIO_MODEL || "mistral-7b-instruct";
  }

  // Cloud Anthropic model
  return "claude-3-5-sonnet-20241022";
}
