export type Slot = { id: string; provider: string; start: string; end: string; available: boolean };

export type Booking = {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};

export type BookingsPage = { bookings: Booking[]; next_cursor: string | null };

export const queryKeys = {
  slots: (provider: string) => ["slots", provider] as const,
  bookings: (email: string) => ["bookings", email] as const,
};

export class WebApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    const wait = res.headers.get("retry-after");
    const suffix = res.status === 429 && wait ? ` Try again in ${wait}s.` : "";
    throw new WebApiError(res.status, `${data.error ?? "Something went wrong."}${suffix}`);
  }
  return data as T;
}

export const fetchSlots = async (provider: string) => {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  return (await request<{ slots: Slot[] }>(`/web/slots${query}`)).slots;
};

export const createBooking = (
  input: { slot_id: string; name: string; email: string },
  idempotencyKey: string,
) =>
  request<Booking>("/web/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });

export const fetchBookings = (email: string, cursor?: string) => {
  const params = new URLSearchParams({ email, limit: "5" });
  if (cursor) params.set("cursor", cursor);
  return request<BookingsPage>(`/web/bookings?${params}`);
};

export const cancelBooking = (id: string) =>
  request<Booking>(`/web/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
