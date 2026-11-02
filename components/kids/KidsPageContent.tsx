"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { IconPlus } from "@/components/ui/Icons";
import { KidsList } from "@/components/kids/KidsList";
import { AddKidDialog } from "@/components/kids/AddKidDialog";
import { kids as mockKids } from "@/lib/mocks/kids";
import type { Kid } from "@/lib/types/kids";

export function KidsPageContent() {
  // Alta en memoria: se pierde al recargar (por diseño, SPEC 04).
  const [kids, setKids] = useState<Kid[]>(mockKids);
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
      <KidsList kids={kids} />
      <AddKidDialog
        open={dialogOpen}
        kids={kids}
        onClose={() => setDialogOpen(false)}
        onAdd={(kid) => setKids((prev) => [...prev, kid])}
      />
    </div>
  );
}
