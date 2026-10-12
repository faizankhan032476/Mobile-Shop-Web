import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route, fromDb, requireAdmin, ApiError } from "@/lib/server/api";
import { PRODUCT_SELECT, toProduct } from "@/lib/server/mappers";

const MAX_BYTES = 5 * 1024 * 1024;
/** Trust the file's bytes, not the browser-supplied type or filename. */
function sniff(b: Uint8Array): { ext: string; mime: string } | null {
  const s = (o: number, t: string) => t.split("").every((c, i) => b[o + i] === c.charCodeAt(0));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && s(1, "PNG")) return { ext: "png", mime: "image/png" };
  if (s(0, "RIFF") && s(8, "WEBP")) return { ext: "webp", mime: "image/webp" };
  if (s(4, "ftyp") && (s(8, "avif") || s(8, "avis"))) return { ext: "avif", mime: "image/avif" };
  return null;
}
const productId = async (ctx: { params: Promise<Record<string, string>> }) => {
  const id = (await ctx.params).id;
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  return id;
};

export const POST = route(async (req, ctx) => {
  const { supabase } = await requireAdmin();
  const id = await productId(ctx);
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "VALIDATION", "Choose an image file.", { file: "Choose an image file." });
  if (file.size === 0 || file.size > MAX_BYTES) throw new ApiError(400, "VALIDATION", "Images must be under 5 MB.", { file: "Images must be under 5 MB." });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) throw new ApiError(400, "VALIDATION", "Only JPEG, PNG, WebP or AVIF images are allowed.", { file: "Unsupported image type." });

  const { data: p, error: e1 } = await supabase.from("products").select("images").eq("id", id).maybeSingle();
  if (e1) throw fromDb(e1);
  if (!p) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  if (p.images.length >= 10) throw new ApiError(400, "VALIDATION", "A product can have at most 10 images.");

  const path = `${id}/${randomUUID()}.${kind.ext}`;                     // server-generated name; the client's filename is ignored
  const up = await supabase.storage.from("product-images").upload(path, bytes, { contentType: kind.mime, upsert: false });
  if (up.error) throw new ApiError(up.error.message.includes("row-level security") ? 403 : 500, "UPLOAD_FAILED", "Image upload failed.");
  const { data, error } = await supabase.from("products").update({ images: [...p.images, path] }).eq("id", id).select(PRODUCT_SELECT).single();
  if (error) { await supabase.storage.from("product-images").remove([path]); throw fromDb(error); }
  return { data: toProduct(data) };
});

/** DELETE ?path=<image path or URL as stored>  Removes it from the product and from Storage. */
export const DELETE = route(async (req, ctx) => {
  const { supabase } = await requireAdmin();
  const id = await productId(ctx);
  const target = new URL(req.url).searchParams.get("path") ?? "";
  const { data: p, error: e1 } = await supabase.from("products").select("images").eq("id", id).maybeSingle();
  if (e1) throw fromDb(e1);
  if (!p || !p.images.includes(target)) throw new ApiError(404, "NOT_FOUND", "Image not found on this product.");
  const { data, error } = await supabase.from("products").update({ images: p.images.filter((x: string) => x !== target) }).eq("id", id).select(PRODUCT_SELECT).single();
  if (error) throw fromDb(error);
  if (!/^https?:\/\//.test(target)) await supabase.storage.from("product-images").remove([target]);
  return { data: toProduct(data) };
});
