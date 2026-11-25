import { NextResponse } from "next/server";
import { buildPrompt, guardAnswer, guardQuestion, SAFE_FALLBACK } from "../../../../lib/ai/guard";

export async function POST(request: Request) {
  let body: { question?: string; context?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const question = String(body.question ?? "");
  const checked = guardQuestion(question);
  if (!checked.allowed) {
    if (checked.reason === "crisis") {
      return NextResponse.json(
        { answer: "Please contact a local emergency service or someone you trust. Kan cannot help with this." },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: checked.reason }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", answer: SAFE_FALLBACK },
      { status: 503 }
    );
  }

  // A live provider is deliberately not wired yet. Never fake an answer.
  const prompt = buildPrompt(question, String(body.context ?? ""));
  const answer = SAFE_FALLBACK;
  const safe = guardAnswer(answer).allowed ? answer : SAFE_FALLBACK;
  return NextResponse.json({ answer: safe, promptReady: Boolean(prompt) });
}
