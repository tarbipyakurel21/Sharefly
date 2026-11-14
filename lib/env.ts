import { z } from "zod";

const schema = z.object({
  DATABASE_PATH: z.string().default("data/sharefly.db"),
  SESSION_SECRET: z.string().min(16).default("dev-only-secret-change-me-please"),
  DEMO_MODE: z.enum(["true", "false"]).default("false"),
  AI_PROVIDER: z.enum(["anthropic", "mock", "none"]).default("none"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),
});

export function getEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Never echo values: they may contain secrets.
    const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${keys}`);
  }
  if (process.env.NODE_ENV === "production" && parsed.data.SESSION_SECRET.startsWith("dev-only") && !warned) {
    warned = true;
    console.warn("[sharefly] SESSION_SECRET is the development default. Set a long random value before sharing this deployment.");
  }
  return parsed.data;
}
let warned = false;
export const isDemoMode = () => getEnv().DEMO_MODE === "true";
