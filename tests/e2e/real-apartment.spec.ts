import { test, expect } from "@playwright/test";

// Uses a synthetic fixture (tests/fixtures/reference-spaces.sample.json), not CoStar data.
test("start from a real apartment: estimate is labelled, editable, and the source shows on the room", async ({ page }) => {
  await page.goto("/browse");
  await page.getByLabel("Account menu").click();
  await page.getByLabel("Demo: switch person").selectOption({ label: "Priya" });
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

test("unknown rent is shown as not provided", async ({ page }) => {
  await page.goto("/browse");
  await page.getByLabel("Account menu").click();
  await page.getByLabel("Demo: switch person").selectOption({ label: "Priya" });
  await page.waitForTimeout(300);
  await page.goto("/rooms");
  await expect(page.getByTestId("ap-results")).toContainText("Rent not provided");
});

async function signInAsPriya(page: import("@playwright/test").Page) {
  await page.goto("/browse");
  await page.getByLabel("Account menu").click();
  await page.getByLabel("Demo: switch person").selectOption({ label: "Priya" });
  await page.waitForTimeout(300);
}

test("a space whose model has no measurements keeps the labelled estimate", async ({ page }) => {
  await signInAsPriya(page);
  await page.goto("/rooms");
  await page.getByLabel("Bedrooms").selectOption("2");
  await page.getByTestId("ap-results").getByRole("button", { name: /Fixture Commons/ }).click();
  await expect(page.getByTestId("estimate-note")).toContainText("Measured sizes are not available");
});

test("tour panel is lazy, prefers the unit model, and offers the other levels", async ({ page }) => {
  await signInAsPriya(page);
  await page.goto("/rooms");
  await page.getByLabel("Bedrooms").selectOption("1");
  await page.getByTestId("ap-results").getByRole("button", { name: /Fixture Flats/ }).click();
  const panel = page.getByTestId("tour-panel");
  await expect(panel).toBeVisible();
  await expect(page.getByTestId("tour-frame")).toHaveCount(0); // nothing loads until asked
  await expect(page.getByTestId("tour-level")).toHaveText("This exact unit");
  await panel.getByRole("button", { name: /Load the 3D tour/ }).click();
  await expect(page.getByTestId("tour-frame")).toHaveAttribute("src", "https://my.matterport.com/show/?m=TESTUNIT01");
  await panel.getByRole("button", { name: "This floor plan" }).click();
  await expect(page.getByTestId("tour-frame")).toHaveAttribute("src", "https://my.matterport.com/show/?m=TESTFPLAN1");
  await panel.getByRole("button", { name: "The community" }).click();
  await expect(page.getByTestId("tour-frame")).toHaveAttribute("src", "https://my.matterport.com/show/?m=TESTCOMM01");
});

test("a space without a model id says so instead of showing a tour", async ({ page }) => {
  await signInAsPriya(page);
  await page.goto("/rooms");
  await page.getByLabel("Bedrooms").selectOption("0");
  await page.getByTestId("ap-results").getByRole("button", { name: /Community name not provided/ }).click();
  await expect(page.getByTestId("tour-none")).toBeVisible();
  await expect(page.getByTestId("no-size-note").or(page.getByTestId("estimate-note"))).toBeVisible();
});

test("Rabinowitz Hall is selectable and has no invented size", async ({ page }) => {
  await signInAsPriya(page);
  await page.goto("/rooms");
  await page.getByTestId("ap-results").getByRole("button", { name: /Rabinowitz Hall/ }).click();
  await expect(page.getByTestId("tour-panel")).toBeVisible();
  await expect(page.getByTestId("no-size-note").or(page.getByTestId("measured-note"))).toBeVisible();
});
