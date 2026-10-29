import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { IconPlus } from "@/components/ui/Icons";
import { KidsList } from "@/components/kids/KidsList";
import { kids } from "@/lib/mocks/kids";

export default function KidsPage() {
  return (
    <AppLayout active="kids">
      <div className="mx-auto w-full max-w-[880px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
        <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
          <PageHeader eyebrow="GESTIÓN" title="Niños" className="mb-0" />
          <Button href="/kids/nuevo">
            <IconPlus size={17} />
            Agregar niño
          </Button>
        </div>
        <KidsList kids={kids} />
      </div>
    </AppLayout>
  );
}
