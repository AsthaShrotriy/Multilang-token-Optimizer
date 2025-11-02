const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { BedrockRuntimeClient, InvokeModelCommand, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { BedrockClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Example API route
app.get('/api/example', (req, res) => {
  res.json({ message: 'API is working' });
});

// List available Bedrock foundation models in the configured region
app.get('/api/bedrock/models', async (req, res) => {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    const client = new BedrockClient({ region });
    const cmd = new ListFoundationModelsCommand({ byInferenceType: 'ON_DEMAND' });
    const out = await client.send(cmd);
    const models = (out.modelSummaries || []).map(m => ({
      modelId: m.modelId,
      modelName: m.modelName,
      providerName: m.providerName,
      inputModalities: m.inputModalities,
      outputModalities: m.outputModalities,
      inferenceTypesSupported: m.inferenceTypesSupported,
    }));
    res.json({ region, models });
  } catch (err) {
    console.error('List models error:', err);
    res.status(500).json({ error: 'Unable to list models' });
  }
});

// --- Bedrock helpers (shared by multiple routes) ---
function buildBedrockPayload(modelId, promptText) {
  if (modelId.startsWith('anthropic')) {
    return {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 512,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText }
          ]
        }
      ]
    };
  }
  // Cohere Command models expect a 'message' field
  if (modelId.startsWith('cohere.')) {
    return {
      message: promptText,
      max_tokens: 512,
      temperature: 0.2,
      top_p: 0.9
    };
  }
  if (modelId.includes('titan-text')) {
    return {
      inputText: promptText,
      textGenerationConfig: {
        maxTokenCount: 512,
        temperature: 0.2,
        topP: 0.9
      }
    };
  }
  return { prompt: promptText, max_tokens: 512, temperature: 0.2 };
}

function extractBedrockText(modelId, payload) {
  if (payload && Array.isArray(payload.output) && payload.output[0] && Array.isArray(payload.output[0].content)) {
    const first = payload.output[0].content.find(c => typeof c.text === 'string');
    if (first && first.text) return first.text;
  }
  if (payload && Array.isArray(payload.content) && payload.content[0] && payload.content[0].text) {
    return payload.content[0].text;
  }
  if (payload && Array.isArray(payload.results) && payload.results[0]) {
    if (payload.results[0].outputText) return payload.results[0].outputText;
    if (payload.results[0].text) return payload.results[0].text;
  }
  if (payload && payload.generation) return payload.generation;
  if (payload && Array.isArray(payload.generations) && payload.generations[0] && payload.generations[0].text) return payload.generations[0].text;
  if (typeof payload === 'string') return payload;
  return null;
}

function extractBedrockUsage(modelId, payload) {
  // Anthropic Claude via Bedrock (messages API)
  if (payload && payload.usage) {
    const u = payload.usage;
    const inTok = u.input_tokens || u.inputTokens || 0;
    const outTok = u.output_tokens || u.outputTokens || 0;
    return { input: inTok, output: outTok, total: inTok + outTok };
  }
  // Titan Text
  if (payload && Array.isArray(payload.results) && payload.results[0] && payload.results[0].tokenCount) {
    const t = payload.results[0].tokenCount;
    const inTok = t.inputTokenCount ?? t.inputTextTokenCount ?? 0;
    const outTok = t.outputTokenCount ?? t.outputTextTokenCount ?? 0;
    const total = t.totalTokens ?? inTok + outTok;
    return { input: inTok, output: outTok, total };
  }
  return { input: 0, output: 0, total: 0 };
}

function isNonGenerativeModel(modelId) {
  const id = (modelId || '').toLowerCase();
  return id.includes('rerank') || id.includes('embed') || id.includes('embedding');
}

