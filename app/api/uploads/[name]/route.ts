import { getStorage } from "@/lib/storage";

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const f = await getStorage().read(name);
  if (!f) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = { "content-type": f.contentType, "cache-control": "public, max-age=31536000, immutable", "accept-ranges": "bytes" };
  // Safari only plays a video when the server answers byte-range requests.
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    const size = f.bytes.length;
    const start = m[1] ? parseInt(m[1], 10) : Math.max(0, size - parseInt(m[2], 10));
    const end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    return new Response(new Uint8Array(f.bytes.subarray(start, end + 1)), { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) } });
  }
  return new Response(new Uint8Array(f.bytes), { headers: { ...headers, "content-length": String(f.bytes.length) } });
}
