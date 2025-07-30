import OpenAI from 'openai';

// Only create OpenAI client if API key is available
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Updated to use current model name - gpt-3.5-turbo is deprecated
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0125';

// OpenAI pricing (as of 2024 - update these as needed)
export const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-0125': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
};

// Token counting function (approximate)
export function countTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // For more accurate counting, you could use tiktoken library
  return Math.ceil(text.length / 4);
}

// Calculate cost based on tokens and model
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  const pricing = OPENAI_PRICING[model] || OPENAI_PRICING['gpt-3.5-turbo'];
  
  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  
  return inputCost + outputCost;
}

// Get pricing information for all models
export function getPricingInfo() {
  return Object.entries(OPENAI_PRICING).map(([model, pricing]) => ({
    model,
    inputPricePer1kTokens: pricing.input,
    outputPricePer1kTokens: pricing.output,
    description: getModelDescription(model),
  }));
}

function getModelDescription(model: string): string {
  const descriptions: Record<string, string> = {
    'gpt-4': 'Most capable model, best for complex reasoning tasks',
    'gpt-4-turbo': 'Latest GPT-4 model, faster and more efficient',
    'gpt-4-turbo-preview': 'Preview version of GPT-4 Turbo',
    'gpt-3.5-turbo': 'Fast and efficient, good for most tasks',
    'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo with larger context window',
  };
  return descriptions[model] || 'AI language model';
} 