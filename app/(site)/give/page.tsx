import type { Metadata } from "next";
import { GiveFlow } from "@/components/listing/GiveFlow";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Give something away" };

export default async function GivePage() {
  const user = await getSessionUser();
  return <GiveFlow defaultNeighborhood={user?.neighborhood ?? null} />;
}
