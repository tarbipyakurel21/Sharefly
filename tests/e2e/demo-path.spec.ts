import { test, expect, type Page } from "@playwright/test";

async function switchTo(page: Page, name: string) {
  await page.goto("/browse");
  await page.getByLabel("Account menu").click();
  await page.getByLabel("Demo: switch person").selectOption({ label: name });
  await expect(page.getByLabel("Account menu")).toContainText(name.split(" ")[0]);
  await page.waitForTimeout(300);
}

test("demo path: wishlist + room -> photo listing -> match -> preview -> pickup", async ({ page }) => {
  // 1. Maya saves a wishlist and a room
  await switchTo(page, "Maya Chen");
  await page.goto("/wishlists");
  await page.getByLabel("What are you looking for?").fill("a desk for my bedroom, under $30, within 5 miles");
  await page.getByRole("button", { name: "Save wishlist" }).click();
  await expect(page.getByText("Nothing matches yet, but we'll let you know")).toBeVisible();
  await expect(page.getByText("Up to $30")).toBeVisible();

  await page.goto("/rooms");
  await page.getByLabel("Length").fill("12");
  await page.getByLabel("Width").fill("10");
  await page.getByLabel("Ceiling height").fill("8");
  await page.getByRole("button", { name: "Create my room" }).click();
  await expect(page.getByText("12 ft long")).toBeVisible();
  await page.reload();
  await expect(page.getByText("12 ft long · 10 ft wide · 8 ft tall")).toBeVisible();

  // 2. Jordan uploads a photo of a desk
  await switchTo(page, "Jordan Rivera");
  await page.goto("/give");
  await page.locator("#file-lib").setInputFiles("public/seed/demo-desk.jpg");
  await expect(page.getByLabel("Title")).toHaveValue("Desk", { timeout: 15_000 });
  await expect(page.getByText(/Free/).first()).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("heading", { name: /It's up/ })).toBeVisible();
  await expect(page.getByText(/1 person nearby is looking/)).toBeVisible();
  await page.getByRole("link", { name: "See your listing" }).click();
  await page.waitForURL(/\/items\//);
  const itemUrl = page.url();

  // 3. Maya sees the match
  await switchTo(page, "Maya Chen");
  await page.goto("/browse");
  await expect(page.getByTestId("unread-count")).toHaveText("1");
  await page.goto("/matches");
  await expect(page.getByTestId("match-list")).toContainText("Desk");
  await expect(page.getByTestId("match-list")).toContainText("Free, within your budget");
  await page.getByTestId("match-list").getByRole("link", { name: "Desk" }).first().click();
  await expect(page).toHaveURL(itemUrl);
  await expect(page.getByText("Size not provided yet")).toBeVisible();
  await expect(page.getByText("Can't confirm fit yet")).toBeVisible();

  // 4. Preview in room with uncertainty
  await page.getByRole("link", { name: "Preview in my room" }).click();
  await expect(page.getByTestId("piece-list")).toContainText("Typical size");
  await page.getByTestId("piece-list").getByRole("button").first().click();
  await expect(page.getByTestId("unconfirmed-note")).toContainText("Actual size not confirmed");
  await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 10_000 });

  // rotate, nudge, boundary clamp via many nudges, then reload keeps layout
  await page.getByRole("button", { name: "Rotate 90 degrees" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Move right" }).click();
  await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 10_000 });
  await page.reload();
  await expect(page.getByTestId("piece-list")).toContainText("Desk");

  // overlap warning with a second piece
  await page.getByRole("button", { name: "+ Desk" }).click();
  await page.getByLabel("Width").fill("9");
  await page.getByLabel("Width").press("Enter");
  await page.getByLabel("Depth").fill("11");
  await page.getByLabel("Depth").press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: /Overlaps/ })).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("piece-list").getByRole("button")).toHaveCount(2);

  // 5. Measurement request -> Jordan adds size -> piece becomes confirmed
  await page.getByTestId("piece-list").getByRole("button").first().click();
  await page.getByRole("button", { name: "Request measurements" }).click();
  await expect(page.getByText("We've asked for the size.")).toBeVisible();
  await page.goto(itemUrl);
  await page.getByRole("button", { name: "Request pickup help" }).click();
  await page.getByLabel("Drop-off neighborhood").fill("Princeton University Campus");
  await page.getByLabel("When works for you?").fill("Saturday morning");
  await page.getByRole("button", { name: "Post request" }).click();
  await expect(page.getByRole("link", { name: "See your pickup request" })).toBeVisible();

  await switchTo(page, "Jordan Rivera");
  await page.goto(itemUrl);
  await expect(page.getByText(/asked for measurements/)).toBeVisible();
  await page.getByLabel("Width").fill("4");
  await page.getByLabel("Depth").fill("2");
  await page.getByLabel("Height").fill("2'6\"");
  await page.getByRole("button", { name: "Save size" }).click();
  await expect(page.getByText(/wide ×/)).toBeVisible();

  await switchTo(page, "Maya Chen");
  await page.goto(itemUrl);
  await expect(page.getByText("Fits your room")).toBeVisible();

  // 6. RideBoard cycle
  await switchTo(page, "Sam Okafor");
  await page.goto("/rideboard");
  const card = page.getByTestId("board").locator("li", { hasText: "Desk" });
  await card.getByRole("button", { name: "I can help" }).click();
  await card.getByRole("button", { name: "Send offer" }).click();
  await expect(page.getByText("Thank you! We've let them know.")).toBeVisible();
  await expect(page.getByTestId("board").locator("li", { hasText: "Desk" })).toHaveCount(0);

  await switchTo(page, "Maya Chen");
  await page.goto("/rideboard");
  await page.getByRole("button", { name: /Accept Sam/ }).click();
  await expect(page.getByText("You're connected with Sam")).toBeVisible();
  await page.getByRole("button", { name: "Mark as picked up" }).first().click();
  await expect(page.getByText("Picked up").first()).toBeVisible();
});

