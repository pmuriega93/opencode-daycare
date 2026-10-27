import type { ReactNode } from "react";

type AvatarProps = {
  initial?: string;
  bg: string;
  textColor: string;
  size?: number;
  children?: ReactNode;
  className?: string;
};

export function Avatar({
  initial,
  bg,
  textColor,
  size = 40,
  children,
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-fredoka font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: textColor,
        fontSize: Math.round(size * 0.42),
      }}
    >
      {children ?? initial}
    </div>
  );
}
