import { test, expect } from "@playwright/test";

// Uses a synthetic fixture (tests/fixtures/reference-spaces.sample.json), not CoStar data.
test("start from a real apartment: estimate is labelled, editable, and the source shows on the room", async ({ page }) => {
  await page.goto("/browse");
  await page.getByLabel("Account menu").click();
  await page.getByLabel("Demo: switch person").selectOption({ label: "Maya Chen" });
  await page.waitForTimeout(300);

  await page.goto("/rooms");
  await expect(page.getByRole("heading", { name: "Start from a real apartment" })).toBeVisible();
  await page.getByLabel("Bedrooms").selectOption("1");
  await expect(page.getByTestId("ap-results")).toContainText("Fixture Flats");
  await expect(page.getByTestId("ap-results")).not.toContainText("Fixture Commons");
  await page.getByTestId("ap-results").getByRole("button", { name: /Fixture Flats/ }).click();
  await expect(page.getByTestId("estimate-note")).toContainText("Estimated from a 700 sq ft floor plan, adjust to your room");
  await expect(page.getByLabel("Length")).not.toHaveValue("");
  await page.getByLabel("Length").fill("13");
  await page.getByRole("button", { name: "Create my room" }).click();
  await expect(page.getByTestId("room-source")).toContainText("Fixture Flats");
  await expect(page.getByTestId("room-source")).toContainText("Data: CoStar");
  await expect(page.getByText("13 ft long")).toBeVisible();
});

test("unknown rent is shown as not provided and hidden by a rent cap", async ({ page }) => {
  await page.goto("/browse");
  await page.getByLabel("Account menu").click();
  await page.getByLabel("Demo: switch person").selectOption({ label: "Maya Chen" });
  await page.waitForTimeout(300);
  await page.goto("/rooms");
  await expect(page.getByTestId("ap-results")).toContainText("Rent not provided");
  await page.getByLabel("Max rent ($/mo)").fill("5000");
  await expect(page.getByTestId("ap-results")).not.toContainText("Rent not provided");
});
