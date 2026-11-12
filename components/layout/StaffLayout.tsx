import { Suspense } from "react";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { AppLayout } from "@/components/layout/AppLayout";
import { getCurrentProfile } from "@/lib/auth-server";

type StaffLayoutProps = {
  active: string;
  children: ReactNode;
};

async function ProfileLayout({ active, children }: StaffLayoutProps) {
  // El perfil depende de la sesión: forzar el render dinámico evita que el
  // prerender evalúe el subtree con valores inestables (p. ej. `Date.now()`).
  await connection();

  const profile = await getCurrentProfile();

  return (
    <AppLayout active={active} profile={profile}>
      {children}
    </AppLayout>
  );
}

/**
 * Layout de las pantallas del staff. Resuelve el perfil real dentro de un
 * `<Suspense>`: mientras carga, el sidebar muestra un skeleton en vez de datos
 * falsos.
 */
export function StaffLayout({ active, children }: StaffLayoutProps) {
  return (
    <Suspense
      fallback={
        <AppLayout active={active} profile={null}>
          {children}
        </AppLayout>
      }
    >
      <ProfileLayout active={active}>{children}</ProfileLayout>
    </Suspense>
  );
}
