# LM Studio Setup Guide

This guide helps you run local LLMs using LM Studio alongside your Paramedic Learnings app. The app automatically switches between local (LM Studio) and cloud (Anthropic API) models based on availability.

## Why Use Local Models?

- **Cost**: Free inference during development (no API credits used)
- **Speed**: 100-500ms per request (vs 2-5s for cloud)
- **Privacy**: Models run entirely on your machine
- **Testing**: Test model behavior before paying for cloud inference
- **Fallback**: If local is down, seamlessly falls back to Anthropic cloud API

## Installation

### macOS

1. Download LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Drag **LM Studio.app** to **Applications**
3. Launch from Applications folder

### Linux

```bash
# Ubuntu/Debian
wget https://releases.lmstudio.ai/linux/latest/LM-Studio-*.AppImage
chmod +x LM-Studio-*.AppImage
./LM-Studio-*.AppImage
```

### Windows

1. Download installer from [lmstudio.ai](https://lmstudio.ai)
2. Run the installer
3. Launch from Start menu

## Downloading a Model

1. **Open LM Studio** and click the **Models** tab (left sidebar)
2. **Search** for a model (e.g., `mistral-7b-instruct`, `llama-2-7b-chat`, `neural-chat`)
3. **Click Download** next to the model
4. Wait for download to complete (500MB - 8GB depending on model size)

**Recommended models for testing:**
- `mistral-7b-instruct` — Fast, good quality (7.3GB)
- `llama-2-7b-chat` — Popular, versatile (7.4GB)
- `neural-chat-7b` — Optimized for chat (7.5GB)

## Starting the Local Server

1. In LM Studio, click the **Local Server** tab
2. Select your downloaded model from the dropdown
3. Click **Start Server**
4. Wait for "Server is running on http://localhost:8000"

**You should see:**
```
LM Studio Local Server
Listening on http://localhost:8000
OpenAI-compatible API endpoint: /v1/chat/completions
```

## Verifying the Server

Once the server is running, test it from your terminal:

```bash
curl -X GET http://localhost:8000/v1/models
```

You should see a JSON response listing available models.

## Configuration in Your App

### Using Local Models (Development)

In `.env.local`:

```bash
USE_LOCAL_MODEL=true
LM_STUDIO_API_URL=http://localhost:8000
LM_STUDIO_MODEL=mistral-7b-instruct
API_KEY_LOCAL=not-needed
API_KEY_CLOUD=sk-ant-xxxxx  # Still required as fallback
```

Then start the dev server:

```bash
npm run dev
```

### Switching to Cloud (Production)

In `.env.local`:

```bash
USE_LOCAL_MODEL=false
API_KEY_CLOUD=sk-ant-xxxxx
```

## How the Fallback Works

When your app starts:

1. **Check**: Is `USE_LOCAL_MODEL=true`?
2. **Try**: Can we reach LM Studio at `LM_STUDIO_API_URL`?
3. **If yes**: Use local model → fast, free inference
4. **If no**: Fall back to cloud API → works even if LM Studio is down
5. **If both unavailable**: Error (missing `API_KEY_CLOUD`)

You'll see logs like:

```
[LLM] Using local LM Studio at http://localhost:8000
```

or

```
[LLM] Local LM Studio unavailable, falling back to cloud API
```

## Troubleshooting

### "Cannot connect to LM Studio"

1. Check LM Studio is running: `curl http://localhost:8000/v1/models`
2. Verify port 8000 is correct in `.env.local` → `LM_STUDIO_API_URL`
3. Restart your dev server: `npm run dev`

### "Model not found"

1. Check you've downloaded the model in LM Studio
2. Verify `LM_STUDIO_MODEL` in `.env.local` matches the model name
3. LM Studio shows model names in the UI — use exact name

### Slow responses

- **Local models are slower than you'd expect**: First request may be 10-30s (model loading into memory)
- **Use a smaller model**: 7B parameter models are faster than 13B or 70B
- **Check hardware**: Models need 8GB+ RAM available

### It still falls back to cloud

1. Check `.env.local` has `API_KEY_CLOUD` set (required for any fallback)
2. Verify `LM_STUDIO_API_URL` is exactly right (default: `http://localhost:8000`)
3. Test the server: `curl -X GET http://localhost:8000/v1/models`
4. Check logs in dev server output for `[LLM]` messages

## Using in Code

Import and use the client:

```typescript
import { getLLMClient, getModelName } from "@/lib/llm-client";

async function summarize(text: string) {
  const { client, isLocal } = await getLLMClient();
  const model = getModelName();

  console.log(`Using ${isLocal ? "local" : "cloud"} model: ${model}`);

  const response = await client.messages.create({
    model,
    max_tokens: 500,
    messages: [
      { role: "user", content: `Summarize: ${text}` },
    ],
  });

  return response;
}
```

The client handles all the complexity — you just call it like normal Anthropic SDK code.

## Cost Example

**Without LM Studio (cloud only):**
- 100 requests/day × 30 days = 3,000 requests/month
- $0.015/1K input tokens × 3,000 = ~$45/month

**With LM Studio hybrid:**
- Dev/testing: 1,000 free requests on local machine
- Production: 2,000 cloud requests
- ~$30/month saved, faster development

## Next Steps

1. ✅ Install LM Studio
2. ✅ Download a model
3. ✅ Start the server
4. ✅ Set `.env.local` → `USE_LOCAL_MODEL=true`
5. ✅ Run `npm run dev` and check `[LLM]` logs
