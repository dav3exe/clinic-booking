import { ApiError, json, readJson } from "@/lib/api";
import { resetSchema } from "@/schemas/slot";
import { listSlots, resetSlots } from "@/services/slot-service";

export async function listSlotsController(req: Request): Promise<Response> {
  const provider = new URL(req.url).searchParams.get("provider") ?? undefined;
  return json({ slots: await listSlots(provider) });
}

export async function resetController(req: Request): Promise<Response> {
  const parsed = resetSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new ApiError(400, "body must be { slots: [{ id, provider, start, end }] }");
  await resetSlots(parsed.data.slots);
  return json({ ok: true, slots: parsed.data.slots.length });
}
