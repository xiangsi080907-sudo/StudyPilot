import { expect, test } from "@playwright/test";

test("shows a professional landing page to unauthenticated visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /less planning. more progress./i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create account", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /try the demo/i })).toBeVisible();
});

test("enters and exits explicitly labeled demo mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /try the demo/i }).click();
  await expect(page.getByText(/you.re exploring the interactive demo/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /good (morning|afternoon|evening), demo student/i })).toBeVisible();
  await page.getByRole("button", { name: "Exit demo" }).first().click();
  await expect(page.getByRole("heading", { name: /less planning. more progress./i })).toBeVisible();
});

test("demo scheduling remains usable", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /generate study plan/i }).click();
  await expect(page.getByRole("heading", { name: "Your study calendar" })).toBeVisible();
});

test("course grade goals use validated GPA values", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Courses" }).click();
  await expect(page.getByText("Target GPA").first()).toBeVisible();
  await page.getByRole("button", { name: /add course/i }).click();
  const targetGpa = page.getByLabel("Target GPA");
  await expect(targetGpa).toHaveAttribute("min", "0");
  await expect(targetGpa).toHaveAttribute("max", "4");
  await expect(targetGpa).toHaveAttribute("step", "0.1");
  await page.getByLabel("Course name").fill("Biology");
  await page.getByLabel("Course code").fill("BIO 101");
  await targetGpa.fill("3.7");
  await page.getByRole("button", { name: "Save course" }).click();
  const biology = page.locator(".course-card").filter({ has: page.getByRole("heading", { name: "Biology" }) });
  await expect(biology.getByText("3.7", { exact: true })).toBeVisible();
  await biology.getByRole("button", { name: "Edit BIO 101" }).click();
  await page.getByLabel("Target GPA").fill("4.0");
  await page.getByRole("button", { name: "Save course" }).click();
  await expect(biology.getByText("4.0", { exact: true })).toBeVisible();
});

test("auth pages and protected APIs are available without leaking planner data", async ({ page }) => {
  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: /build a calmer study week/i })).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /make space for what matters/i })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveValue("");
  const courseResponse = await page.request.get("/api/courses");
  const taskResponse = await page.request.get("/api/tasks");
  expect(courseResponse.status()).toBe(401);
  expect(taskResponse.status()).toBe(401);
});
