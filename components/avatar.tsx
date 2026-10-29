import { avatarTone, initials } from "@/components/format";

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
};

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${avatarTone(name)}`}
    >
      {initials(name)}
    </span>
  );
}
