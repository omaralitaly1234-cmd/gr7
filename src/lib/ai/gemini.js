// ===== Google Gemini AI Client =====
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG, GEMINI_MODELS, calculateCost } from './ai-config';

const isDev = process.env.NODE_ENV === 'development';

let genAI = null;
let workingModel = null; // Cache the model that works

function getClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Try calling Gemini with fallback models
 */
async function tryWithFallback(client, prompt, options = {}) {
  // If we already found a working model, use it first
  const modelsToTry = workingModel 
    ? [workingModel, ...GEMINI_MODELS.filter(m => m !== workingModel)]
    : GEMINI_MODELS;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      if (isDev) console.log(`[AI] Trying model: ${modelName}`);
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          ...GEMINI_CONFIG.generationConfig,
          ...options,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // This model works! Cache it
      workingModel = modelName;
      if (isDev) console.log(`[AI] Success with model: ${modelName}`);

      const usageMetadata = response.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount || estimateTokens(prompt);
      const outputTokens = usageMetadata.candidatesTokenCount || estimateTokens(text);
      const costUSD = calculateCost(inputTokens, outputTokens);

      return { text, inputTokens, outputTokens, costUSD, model: modelName };
    } catch (error) {
      if (isDev) console.log(`[AI] Model ${modelName} failed: ${error.message?.substring(0, 100)}`);
      lastError = error;
      // If it's a 404 (model not found), try next model
      if (error.status === 404 || error.message?.includes('404') || error.message?.includes('not found')) {
        continue;
      }
      // For other errors (rate limit, invalid key, etc.), don't try other models
      throw error;
    }
  }

  // All models failed with 404, throw the last error
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Call Gemini API with token tracking and fallback
 */
export async function callGemini(prompt, options = {}) {
  const client = getClient();

  // DEMO MODE: Return mock response if no API key
  if (!client) {
    if (isDev) console.log('[AI] No API key configured, using DEMO mode');
    return getDemoResponse(prompt);
  }

  try {
    return await tryWithFallback(client, prompt, options);
  } catch (error) {
    console.error('[AI] All API calls failed, falling back to DEMO:', error.message);
    // Fallback to demo response on any error
    return getDemoResponse(prompt);
  }
}

/**
 * Call Gemini with JSON output
 */
export async function callGeminiJSON(prompt, options = {}) {
  const result = await callGemini(
    prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just pure JSON.',
    options
  );

  try {
    let jsonText = result.text.trim();
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    result.parsed = JSON.parse(jsonText);
  } catch {
    // If parsing fails, try to extract JSON from the text
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result.parsed = JSON.parse(jsonMatch[0]);
      } else {
        result.parsed = null;
      }
    } catch {
      result.parsed = null;
    }
  }

  return result;
}

// Estimate tokens (rough: ~4 chars per token for mixed Arabic/English)
function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

