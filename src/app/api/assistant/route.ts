import { NextResponse } from "next/server";
import { answerStudyQuestion } from "@/lib/assistant";
import { assistantRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = assistantRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ask a short study-related question and try again." }, { status: 400 });
    const reply = await answerStudyQuestion(parsed.data.question, parsed.data.data);
    return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The study coach is unavailable right now." }, { status: 500 });
  }
}
