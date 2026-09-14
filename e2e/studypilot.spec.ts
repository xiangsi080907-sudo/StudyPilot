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