// Demo responses for when no API key is configured or API fails
function getDemoResponse(prompt) {
  const lower = (prompt || '').toLowerCase();
  const isArabic = /[\u0600-\u06FF]/.test(prompt);

  // CHAT responses (detect by chat prompt template markers or general questions)
  // Must check BEFORE nutrition/workout to avoid returning JSON for chat
  const isChatPrompt = lower.includes('you are a fitness') || lower.includes('أنت مساعد') ||
    lower.includes('message:') || lower.includes('الرسالة:') ||
    // Common chat questions that shouldn't return JSON
    lower.includes('اقترح') || lower.includes('كيف') || lower.includes('كم') ||
    lower.includes('أفضل') || lower.includes('أحتاج') || lower.includes('نصيح') ||
    lower.includes('suggest') || lower.includes('how') || lower.includes('what') ||
    lower.includes('best') || lower.includes('need') || lower.includes('tip');

  if (isChatPrompt && !lower.includes('respond only with valid json')) {
    // Context-aware chat responses
    const chatResponses = {
      meal: isArabic
        ? '🥗 **وجبة مثالية قبل التمرين:**\n\n⏰ تناولها قبل 60-90 دقيقة من التمرين\n\n🍽️ **الوجبة المقترحة:**\n• شوفان بالموز والعسل (1 كوب شوفان + موزة + ملعقة عسل)\n• أو خبز أسمر مع زبدة فول سوداني وموز\n• أو أرز أبيض مع صدر دجاج مشوي\n\n📊 **السعرات المثالية:** 300-400 سعرة\n📊 **الماكروز:** كربوهيدرات عالية + بروتين متوسط + دهون منخفضة\n\n💡 **نصيحة:** اشرب 500 مل ماء قبل التمرين بـ 30 دقيقة!'
        : '🥗 **Ideal Pre-Workout Meal:**\n\n⏰ Eat 60-90 min before training\n\n🍽️ **Suggested Meal:**\n• Oatmeal with banana & honey\n• Whole wheat bread with PB & banana\n• White rice with grilled chicken\n\n📊 **Ideal calories:** 300-400 kcal\n📊 **Macros:** High carbs + moderate protein + low fat\n\n💡 **Tip:** Drink 500ml water 30 min before workout!',
      squat: isArabic
        ? '🏋️ **نصائح لتحسين تمرين السكوات:**\n\n1. 🦶 **وضع القدمين:** باتساع الأكتاف مع توجيه أصابع القدم للخارج قليلاً\n2. 🧠 **النظر:** حافظ على نظرك للأمام وليس للأسفل\n3. 💪 **الظهر:** حافظ على استقامة الظهر والصدر مرفوع\n4. 🦵 **العمق:** انزل حتى يصبح الفخذ موازياً للأرض (أو أعمق)\n5. 🔄 **الركبة:** لا تتجاوز الركبة أصابع القدم\n\n📈 **للتقدم:**\n• أضف 2.5 كجم كل أسبوعين\n• مارس Pause Squat للقوة\n• أضف Box Squat لتحسين العمق\n\n⚠️ **تحذير:** استخدم حزام الأمان عند رفع أوزان ثقيلة!'
        : '🏋️ **Squat Improvement Tips:**\n\n1. 🦶 **Foot placement:** Shoulder-width, toes slightly out\n2. 🧠 **Eyes:** Look forward, not down\n3. 💪 **Back:** Keep spine neutral, chest up\n4. 🦵 **Depth:** Thighs parallel to floor or deeper\n5. 🔄 **Knees:** Track over toes\n\n📈 **Progressive overload:**\n• Add 2.5kg every 2 weeks\n• Practice Pause Squats\n• Add Box Squats for depth\n\n⚠️ Use a belt for heavy loads!',
      protein: isArabic
        ? '💪 **كمية البروتين اليومية المثالية:**\n\n📊 **القاعدة العامة:** 1.6 - 2.2 جم بروتين لكل كجم من وزن الجسم\n\n🔢 **مثال:** إذا وزنك 80 كجم:\n• الحد الأدنى: 80 × 1.6 = **128 جم**\n• المثالي: 80 × 2.0 = **160 جم**\n• الحد الأقصى: 80 × 2.2 = **176 جم**\n\n🥩 **مصادر بروتين ممتازة:**\n• صدر دجاج (31 جم/100 جم)\n• بيض (6 جم/بيضة)\n• تونا (26 جم/علبة)\n• واي بروتين (25 جم/سكوب)\n• عدس (9 جم/100 جم)\n\n⏰ **وزّع البروتين على 4-5 وجبات يومياً!**'
        : '💪 **Optimal Daily Protein:**\n\n📊 **General rule:** 1.6 - 2.2g per kg body weight\n\n🔢 **Example (80 kg person):**\n• Minimum: 128g\n• Optimal: 160g\n• Maximum: 176g\n\n🥩 **Best protein sources:**\n• Chicken breast (31g/100g)\n• Eggs (6g/egg)\n• Tuna (26g/can)\n• Whey protein (25g/scoop)\n\n⏰ Spread across 4-5 meals daily!',
      fat: isArabic
        ? '🔥 **أفضل تمارين حرق الدهون:**\n\n1. 🏃 **HIIT (تمارين متقطعة)** — أقوى طريقة لحرق الدهون!\n   • 30 ثانية سبرنت + 30 ثانية راحة × 15 جولة\n\n2. 🏋️ **تمارين مقاومة مركبة:**\n   • سكوات، ديد ليفت، بنش بريس\n   • حرق سعرات أعلى وبناء عضلات\n\n3. 🚴 **كارديو ثابت (Zone 2):**\n   • مشي سريع 45 دقيقة\n   • ركوب دراجة 30 دقيقة\n\n📊 **نصائح ذهبية:**\n• العجز الغذائي أهم من نوع التمرين!\n• تمرّن 4-5 أيام/أسبوع\n• نم 7-8 ساعات يومياً\n• اشرب ماء بارد (يزيد حرق السعرات!)'
        : '🔥 **Best Fat Burning Exercises:**\n\n1. 🏃 **HIIT** — Most effective!\n   • 30s sprint + 30s rest × 15 rounds\n\n2. 🏋️ **Compound resistance:**\n   • Squats, Deadlifts, Bench Press\n\n3. 🚴 **Steady-state cardio (Zone 2):**\n   • 45 min brisk walk\n   • 30 min cycling\n\n📊 **Key tips:**\n• Caloric deficit matters most!\n• Train 4-5 days/week\n• Sleep 7-8 hours\n• Drink cold water!',
      default: isArabic
        ? 'مرحباً! أنا مساعدك الذكي في Power Time 💪\n\nيمكنني مساعدتك في:\n\n🥗 **خطط التغذية** — اقتراح وجبات مناسبة لأهدافك\n🏋️ **برامج التمارين** — تصميم برنامج تدريبي مخصص\n💡 **نصائح لياقة** — إجابة أسئلتك عن التمارين والتغذية\n📊 **متابعة التقدم** — تحليل بياناتك ومساعدتك في التقدم\n\nاسألني أي سؤال وسأساعدك! 🚀'
        : "Hello! I'm your Power Time AI assistant 💪\n\nI can help with:\n\n🥗 **Nutrition Plans** — Custom meal plans\n🏋️ **Workout Programs** — Personalized training\n💡 **Fitness Tips** — Exercise & recovery advice\n📊 **Progress Tracking** — Analyze & improve\n\nAsk me anything! 🚀",
    };

    // Determine which response to give
    let responseText = chatResponses.default;
    if (lower.includes('وجب') || lower.includes('meal') || lower.includes('أكل') || lower.includes('eat') || lower.includes('اقترح')) {
      responseText = chatResponses.meal;
    } else if (lower.includes('سكوات') || lower.includes('squat') || lower.includes('أحسن')) {
      responseText = chatResponses.squat;
    } else if (lower.includes('بروتين') || lower.includes('protein') || lower.includes('كم')) {
      responseText = chatResponses.protein;
    } else if (lower.includes('دهون') || lower.includes('fat') || lower.includes('حرق') || lower.includes('burn')) {
      responseText = chatResponses.fat;
    }

    return {
      text: responseText,
      inputTokens: 100,
      outputTokens: 250,
      costUSD: 0.00008,
      model: 'demo',
    };
  }

  // NUTRITION JSON response (only when explicitly asking for JSON/plan generation)
  if (lower.includes('nutrition') || lower.includes('تغذية') || lower.includes('غذائ')) {
    return {
      text: JSON.stringify({
        planName: isArabic ? 'خطة غذائية متوازنة — Power Time AI' : 'Balanced Nutrition Plan — Power Time AI',
        dailyCalories: 2200,
        macros: { protein: 165, carbs: 250, fat: 70 },
        meals: [
          { name: isArabic ? 'الإفطار' : 'Breakfast', time: '07:00', calories: 500, items: isArabic ? ['3 بيضات مسلوقة', 'خبز أسمر — شريحتين', 'جبنة قريش 100 جم', 'خيار وطماطم'] : ['3 boiled eggs', 'Whole wheat bread — 2 slices', 'Cottage cheese 100g', 'Cucumber & tomato'] },
          { name: isArabic ? 'وجبة خفيفة صباحية' : 'Morning Snack', time: '10:00', calories: 280, items: isArabic ? ['موز — حبة', '2 ملعقة زبدة فول سوداني', 'كوب شوفان بالحليب'] : ['Banana — 1 piece', '2 tbsp peanut butter', 'Oatmeal with milk'] },
          { name: isArabic ? 'الغداء' : 'Lunch', time: '13:00', calories: 700, items: isArabic ? ['صدر دجاج مشوي — 200 جم', 'أرز بسمتي — كوب', 'سلطة خضراء متنوعة', 'ملعقة زيت زيتون'] : ['Grilled chicken breast — 200g', 'Basmati rice — 1 cup', 'Mixed green salad', '1 tbsp olive oil'] },
          { name: isArabic ? 'وجبة ما بعد التمرين' : 'Post-Workout', time: '17:00', calories: 400, items: isArabic ? ['سكوب بروتين واي', 'بطاطا حلوة — 200 جم', 'موز — حبة'] : ['Whey protein scoop', 'Sweet potato — 200g', 'Banana — 1 piece'] },
          { name: isArabic ? 'العشاء' : 'Dinner', time: '20:00', calories: 320, items: isArabic ? ['سمك مشوي — 150 جم', 'خضار سوتيه مشكلة', 'عصير ليمون طبيعي'] : ['Grilled fish — 150g', 'Mixed sautéed vegetables', 'Fresh lemon juice'] },
        ],
        tips: isArabic ? ['اشرب 3 لتر ماء يومياً', 'تناول البروتين خلال 30 دقيقة بعد التمرين', 'تجنب السكريات المصنعة'] : ['Drink 3L water daily', 'Protein within 30 min post-workout', 'Avoid processed sugars'],
      }),
      inputTokens: 200, outputTokens: 500, costUSD: 0.00017, model: 'demo',
    };
  }

  // WORKOUT JSON response
  if (lower.includes('workout') || lower.includes('تمرين') || lower.includes('تدريب')) {
    return {
      text: JSON.stringify({
        programName: isArabic ? 'برنامج بناء العضلات — Power Time AI' : 'Muscle Building Program — Power Time AI',
        duration: isArabic ? '4 أسابيع' : '4 weeks',
        daysPerWeek: 5,
        level: isArabic ? 'متوسط' : 'Intermediate',
        days: [
          { day: isArabic ? 'اليوم 1 — صدر وتراي' : 'Day 1 — Chest & Triceps', exercises: [
            { name: isArabic ? 'بنش بريس بالبار' : 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90s' },
            { name: isArabic ? 'بنش مائل بالدمبل' : 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '75s' },
            { name: isArabic ? 'كروس أوفر كابل' : 'Cable Crossover', sets: 3, reps: '12-15', rest: '60s' },
            { name: isArabic ? 'تراي بوش داون' : 'Tricep Rope Pushdown', sets: 3, reps: '12-15', rest: '60s' },
            { name: isArabic ? 'ديبس للتراي' : 'Tricep Dips', sets: 3, reps: '10-12', rest: '75s' },
          ]},
          { day: isArabic ? 'اليوم 2 — ظهر وباي' : 'Day 2 — Back & Biceps', exercises: [
            { name: isArabic ? 'ديد ليفت' : 'Deadlift', sets: 4, reps: '6-8', rest: '120s' },
            { name: isArabic ? 'سحب أمامي واسع' : 'Wide Lat Pulldown', sets: 3, reps: '10-12', rest: '75s' },
            { name: isArabic ? 'تجديف بالبار' : 'Barbell Row', sets: 3, reps: '8-10', rest: '90s' },
            { name: isArabic ? 'باي بالبار' : 'Barbell Curl', sets: 3, reps: '10-12', rest: '60s' },
            { name: isArabic ? 'هامر كيرل' : 'Hammer Curl', sets: 3, reps: '12', rest: '60s' },
          ]},
          { day: isArabic ? 'اليوم 3 — أرجل' : 'Day 3 — Legs', exercises: [
            { name: isArabic ? 'باك سكوات' : 'Back Squat', sets: 4, reps: '8-10', rest: '120s' },
            { name: isArabic ? 'ليج بريس' : 'Leg Press', sets: 3, reps: '10-12', rest: '90s' },
            { name: isArabic ? 'ليج كيرل' : 'Leg Curl', sets: 3, reps: '12', rest: '60s' },
            { name: isArabic ? 'لانجز' : 'Lunges', sets: 3, reps: '10/leg', rest: '75s' },
            { name: isArabic ? 'سمانة واقف' : 'Calf Raise', sets: 4, reps: '15-20', rest: '45s' },
          ]},
          { day: isArabic ? 'اليوم 4 — أكتاف' : 'Day 4 — Shoulders', exercises: [
            { name: isArabic ? 'أوفرهيد بريس' : 'Overhead Press', sets: 4, reps: '8-10', rest: '90s' },
            { name: isArabic ? 'رفع جانبي' : 'Lateral Raise', sets: 3, reps: '12-15', rest: '60s' },
            { name: isArabic ? 'فيس بول' : 'Face Pull', sets: 3, reps: '15', rest: '60s' },
            { name: isArabic ? 'شراغ بالبار' : 'Barbell Shrug', sets: 4, reps: '12-15', rest: '60s' },
          ]},
          { day: isArabic ? 'اليوم 5 — ذراع' : 'Day 5 — Arms', exercises: [
            { name: isArabic ? 'سوبر سيت: باي + تراي' : 'Superset: Curl + Pushdown', sets: 4, reps: '10+10', rest: '75s' },
            { name: isArabic ? 'هامر + كيك باك' : 'Hammer + Kickback', sets: 3, reps: '12+12', rest: '60s' },
            { name: isArabic ? 'باي كابل' : 'Cable Curl', sets: 3, reps: '12', rest: '60s' },
            { name: isArabic ? 'تراي أوفرهيد' : 'Overhead Ext.', sets: 3, reps: '12', rest: '60s' },
          ]},
        ],
        tips: isArabic
          ? ['سخّن 10 دقائق كارديو خفيف قبل كل تمرين', 'زوّد الأوزان تدريجياً 2.5 كجم كل أسبوعين', 'نم 7-8 ساعات يومياً']
          : ['Warm up 10 min before each session', 'Add 2.5kg every 2 weeks', 'Sleep 7-8 hours daily'],
      }),
      inputTokens: 250, outputTokens: 800, costUSD: 0.00026, model: 'demo',
    };
  }

  // Fallback general response
  return {
    text: isArabic
      ? 'مرحباً! أنا مساعدك الذكي في Power Time 💪\n\nيمكنني مساعدتك في:\n🥗 خطط التغذية\n🏋️ برامج التمارين\n💡 نصائح لياقة\n📊 متابعة التقدم\n\nاسألني أي سؤال! 🚀'
      : "Hi! I'm your Power Time AI 💪\n\nI help with:\n🥗 Nutrition Plans\n🏋️ Workout Programs\n💡 Fitness Tips\n📊 Progress Tracking\n\nAsk me anything! 🚀",
    inputTokens: 100, outputTokens: 200, costUSD: 0.00007, model: 'demo',
  };
}
