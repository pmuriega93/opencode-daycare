import { POST_TYPES } from "@/lib/posts";
import type { ChipType } from "@/lib/types/feed";

type ChipProps = { type: ChipType; className?: string };

export function Chip({ type, className = "" }: ChipProps) {
  const meta = POST_TYPES.find((item) => item.value === type) ?? POST_TYPES[0];
  return (
    <div
      className={`inline-flex items-center gap-[7px] rounded-full px-3 py-[6px] ${className}`}
      style={{ background: meta.softBg }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: meta.dot }} />
      <span
        className="text-[12px] font-extrabold tracking-[0.5px]"
        style={{ color: meta.text }}
      >
        {meta.chipLabel}
      </span>
    </div>
  );
}