async function bedrockGenerateText({ text, language, model, region }) {
  const client = new BedrockRuntimeClient({ region });
  const prompt = `You are a helpful assistant. Read the following English input and respond entirely in ${language}. If translation is appropriate, translate; if the input asks for tasks, perform them and provide the answer in ${language}. Keep the response clear and natural.\n\nInput: ${text}`;
  // Try unified Converse API first (works across most providers)
  try {
    const t0 = Date.now();
    const convInput = {
      modelId: model,
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }]
        }
      ],
      inferenceConfig: { maxTokens: 512, temperature: 0.2, topP: 0.9 },
    };
    // Claude 3/3.5 requires anthropic_version when using Converse
    if (model.startsWith('anthropic')) {
      convInput.additionalModelRequestFields = { anthropic_version: 'bedrock-2023-05-31' };
    }
    const conv = new ConverseCommand(convInput);
    const convRes = await client.send(conv);
    const latencyMs = Date.now() - t0;
    const msg = convRes && convRes.output && convRes.output.message;
    const contentArr = msg && Array.isArray(msg.content) ? msg.content : [];
    const textPart = contentArr.find(p => typeof p.text === 'string');
    const outText = textPart && textPart.text ? textPart.text : null;
    const u = convRes && convRes.usage ? convRes.usage : {};
    const usage = {
      input: u.inputTokens || 0,
      output: u.outputTokens || 0,
      total: (u.inputTokens || 0) + (u.outputTokens || 0),
    };
    if (outText) {
      return { text: outText, usage, latencyMs, raw: convRes };
    }
    // If Converse returned but we couldn't parse text, fall through to legacy path
  } catch (e) {
    // Fall back to model-native schema via InvokeModel
  }

  // Fallback: provider-specific InvokeModel body
  const body = JSON.stringify(buildBedrockPayload(model, prompt));
  const command = new InvokeModelCommand({ modelId: model, contentType: 'application/json', accept: 'application/json', body });
  const t1 = Date.now();
  const response = await client.send(command);
  const latencyMs = Date.now() - t1;
  const responseString = Buffer.from(response.body).toString('utf-8');
  const json = JSON.parse(responseString);
  const outputText = extractBedrockText(model, json);
  if (!outputText) {
    const error = new Error('Unable to parse model response');
    error.raw = json;
    throw error;
  }
  const usage = extractBedrockUsage(model, json);
  return { text: outputText, usage, latencyMs, raw: json };
}

