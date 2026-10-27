import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: string;
};

export function Card({ children, className = "", padding = "20px 22px" }: CardProps) {
  return (
    <div
      className={`rounded-[20px] border border-line bg-surface shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)] ${className}`}
      style={{ padding }}
    >
      {children}
    </div>
  );
}
