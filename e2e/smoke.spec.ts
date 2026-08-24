import { test, expect } from "@playwright/test";

test.describe("Pulse dashboard", () => {
  test("loads the dashboard with KPIs and charts", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Pulse" })).toBeVisible();
    await expect(page.getByText("Gross revenue").first()).toBeVisible();
    // The hand-built charts expose themselves as accessible images.
    await expect(page.getByRole("img").first()).toBeVisible();
  });

  test("cross-filters to a route from the Top routes chart", async ({ page }) => {
    await page.goto("/");
    const routeButton = page.getByRole("button", { name: /Lagos → Abuja/ }).first();
    await routeButton.click();
    await expect(page).toHaveURL(/route=/);
    await expect(routeButton).toHaveAttribute("aria-pressed", "true");
  });

  test("changes the date range preset", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "7D" }).click();
    await expect(page).toHaveURL(/days=7/);
  });

  test("paginates and filters the transactions table", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Page 1 \//)).toBeVisible();
    await page.getByRole("button", { name: /Next/ }).click();
    await expect(page.getByText(/Page 2 \//)).toBeVisible();

    // Filtering to refunded resets back to page 1.
    await page.getByLabel("Status").selectOption("refunded");
    await expect(page.getByText(/Page 1 \//)).toBeVisible();
  });
});
