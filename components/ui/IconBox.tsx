import type { ReactNode } from "react";

type IconBoxProps = {
  children: ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  className?: string;
};

export function IconBox({
  children,
  bg = "#FBE3D8",
  color = "#E0654A",
  size = 38,
  className = "",
}: IconBoxProps) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-[12px] ${className}`}
      style={{ width: size, height: size, background: bg, color }}
    >
      {children}
    </span>
  );
}
