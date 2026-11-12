import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next.js 16 renombró `middleware.ts` a `proxy.ts`.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Excluye `_next/` completo (assets, `/_next/mcp` y HMR) más el favicon y
    // las imágenes para no correr Supabase en cada archivo estático.
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
