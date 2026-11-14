import { Chip } from "@/components/ui/Chip";
import { FIT_TEXT, type FitStatus } from "@/lib/room/geometry";

export function FitBadge({ status }: { status: FitStatus }) {
  return <Chip tone={status === "fits" ? "good" : status === "wont_fit" ? "bad" : "warn"}>{FIT_TEXT[status]}</Chip>;
}
