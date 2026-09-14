import { describe, expect, it } from "vitest";
import { formatGpa } from "@/lib/gpa";
import { courseSchema } from "@/lib/validation";

const course = { id: "course-1", code: "MATH 101", name: "Calculus", color: "#7567F8", icon: "function", priority: 4 };

describe("course GPA validation", () => {
  it("accepts valid decimal GPA values including 3.7 and 4.0", () => {
    expect(courseSchema.safeParse({ ...course, targetGrade: 3.7 }).success).toBe(true);
    expect(courseSchema.safeParse({ ...course, targetGrade: 4.0 }).success).toBe(true);
  });

  it("rejects target GPAs outside the 0.0–4.0 range", () => {
    expect(courseSchema.safeParse({ ...course, targetGrade: 4.1 }).success).toBe(false);
    expect(courseSchema.safeParse({ ...course, targetGrade: -0.1 }).success).toBe(false);
  });

  it("formats GPA values consistently for course cards", () => {
    expect(formatGpa(3.7)).toBe("3.7");
    expect(formatGpa(4)).toBe("4.0");
    expect(formatGpa(undefined)).toBe("—");
  });
});
