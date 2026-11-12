"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { IconClose } from "@/components/ui/Icons";
import type { AuthProfile } from "@/lib/types/auth";

type DrawerProps = {
  open: boolean;
  active: string;
  profile: AuthProfile | null;
  onClose: () => void;
  onNewPost: () => void;
};

export function Drawer({
  open,
  active,
  profile,
  onClose,
  onNewPost,
}: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative h-full w-[248px] max-w-[80vw]">
        <Sidebar
          active={active}
          profile={profile}
          onNavigate={onClose}
          onNewPost={onNewPost}
          className="h-full"
        />
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[10px] bg-canvas text-text-3"
        >
          <IconClose size={18} />
        </button>
      </div>
    </div>
  );
}
