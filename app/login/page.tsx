import { Suspense } from "react";
import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { loginDefaults } from "@/lib/mocks/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

async function LoginFormWithParams({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <LoginForm
      defaultEmail={loginDefaults.email}
      nextPath={typeof next === "string" ? next : null}
    />
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="grid min-h-screen bg-canvas-soft lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Suspense
          fallback={
            <LoginForm defaultEmail={loginDefaults.email} nextPath={null} />
          }
        >
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
