import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { NavLink } from "@/components/ui/NavLink";
import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/lib/auth-actions";
import { roleLabel } from "@/lib/auth";
import type { AuthProfile } from "@/lib/types/auth";
import {
  IconSun,
  IconPlus,
  IconHome,
  IconChildren,
  IconBell,
  IconUser,
  IconLogout,
} from "@/components/ui/Icons";

type SidebarProps = {
  active: string;
  profile: AuthProfile | null;
  onNavigate?: () => void;
  onNewPost?: () => void;
  className?: string;
};

export function Sidebar({
  active,
  profile,
  onNavigate,
  onNewPost,
  className = "",
}: SidebarProps) {
  const initial = profile?.fullName.trim().charAt(0).toUpperCase() ?? "";
  const roleLine = profile
    ? profile.daycareName
      ? `${roleLabel(profile.role)} · ${profile.daycareName}`
      : roleLabel(profile.role)
    : "";

  return (
    <aside
      className={`flex h-screen w-[248px] flex-none flex-col bg-surface px-4 py-6 ${className}`}
      style={{ borderRight: "1px solid #ECE0D0" }}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <IconSun size={21} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-fredoka text-[17px] font-semibold leading-none text-text">
            OpenDayCare
          </div>
          {profile ? (
            profile.daycareName ? (
              <div className="mt-[2px] truncate text-[11.5px] text-muted-2">
                {profile.daycareName}
              </div>
            ) : null
          ) : (
            <div className="mt-[6px] h-[9px] w-20 animate-pulse rounded-full bg-line-soft" />
          )}
        </div>
      </Link>

      <Button onClick={onNewPost} className="mb-[18px] w-full">
        <IconPlus size={17} className="text-white" />
        Nueva publicación
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink
          href="/"
          active={active === "feed"}
          icon={<IconHome size={19} />}
          onClick={onNavigate}
        >
          Feed
        </NavLink>
        <NavLink
          href="/kids"
          active={active === "kids"}
          icon={<IconChildren size={19} />}
          onClick={onNavigate}
        >
          Niños
        </NavLink>
        <NavLink
          href="/avisos"
          active={active === "avisos"}
          icon={<IconBell size={19} />}
          onClick={onNavigate}
        >
          Avisos
        </NavLink>
        <NavLink
          href="/mi-cuenta"
          active={active === "cuenta"}
          icon={<IconUser size={19} />}
          onClick={onNavigate}
        >
          Mi cuenta
        </NavLink>
      </nav>

      <div className="mt-[10px] border-t border-line pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-[6px]">
          {profile ? (
            <>
              <Avatar initial={initial} bg="#F2937A" textColor="#fff" size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-extrabold text-text">
                  {profile.fullName}
                </div>
                <div className="truncate text-[12px] text-muted-2">
                  {roleLine}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-[38px] w-[38px] flex-none animate-pulse rounded-full bg-line-soft" />
              <div className="min-w-0 flex-1">
                <div className="h-[11px] w-24 animate-pulse rounded-full bg-line-soft" />
                <div className="mt-[7px] h-[9px] w-28 animate-pulse rounded-full bg-line-soft" />
              </div>
            </>
          )}
          <form action={signOut}>
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-canvas text-muted"
            >
              <IconLogout size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
