import { avatarTone, initials } from "@/components/format";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "size-7 text-[11px]" : "size-9 text-xs";
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dimensions} ${avatarTone(name)}`}
    >
      {initials(name)}
    </span>
  );
}
