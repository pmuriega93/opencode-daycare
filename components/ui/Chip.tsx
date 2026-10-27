import type { ChipType } from "@/lib/types/feed";

const CHIPS: Record<
  ChipType,
  { bg: string; dot: string; text: string; label: string }
> = {
  achievement: { bg: "#CFEBD8", dot: "#3E9B6C", text: "#3E9B6C", label: "LOGRO" },
  activity: { bg: "#C7E7F1", dot: "#2E89A6", text: "#2E89A6", label: "ACTIVIDAD" },
  announcement: { bg: "#CCD8F4", dot: "#4E72C8", text: "#4E72C8", label: "ANUNCIO" },
};

type ChipProps = { type: ChipType; className?: string };

export function Chip({ type, className = "" }: ChipProps) {
  const c = CHIPS[type];
  return (
    <div
      className={`inline-flex items-center gap-[7px] rounded-full px-3 py-[6px] ${className}`}
      style={{ background: c.bg }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} />
      <span
        className="text-[12px] font-extrabold tracking-[0.5px]"
        style={{ color: c.text }}
      >
        {c.label}
      </span>
    </div>
  );
}
