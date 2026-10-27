import type { ReactNode } from "react";

type PhotoPlaceholderProps = {
  children?: ReactNode;
  height?: number;
  className?: string;
};

export function PhotoPlaceholder({
  children,
  height = 200,
  className = "",
}: PhotoPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290] ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
}
