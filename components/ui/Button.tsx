import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  variant?: "primary" | "ghost";
  href?: string;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  variant = "primary",
  href,
  children,
  className = "",
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[14px] font-extrabold text-[14.5px] transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-b from-button-from to-button-to text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)] px-[12px] py-[12px]"
      : "bg-transparent text-text-3 px-3 py-2";
  const cls = `${base} ${styles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
