import Link from "next/link";
import { IconSun, IconMenu } from "@/components/ui/Icons";

type MobileTopBarProps = {
  open: boolean;
  onMenu: () => void;
};

export function MobileTopBar({ open, onMenu }: MobileTopBarProps) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-[10px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <IconSun size={18} className="text-white" />
        </div>
        <div className="font-fredoka text-[16px] font-semibold text-text">
          OpenDayCare
        </div>
      </Link>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Abrir menú"
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-canvas text-text-3"
      >
        <IconMenu size={20} />
      </button>
    </div>
  );
}
