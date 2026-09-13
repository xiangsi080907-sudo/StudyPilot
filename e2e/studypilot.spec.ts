import { expect, test } from "@playwright/test";

test("shows the dashboard and generates a calendar plan", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /good afternoon, maya/i })).toBeVisible();
  await expect(page.getByText(/today.?s focus/i)).toBeVisible();

  await page.getByRole("button", { name: /generate study plan/i }).click();
  await expect(page.getByRole("heading", { name: "Your study calendar" })).toBeVisible();
});

test("opens course management", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Courses" }).click();
  await expect(page.getByRole("heading", { name: "Your courses" })).toBeVisible();
  await expect(page.getByText("CSE 123").first()).toBeVisible();
});
