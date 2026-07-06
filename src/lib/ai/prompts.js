// ===== AI Prompt Templates =====

// Input sanitization to prevent prompt injection
const MAX_MESSAGE_LENGTH = 500;
const MAX_FIELD_LENGTH = 200;

function sanitizeInput(text, maxLen = MAX_FIELD_LENGTH) {
  if (!text || typeof text !== 'string') return '';
  return text
    .slice(0, maxLen)
    // Strip control characters (keep Arabic, emoji, and normal text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potential injection patterns
    .replace(/(?:ignore|forget|disregard)\s+(?:all\s+)?(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)/gi, '[filtered]')
    .trim();
}

function sanitizeMessage(msg) {
  return sanitizeInput(msg, MAX_MESSAGE_LENGTH);
}

// Coerce a numeric field to a clamped number (defends against injection via
// "numeric" inputs that arrive as strings).
function clampNum(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Generate nutrition plan prompt
 */
export function nutritionPrompt({ weight, height, age, gender, goal, allergies, dietType, activityLevel, locale }) {
  const isAr = locale === 'ar';
  // Sanitize/clamp every client-supplied field (these are interpolated into the
  // prompt — raw values are a prompt-injection vector).
  const w = clampNum(weight, 20, 400, 70);
  const h = clampNum(height, 50, 300, 170);
  const a = clampNum(age, 5, 120, 30);
  const g = sanitizeInput(gender, 20) || 'unspecified';
  const goalS = sanitizeInput(goal, 60) || 'general fitness';
  const allergiesS = sanitizeInput(allergies, 200) || 'None';
  const dietS = sanitizeInput(dietType, 60) || 'Standard balanced';
  const activityS = sanitizeInput(activityLevel, 60) || 'Moderate (3-5 gym sessions/week)';
  return `You are an expert sports nutritionist for a gym called "Power Time".
${isAr ? 'Respond entirely in Arabic.' : 'Respond in English.'}

Create a personalized daily nutrition plan with the following details:
- Weight: ${w} kg
- Height: ${h} cm
- Age: ${a} years
- Gender: ${g}
- Goal: ${goalS}
- Food allergies/restrictions: ${allergiesS}
- Diet type: ${dietS}
- Activity level: ${activityS}

Return a JSON object with this exact structure:
{
  "planName": "string",
  "dailyCalories": number,
  "macros": { "protein": number, "carbs": number, "fat": number },
  "meals": [
    {
      "name": "string (meal name)",
      "time": "HH:MM",
      "calories": number,
      "items": ["item 1", "item 2", ...]
    }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "supplements": ["supplement 1 if needed"]
}

Include 5 meals. Be specific with portions (grams). Calculate macros accurately based on the goal.`;
}

/**
 * Generate workout plan prompt
 */
export function workoutPrompt({ level, goal, daysPerWeek, duration, injuries, equipment, locale }) {
  const isAr = locale === 'ar';
  // Sanitize/clamp every client-supplied field (prompt-injection defense).
  const levelS = sanitizeInput(level, 40) || 'beginner';
  const goalS = sanitizeInput(goal, 60) || 'general fitness';
  const days = clampNum(daysPerWeek, 1, 7, 3);
  const durationS = sanitizeInput(duration, 40) || '4 weeks';
  const injuriesS = sanitizeInput(injuries, 200) || 'None';
  const equipmentS = sanitizeInput(equipment, 200) || 'Full gym equipment';
  return `You are an expert personal trainer at "Power Time" gym.
${isAr ? 'Respond entirely in Arabic.' : 'Respond in English.'}

Create a personalized workout program with these details:
- Fitness level: ${levelS}
- Goal: ${goalS}
- Training days per week: ${days}
- Program duration: ${durationS}
- Injuries/limitations: ${injuriesS}
- Available equipment: ${equipmentS}

Return a JSON object with this exact structure:
{
  "programName": "string",
  "duration": "string",
  "daysPerWeek": number,
  "level": "string",
  "days": [
    {
      "day": "string (e.g. Day 1 - Chest & Triceps)",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string (e.g. 8-10)",
          "rest": "string (e.g. 90s)"
        }
      ]
    }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Apply progressive overload principles. Vary exercises to prevent plateaus. Include warm-up notes.`;
}

/**
 * Chat assistant prompt
 */
export function chatPrompt({ message, role, locale, context }) {
  const isAr = locale === 'ar';
  const safeMessage = sanitizeMessage(message);
  const safeContext = sanitizeInput(context);
  const roleDesc = {
    client: isAr ? 'عضو في الجيم' : 'gym member',
    trainer: isAr ? 'مدرب لياقة' : 'fitness trainer',
    admin: isAr ? 'مدير الصالة' : 'gym manager',
  };

  return `You are "Power Time AI", the intelligent assistant for "Power Time" gym management system.
${isAr ? 'Respond in Arabic. Use a friendly, motivational tone.' : 'Respond in English. Be friendly and motivational.'}

You are talking to a ${roleDesc[role] || roleDesc.client}.
${safeContext ? `Context: ${safeContext}` : ''}

--- BEGIN USER MESSAGE ---
${safeMessage}
--- END USER MESSAGE ---

Guidelines:
- Be concise and helpful
- For fitness questions, provide evidence-based advice
- For nutrition, follow sports nutrition best practices
- Motivate the user when appropriate
- If asked about something you're unsure about, say so honestly
- Never provide medical diagnoses
- Keep responses under 300 words
- IMPORTANT: Only respond to fitness, nutrition, and gym-related questions. Politely decline other topics.`;
}
