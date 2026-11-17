"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { IconPlus } from "@/components/ui/Icons";
import { KidsList } from "@/components/kids/KidsList";
import { AddKidDialog } from "@/components/kids/AddKidDialog";
import type { Kid, Room } from "@/lib/types/kids";

type KidsPageContentProps = {
  kids: Kid[];
  rooms: Room[];
};

export function KidsPageContent({ kids, rooms }: KidsPageContentProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="GESTIÓN" title="Niños" className="mb-0" />
        <Button onClick={() => setDialogOpen(true)}>
          <IconPlus size={17} />
          Agregar niño
        </Button>
      </div>
      <KidsList kids={kids} rooms={rooms} />
      <AddKidDialog
        open={dialogOpen}
        rooms={rooms}
        onClose={() => setDialogOpen(false)}
        onAdded={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
