import { NextResponse } from "next/server";
import { generateAiAwarePlan } from "@/lib/ai-plan";
import { plannerDataSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = plannerDataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid planner data", issues: parsed.error.flatten() }, { status: 400 });
    }
    const plan = await generateAiAwarePlan(parsed.data);
    return NextResponse.json(plan, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to generate a plan right now. Please try again." }, { status: 500 });
  }
}
