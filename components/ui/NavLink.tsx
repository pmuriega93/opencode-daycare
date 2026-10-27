import Link from "next/link";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  active?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export function NavLink({
  href,
  active = false,
  icon,
  children,
  onClick,
  className = "",
}: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] transition-colors ${
        active
          ? "bg-peach font-extrabold text-accent"
          : "bg-transparent font-semibold text-text-3 hover:bg-peach/40"
      } ${className}`}
    >
      {icon}
      {children}
    </Link>
  );
}
