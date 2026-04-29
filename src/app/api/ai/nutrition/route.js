// AI Nutrition Plan Generator API — with Auth Verification
import { callGeminiJSON } from '@/lib/ai/gemini';
import { nutritionPrompt } from '@/lib/ai/prompts';
import { checkLimit, trackUsage } from '@/lib/ai/token-tracker';
import { getAuthenticatedUserId } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { locale = 'ar', weight, height, age, gender, goal, allergies, dietType, activityLevel } = body;

    // Verify authentication
    const auth = await getAuthenticatedUserId(request);
    if (auth.error && auth.errorResponse) {
      return auth.errorResponse;
    }
    const userId = auth.userId;

    // Check usage limit
    const limitCheck = await checkLimit(userId);
    if (limitCheck.isLimitReached) {
      return NextResponse.json({
        error: 'limit_reached',
        message: locale === 'ar'
          ? 'لقد استنفذت رصيدك الشهري. قم بالترقية للخطة الكاملة!'
          : 'Monthly quota exceeded. Upgrade to continue!',
        usage: limitCheck.usage,
      }, { status: 429 });
    }

    // Generate nutrition plan
    const prompt = nutritionPrompt({ weight, height, age, gender, goal, allergies, dietType, activityLevel, locale });
    const result = await callGeminiJSON(prompt);

    // Track usage
    await trackUsage(userId, {
      feature: 'nutrition',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUSD: result.costUSD,
    });

    return NextResponse.json({
      plan: result.parsed || result.text,
      costUSD: result.costUSD,
      tokens: result.inputTokens + result.outputTokens,
    });
  } catch (error) {
    console.error('[API] AI Nutrition Error:', error.message);
    return NextResponse.json({ error: 'ai_error', message: error.message }, { status: 500 });
  }
}
