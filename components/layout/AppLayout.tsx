"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { Drawer } from "@/components/layout/Drawer";

type AppLayoutProps = {
  active: string;
  children: ReactNode;
};

export function AppLayout({ active, children }: AppLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden lg:block">
        <Sidebar active={active} />
      </div>
      <Drawer open={open} active={active} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar open={open} onMenu={() => setOpen(true)} />
        <main className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
