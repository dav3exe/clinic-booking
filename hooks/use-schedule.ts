"use client";

import { useQuery } from "@tanstack/react-query";
import { dayKey } from "@/components/format";
import { fetchSlots, queryKeys, type Slot } from "@/lib/web-client";

export type ScheduleSlot = Slot & { past: boolean; bookable: boolean; day: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/** All slots plus the derived flags the page needs. The hero and the doctor list share this one query. */
export function useSchedule() {
  return useQuery({
    queryKey: queryKeys.slots(""),
    queryFn: () => fetchSlots(""),
    // Evaluated on each fetch (not during render) so "past" and "today" stay pure.
    select: (data) => {
      const now = Date.now();
      const slots: ScheduleSlot[] = data.map((slot) => {
        const past = new Date(slot.start).getTime() <= now;
        return { ...slot, past, bookable: slot.available && !past, day: dayKey(slot.start) };
      });
      return {
        slots,
        today: dayKey(new Date(now).toISOString()),
        tomorrow: dayKey(new Date(now + DAY_MS).toISOString()),
      };
    },
  });
}
