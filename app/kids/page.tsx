import { Suspense } from "react";
import { connection } from "next/server";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { KidsPageContent } from "@/components/kids/KidsPageContent";
import { getKids, getRooms } from "@/lib/kids-server";

async function KidsContent() {
  // La lista depende de la sesión (RLS): renderizarla en request time evita
  // que el prerender evalúe componentes cliente con valores inestables.
  await connection();

  const [rooms, kids] = await Promise.all([getRooms(), getKids()]);

  return <KidsPageContent kids={kids} rooms={rooms} />;
}

export default function KidsPage() {
  return (
    <StaffLayout active="kids">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-[880px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
            <div className="py-20 text-center text-muted">Cargando…</div>
          </div>
        }
      >
        <KidsContent />
      </Suspense>
    </StaffLayout>
  );
}