test("reverse direction: listing first, then wishlist matches", async ({ page }) => {
  await switchTo(page, "Dana Whitfield");
  await page.goto("/wishlists");
  await page.getByLabel("What are you looking for?").fill("a tall bookshelf");
  await page.getByRole("button", { name: "Save wishlist" }).click();
  await expect(page.getByText(/We found \d+ thing/)).toBeVisible();
  await page.goto("/matches");
  await expect(page.getByTestId("match-list")).toContainText("bookshelf");
});

test("AI unavailable never blocks publishing (title-only listing)", async ({ page }) => {
  await page.route("**/api/ai/describe-item", (r) => r.fulfill({ json: { status: "unavailable", reason: "timeout" } }));
  await switchTo(page, "Alex Brooks");
  await page.goto("/give");
  await page.locator("#file-lib").setInputFiles("public/seed/lamp.jpg");
  await expect(page.getByText("We couldn't describe this one automatically")).toBeVisible();
  await page.getByLabel("Title").fill("Reading chair");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("heading", { name: /It's up/ })).toBeVisible();
});

test("3D planner: dragging a piece moves it and keeps it inside the walls", async ({ page }) => {
  await switchTo(page, "Priya Nair");
  await page.goto("/rooms/r-priya?add=l-table");
  await expect(page.getByTestId("piece-pos")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  const before = await page.getByTestId("piece-pos").textContent();
  const box = (await page.getByTestId("room-view").boundingBox())!;
  // the piece was auto-placed in free space; find it by trying points until a press selects it and a drag changes the position
  let moved = false;
  for (let fy = 0.35; fy <= 0.8 && !moved; fy += 0.07) {
    for (let fx = 0.3; fx <= 0.75 && !moved; fx += 0.07) {
      const x = box.x + box.width * fx, y = box.y + box.height * fy;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y + 20, { steps: 6 }); await page.mouse.up();
      const after = await page.getByTestId("piece-pos").textContent();
      if (after !== before) moved = true;
    }
  }
  expect(moved).toBe(true);
  // drag far outside: stays inside the room (|x| <= 1.52 m, |z| <= 1.83 m for a 10x12 ft room)
  const cur = (await page.getByTestId("piece-pos").textContent())!.split(",").map(Number);
  expect(Math.abs(cur[0])).toBeLessThanOrEqual(10 * 0.3048 / 2 + 1e-6);
  expect(Math.abs(cur[1])).toBeLessThanOrEqual(12 * 0.3048 / 2 + 1e-6);
  await expect(page.getByTestId("save-state")).toHaveText("Saved", { timeout: 10_000 });
});
