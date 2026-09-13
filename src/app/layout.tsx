import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "StudyPilot — Study with a clearer plan",
  description: "An AI-powered study planner that balances deadlines, workload, and your real availability.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