// Translate text using google-translate-api-x (no API key required)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang, sourceLang = 'en' } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Parameter "text" (non-empty string) is required.' });
    }
    if (!targetLang || typeof targetLang !== 'string' || !targetLang.trim()) {
      return res.status(400).json({ error: 'Parameter "targetLang" (non-empty string) is required.' });
    }

    const { default: translate } = await import('google-translate-api-x');
    const result = await translate(text, { from: sourceLang || 'en', to: targetLang });
    if (!result || !result.text) {
      return res.status(502).json({ error: 'Invalid response from translation provider.' });
    }

    return res.json({
      translatedText: result.text,
      provider: 'google-translate-api-x',
      targetLang,
      sourceLang: sourceLang || 'en',
    });
  } catch (err) {
    console.error('Translate route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate text with AWS Bedrock (supports Anthropic Claude 3 and Amazon Titan Text)
app.post('/api/bedrock/generate', async (req, res) => {
  try {
    const { text, language, model } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Parameter "text" (non-empty string) is required.' });
    }
    if (!language || typeof language !== 'string' || !language.trim()) {
      return res.status(400).json({ error: 'Parameter "language" (non-empty string) is required.' });
    }
    if (!model || typeof model !== 'string' || !model.trim()) {
      return res.status(400).json({ error: 'Parameter "model" (non-empty string) is required.' });
    }

    if (isNonGenerativeModel(model)) {
      return res.status(400).json({ error: 'Selected model is non-generative (e.g., rerank/embedding). Please choose a text generation model.' });
    }
    const region = process.env.AWS_REGION || 'us-east-1';
    const out = await bedrockGenerateText({ text, language, model, region });
    if (!out || !out.text) {
      return res.status(502).json({ error: 'Unable to parse model response' });
    }

    return res.json({
      outputText: out.text,
      model,
      language,
      region,
      metrics: {
        tokens: { optimized: out.usage },
        performance: { processingTime: out.latencyMs }
      }
    });
  } catch (err) {
    console.error('Bedrock route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate with Bedrock in a target language, then translate result to English
app.post('/api/bedrock/generate-translate', async (req, res) => {
  try {
    const { text, language, model } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Parameter "text" (non-empty string) is required.' });
    }
    if (!language || typeof language !== 'string' || !language.trim()) {
      return res.status(400).json({ error: 'Parameter "language" (non-empty string) is required.' });
    }
    if (!model || typeof model !== 'string' || !model.trim()) {
      return res.status(400).json({ error: 'Parameter "model" (non-empty string) is required.' });
    }

    if (isNonGenerativeModel(model)) {
      return res.status(400).json({ error: 'Selected model is non-generative (e.g., rerank/embedding). Please choose a text generation model.' });
    }
    const region = process.env.AWS_REGION || 'us-east-1';
    // Optimized path (target language)
    const optimized = await bedrockGenerateText({ text, language, model, region });

    // Baseline path (English) for savings comparison
    const baseline = await bedrockGenerateText({ text, language: 'en', model, region });

    const { default: translate } = await import('google-translate-api-x');
    const translated = await translate(optimized.text, { from: language, to: 'en' });
    if (!translated || !translated.text) {
      return res.status(502).json({ error: 'Invalid response from translation provider.' });
    }

    // Pricing (approximate per 1M tokens) - extend as needed for other models
    // AWS does not provide a pricing API. All pricing information is sourced from:
    // https://aws.amazon.com/bedrock/pricing/ and may be subject to change.
    function getPricingPerMillion(modelId) {
      // Anthropic Models
      if (modelId.includes('claude-3-5-sonnet')) {
        return { input: 3.0, output: 15.0 }; // $3/$15 per 1M tokens
      }
      if (modelId.includes('claude-3-5-haiku')) {
        return { input: 0.8, output: 4.0 }; // $0.8/$4 per 1M tokens
      }
      if (modelId.includes('claude-3-haiku')) {
        return { input: 0.25, output: 1.25 }; // $0.25/$1.25 per 1M tokens
      }
      if (modelId.includes('claude-3-sonnet')) {
        return { input: 3.0, output: 15.0 }; // $3/$15 per 1M tokens
      }
      if (modelId.includes('claude-3-opus')) {
        return { input: 15.0, output: 75.0 }; // $15/$75 per 1M tokens
      }
      if (modelId.includes('claude-instant')) {
        return { input: 0.8, output: 2.4 }; // $0.8/$2.4 per 1M tokens
      }
      if (modelId.includes('claude-2')) {
        return { input: 8.0, output: 24.0 }; // $8/$24 per 1M tokens
      }

      // Amazon Nova Models
      if (modelId.includes('nova-pro')) {
        return { input: 0.8, output: 3.2 }; // $0.8/$3.2 per 1M tokens
      }
      if (modelId.includes('nova-lite')) {
        return { input: 0.06, output: 0.24 }; // $0.06/$0.24 per 1M tokens
      }
      if (modelId.includes('nova-micro')) {
        return { input: 0.035, output: 0.14 }; // $0.035/$0.14 per 1M tokens
      }

      // Amazon Titan Models
      if (modelId.includes('titan-text-express')) {
        return { input: 0.8, output: 1.6 }; // $0.8/$1.6 per 1M tokens
      }
      if (modelId.includes('titan-text-lite')) {
        return { input: 0.3, output: 0.4 }; // $0.3/$0.4 per 1M tokens
      }
      if (modelId.includes('titan-embed')) {
        return { input: 0.1, output: 0 }; // Embedding models - input only
      }

      // Meta Llama Models
      if (modelId.includes('llama-3-3-70b')) {
        return { input: 0.99, output: 0.99 }; // $0.99/$0.99 per 1M tokens
      }
      if (modelId.includes('llama-3-2-90b')) {
        return { input: 2.0, output: 2.0 }; // $2/$2 per 1M tokens
      }
      if (modelId.includes('llama-3-2-11b')) {
        return { input: 0.35, output: 1.4 }; // $0.35/$1.4 per 1M tokens
      }
      if (modelId.includes('llama-3-2-3b')) {
        return { input: 0.15, output: 0.6 }; // $0.15/$0.6 per 1M tokens
      }
      if (modelId.includes('llama-3-2-1b')) {
        return { input: 0.1, output: 0.4 }; // $0.1/$0.4 per 1M tokens
      }
      if (modelId.includes('llama-3-1-405b')) {
        return { input: 5.32, output: 16.0 }; // $5.32/$16 per 1M tokens
      }
      if (modelId.includes('llama-3-1-70b')) {
        return { input: 0.99, output: 0.99 }; // $0.99/$0.99 per 1M tokens
      }
      if (modelId.includes('llama-3-1-8b')) {
        return { input: 0.22, output: 0.22 }; // $0.22/$0.22 per 1M tokens
      }
      if (modelId.includes('llama-3-70b')) {
        return { input: 2.65, output: 3.5 }; // $2.65/$3.5 per 1M tokens
      }
      if (modelId.includes('llama-3-8b')) {
        return { input: 0.4, output: 0.6 }; // $0.4/$0.6 per 1M tokens
      }
      if (modelId.includes('llama-2-70b')) {
        return { input: 1.95, output: 2.56 }; // $1.95/$2.56 per 1M tokens
      }
      if (modelId.includes('llama-2-13b')) {
        return { input: 0.75, output: 1.0 }; // $0.75/$1 per 1M tokens
      }

      // Mistral Models
      if (modelId.includes('mistral-large-2407')) {
        return { input: 3.0, output: 9.0 }; // $3/$9 per 1M tokens
      }
      if (modelId.includes('mistral-large-2402')) {
        return { input: 8.0, output: 24.0 }; // $8/$24 per 1M tokens
      }
      if (modelId.includes('mixtral-8x7b')) {
        return { input: 0.45, output: 0.7 }; // $0.45/$0.7 per 1M tokens
      }
      if (modelId.includes('mistral-7b')) {
        return { input: 0.15, output: 0.2 }; // $0.15/$0.2 per 1M tokens
      }

      // Cohere Models
      if (modelId.includes('command-r-plus')) {
        return { input: 2.5, output: 10.0 }; // $2.5/$10 per 1M tokens
      }
      if (modelId.includes('command-r')) {
        return { input: 0.15, output: 0.75 }; // $0.15/$0.75 per 1M tokens
      }
      if (modelId.includes('command-light')) {
        return { input: 0.3, output: 0.6 }; // $0.3/$0.6 per 1M tokens
      }
      if (modelId.includes('command')) {
        return { input: 1.5, output: 2.0 }; // $1.5/$2 per 1M tokens
      }
      if (modelId.includes('embed-english') || modelId.includes('embed-multilingual')) {
        return { input: 0.1, output: 0 }; // Embedding models - input only
      }

      // AI21 Labs Models
      if (modelId.includes('jamba-1-5-large')) {
        return { input: 2.0, output: 8.0 }; // $2/$8 per 1M tokens
      }
      if (modelId.includes('jamba-1-5-mini')) {
        return { input: 0.2, output: 0.4 }; // $0.2/$0.4 per 1M tokens
      }
      if (modelId.includes('jurassic-2-ultra')) {
        return { input: 18.8, output: 18.8 }; // $18.8/$18.8 per 1M tokens
      }
      if (modelId.includes('jurassic-2-mid')) {
        return { input: 12.5, output: 12.5 }; // $12.5/$12.5 per 1M tokens
      }

      // DeepSeek Models
      if (modelId.includes('deepseek-r1')) {
        return { input: 1.35, output: 5.4 }; // $1.35/$5.4 per 1M tokens
      }

      // Stability AI Models (Image generation - per image pricing)
      if (modelId.includes('stable-diffusion') || modelId.includes('sdxl')) {
        return { input: 40.0, output: 0 }; // ~$0.04 per image = $40 per 1M images
      }

      // Default conservative pricing for unknown models
      return { input: 1.0, output: 3.0 }; // Conservative fallback
    }

    const prices = getPricingPerMillion(model);
    const englishCost = (baseline.usage.input / 1e6) * prices.input + (baseline.usage.output / 1e6) * prices.output;
    const optimizedCost = (optimized.usage.input / 1e6) * prices.input + (optimized.usage.output / 1e6) * prices.output;

    const tokensSavingsAbs = Math.max(0, (baseline.usage.total || 0) - (optimized.usage.total || 0));
    const tokensSavingsPct = baseline.usage.total > 0 ? Math.round((tokensSavingsAbs / baseline.usage.total) * 100) : 0;
    const costSavingsAbs = Math.max(0, englishCost - optimizedCost);
    const costSavingsPct = englishCost > 0 ? Math.round((costSavingsAbs / englishCost) * 1000) / 10 : 0; // one decimal

    return res.json({
      generatedText: optimized.text,
      translatedText: translated.text,
      sourceLang: language,
      targetLang: 'en',
      model,
      region,
      metrics: {
        tokens: {
          english: { input: baseline.usage.input, output: baseline.usage.output, total: baseline.usage.total },
          optimized: { input: optimized.usage.input, output: optimized.usage.output, total: optimized.usage.total },
          savings: { 
            absolute: tokensSavingsAbs, 
            percentage: tokensSavingsPct, 
            outputSavingsPercent: baseline.usage.output > 0 ? Math.round(((baseline.usage.output - optimized.usage.output) / baseline.usage.output) * 100) : 0
          }
        },
        costs: {
          english: { total: Number(englishCost.toFixed(6)) },
          optimized: { model: Number(optimizedCost.toFixed(6)), translation: 0, total: Number((optimizedCost + 0).toFixed(6)) },
          savings: { absolute: Number(costSavingsAbs.toFixed(6)), percentage: costSavingsPct },
          breakEven: costSavingsAbs > 0 ? text.length : Math.ceil(text.length / (1 - tokensSavingsPct/100))
        },
        performance: {
          processingTime: optimized.latencyMs + baseline.latencyMs,
          optimizedLatencyMs: optimized.latencyMs,
          englishLatencyMs: baseline.latencyMs,
          estimatedLatencyIncrease: baseline.latencyMs > 0 ? `${((optimized.latencyMs + 0) / baseline.latencyMs).toFixed(1)}x` : 'n/a'
        }
      }
    });
  } catch (err) {
    console.error('Generate-then-translate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


