import Link from "next/link";
import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KidProfile } from "@/components/kids/KidProfile";
import { kids, getKidById } from "@/lib/mocks/kids";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function KidProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kid = getKidById(id);

  if (!kid) {
    return (
      <AppLayout active="kids">
        <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
          <Link
            href="/kids"
            className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-muted"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a Niños
          </Link>
          <div className="py-20 text-center">
            <h1 className="font-fredoka text-[28px] font-semibold text-text">
              Niño no encontrado
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              No encontramos ningún niño con el ID &quot;{id}&quot;.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout active="kids">
      <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
        <KidProfile kid={kid} />
      </div>
    </AppLayout>
  );
}

export default function KidProfilePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <AppLayout active="kids">
          <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
            <div className="py-20 text-center text-muted">Cargando…</div>
          </div>
        </AppLayout>
      }
    >
      <KidProfileContent params={params} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return kids.map((kid) => ({ id: kid.id }));
}
