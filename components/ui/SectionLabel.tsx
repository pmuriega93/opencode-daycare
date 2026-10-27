import type { ReactNode } from "react";

type SectionLabelProps = { children: ReactNode; className?: string };

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <div className={`mb-[14px] flex items-center gap-[14px] ${className}`}>
      <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
        {children}
      </span>
      <span className="h-px flex-1 bg-[#E7DAC8]" />
    </div>
  );
}
