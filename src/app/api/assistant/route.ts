import { NextResponse } from "next/server";
import { answerStudyQuestion } from "@/lib/assistant";
import { currentUserId } from "@/lib/current-user";
import { loadPlannerData } from "@/lib/planner-repository";
import { assistantRequestSchema, demoAssistantRequestSchema } from "@/lib/validation";
import type { PlannerData } from "@/lib/types";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a study question and try again." }, { status: 400 });
    }

    const parsed = assistantRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a study question between 3 and 500 characters." }, { status: 400 });

    const userId = await currentUserId();
    let data: PlannerData;
    if (userId) {
      try {
        data = await loadPlannerData(userId);
      } catch {
        return NextResponse.json({ error: "We couldn’t load your planner data right now. Please try again." }, { status: 503 });
      }
    } else {
      const demoRequest = demoAssistantRequestSchema.safeParse(body);
      if (!demoRequest.success) return NextResponse.json({ error: "Sign in to ask questions about your personal study plan." }, { status: 401 });
      data = demoRequest.data.data;
    }

    const reply = await answerStudyQuestion(parsed.data.question, data);
    return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The study coach is unavailable right now. Please try again." }, { status: 503 });
  }
}
