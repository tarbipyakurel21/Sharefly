import { describe, it, expect } from "vitest";
import { nextStatus, roleOf, TransitionError } from "@/lib/pickups/state";

describe("pickup state machine", () => {
  it("allowed transitions", () => {
    expect(nextStatus("open", "offer", "other")).toBe("offered");
    expect(nextStatus("offered", "accept", "requester")).toBe("accepted");
    expect(nextStatus("offered", "decline", "requester")).toBe("open");
    expect(nextStatus("offered", "withdraw", "driver")).toBe("open");
    expect(nextStatus("accepted", "complete", "requester")).toBe("completed");
    expect(nextStatus("accepted", "complete", "driver")).toBe("completed");
    for (const s of ["open", "offered", "accepted"] as const) expect(nextStatus(s, "cancel", "requester")).toBe("cancelled");
  });
  it("rejects invalid status", () => {
    expect(() => nextStatus("accepted", "offer", "other")).toThrow(TransitionError);
    expect(() => nextStatus("completed", "cancel", "requester")).toThrow(/already completed/);
  });
  it("rejects wrong person", () => {
    expect(() => nextStatus("open", "offer", "requester")).toThrow(/your own/);
    expect(() => nextStatus("offered", "accept", "driver")).toThrow(TransitionError);
    expect(() => nextStatus("open", "cancel", "other")).toThrow(TransitionError);
  });
  it("roleOf", () => {
    const p = { requesterId: "a", driverId: "b" };
    expect(roleOf("a", p)).toBe("requester");
    expect(roleOf("b", p)).toBe("driver");
    expect(roleOf("c", p)).toBe("other");
  });
});
