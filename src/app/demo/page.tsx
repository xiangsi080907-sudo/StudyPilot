import { AppShell } from "@/components/app-shell";
import { createDemoData } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  return <AppShell initialData={createDemoData()} mode="demo" userName="Demo student" />;
}
