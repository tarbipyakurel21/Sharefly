import { getStorage } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const f = await getStorage().read(name);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.bytes), { headers: { "content-type": f.contentType, "cache-control": "public, max-age=31536000, immutable" } });
}
