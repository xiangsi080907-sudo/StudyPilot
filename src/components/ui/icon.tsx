import type { SVGProps } from "react";

type IconName = "grid" | "book" | "check" | "calendar" | "chart" | "sparkle" | "settings" | "bell" | "plus" | "arrow" | "clock" | "more" | "code" | "function" | "landmark" | "target" | "chevron" | "send" | "close" | "lightning" | "trash" | "edit";

const paths: Record<IconName, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  book: "M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17.5H7.5A2.5 2.5 0 0 0 5 22zm0 0v15M9 6h7",
  check: "m5 12 4 4L19 6",
  calendar: "M7 2v4M17 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  sparkle: "m12 3-1.2 5.8L5 10l5.8 1.2L12 17l1.2-5.8L19 10l-5.8-1.2zM19 16l-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6z",
  settings: "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.1A1.7 1.7 0 0 0 10.75 18.64a1.7 1.7 0 0 0-1.87.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.12 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3h.1A1.7 1.7 0 0 0 7.12 9.94a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.87.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.56 1.03h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z",
  bell: "M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  clock: "M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  code: "m8 9-3 3 3 3m8-6 3 3-3 3m-4-9-2 12",
  function: "M6 20c3-1 3-15 7-15h4M8 13h8",
  landmark: "m3 10 9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18",
  target: "M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 11v.01",
  chevron: "m9 18 6-6-6-6",
  send: "m22 2-7 20-4-9-9-4Z",
  close: "m6 6 12 12M18 6 6 18",
  lightning: "m13 2-9 12h7l-1 8 10-13h-7z",
  trash: "M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 3m3 0-1 14H7L6 7",
  edit: "m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM13.5 6.5l3 3",
};

export function Icon({ name, size = 18, className, ...props }: { name: IconName; size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}

export type { IconName };
