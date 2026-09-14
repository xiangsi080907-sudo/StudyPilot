export function formatGpa(gpa: number | undefined): string {
  return gpa === undefined ? "—" : gpa.toFixed(1);
}
