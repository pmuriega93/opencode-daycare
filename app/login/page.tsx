import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { loginDefaults } from "@/lib/mocks/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-canvas-soft lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <LoginForm defaultEmail={loginDefaults.email} />
      </div>
    </div>
  );
}
