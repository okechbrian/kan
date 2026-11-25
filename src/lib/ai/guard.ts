export type GuardResult = { allowed: true } | { allowed: false; reason: string };

export function aiStatus(apiKeyPresent: boolean) {
  return apiKeyPresent ? "available" : "not_configured";
}

export function isCrisis(text: string) {
  return /\b(suicid|self[- ]?harm|kill myself|end my life|hurt myself)\b/i.test(text);
}

export function redactSensitive(text: string) {
  return text
    .replace(/\+?2567\d{8}/g, "[phone]")
    .replace(/\b07\d{8}\b/g, "[phone]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\b\d{6,}\b/g, "[number]");
}

export function guardQuestion(text: string): GuardResult {
  const clean = text.trim();
  if (clean.length === 0) return { allowed: false, reason: "empty_question" };
  if (clean.length > 800) return { allowed: false, reason: "question_too_long" };
  if (isCrisis(clean)) return { allowed: false, reason: "crisis" };
  return { allowed: true };
}

export function guardAnswer(answer: string): GuardResult {
  if (!answer.trim()) return { allowed: false, reason: "empty_answer" };
  if (/\b(guarantee|guaranteed)\b/i.test(answer)) {
    return { allowed: false, reason: "no_guarantees" };
  }
  if (/\b\d{9,}\b/.test(answer)) return { allowed: false, reason: "possible_phone" };
  return { allowed: true };
}

export function buildPrompt(question: string, context: string) {
  const safeQuestion = redactSensitive(question.trim().slice(0, 800));
  const safeContext = redactSensitive(context.trim().slice(0, 2000));
  return [
    "You are Kan, an assistant for Ugandan shopkeepers.",
    "Use only the trusted context below. If you do not know, say so.",
    "Never invent prices, phone numbers, dates, stock counts or availability.",
    "Never give medical, legal or financial advice.",
    `Context: ${safeContext || "none supplied"}`,
    `Question: ${safeQuestion}`,
  ].join("\n");
}

export const SAFE_FALLBACK =
  "I cannot answer that yet. Ask about using the till, stock, credit or reports. When a live AI service is connected, answers will come from your own records.";
