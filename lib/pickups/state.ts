export type PickupStatus = "open" | "offered" | "accepted" | "completed" | "cancelled";
export type PickupAction = "offer" | "accept" | "decline" | "withdraw" | "complete" | "cancel";
export type Role = "requester" | "driver" | "other";

export class TransitionError extends Error {
  constructor(message: string, public code: "invalid" | "forbidden") { super(message); }
}

const TABLE: Record<PickupAction, { from: PickupStatus[]; to: PickupStatus; who: Role[] }> = {
  offer: { from: ["open"], to: "offered", who: ["other"] },
  accept: { from: ["offered"], to: "accepted", who: ["requester"] },
  decline: { from: ["offered"], to: "open", who: ["requester"] },
  withdraw: { from: ["offered"], to: "open", who: ["driver"] },
  complete: { from: ["accepted"], to: "completed", who: ["requester", "driver"] },
  cancel: { from: ["open", "offered", "accepted"], to: "cancelled", who: ["requester"] },
};

export function roleOf(userId: string, p: { requesterId: string; driverId: string | null }): Role {
  if (userId === p.requesterId) return "requester";
  if (p.driverId && userId === p.driverId) return "driver";
  return "other";
}

export function nextStatus(status: PickupStatus, action: PickupAction, role: Role): PickupStatus {
  const t = TABLE[action];
  if (!t) throw new TransitionError("That action isn't available.", "invalid");
  if (!t.from.includes(status)) throw new TransitionError(`This pickup is already ${status}, so that can't happen now.`, "invalid");
  if (!t.who.includes(role)) {
    throw new TransitionError(action === "offer" ? "You can't offer help on your own request." : "Only the right person can do that.", "forbidden");
  }
  return t.to;
}
