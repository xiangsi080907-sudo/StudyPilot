import { AppShell } from "@/components/app-shell";
import { auth } from "@/auth";
import { createDemoData } from "@/lib/demo-data";
import { loadPlannerData } from "@/lib/planner-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = process.env.AUTH_SECRET ? await auth() : null;
  if (!session?.user?.id) return <AppShell initialData={createDemoData()} />;
  try {
    return <AppShell initialData={await loadPlannerData(session.user.id)} />;
  } catch {
    // The public demo stays useful if a local database has not been configured yet.
    return <AppShell initialData={createDemoData()} />;
  }
}
