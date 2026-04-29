// ===== AI Configuration & Plans =====

// AI Subscription Plans
export const AI_PLANS = {
  FREE: {
    id: 'free',
    nameAr: 'مجانية',
    nameEn: 'Free',
    monthlyLimitUSD: 1.0,
    priceEGP: 0,
    features: {
      nutrition: true,
      workout: true,
      chat: true,
      maxRequestsPerDay: 10,
    },
  },
  PREMIUM: {
    id: 'premium',
    nameAr: 'الخطة الكاملة للذكاء الاصطناعي',
    nameEn: 'Full AI Plan',
    monthlyLimitUSD: 5.0,
    priceEGP: 500,
    features: {
      nutrition: true,
      workout: true,
      chat: true,
      maxRequestsPerDay: 100,
    },
  },
};

// Gemini Model Configuration
// Try models in order: gemini-2.0-flash-lite → gemini-1.5-flash → gemini-pro
export const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
];

export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash-lite',
  fallbackModels: GEMINI_MODELS,
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  },
};

// Token pricing (Gemini 2.0 Flash Lite approximate pricing)
export const TOKEN_PRICING = {
  inputPerMillion: 0.075,   // $0.075 per 1M input tokens
  outputPerMillion: 0.30,   // $0.30 per 1M output tokens
};

// Calculate cost from token counts
export function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * TOKEN_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * TOKEN_PRICING.outputPerMillion;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
}

// Get plan details by ID
export function getPlan(planId) {
  return planId === 'premium' ? AI_PLANS.PREMIUM : AI_PLANS.FREE;
}

// Get plan limit in USD
export function getPlanLimit(planId) {
  return getPlan(planId).monthlyLimitUSD;
}

// AI Feature labels
export const AI_FEATURES = {
  nutrition: { iconAr: '🥗', labelAr: 'مساعد التغذية', iconEn: '🥗', labelEn: 'Nutrition AI' },
  workout: { iconAr: '🏋️', labelAr: 'مولّد التمارين', iconEn: '🏋️', labelEn: 'Workout AI' },
  chat: { iconAr: '🤖', labelAr: 'المساعد الذكي', iconEn: '🤖', labelEn: 'AI Assistant' },
};
