import { AppShell } from "@/components/app-shell";
import { LandingPage } from "@/components/landing-page";
import { auth } from "@/auth";
import { createEmptyPlannerData } from "@/lib/demo-data";
import { loadPlannerData } from "@/lib/planner-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = process.env.AUTH_SECRET ? await auth() : null;
  if (!session?.user?.id) return <LandingPage />;
  try {
    return <AppShell initialData={await loadPlannerData(session.user.id)} mode="authenticated" userName={session.user.name ?? "Student"} />;
  } catch {
    return <AppShell initialData={createEmptyPlannerData()} mode="authenticated" userName={session.user.name ?? "Student"} loadError="We couldn’t load your planner data. Please refresh or check your database connection." />;
  }
}
