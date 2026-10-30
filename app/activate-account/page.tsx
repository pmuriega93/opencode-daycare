import type { Metadata } from "next";
import { ActivationForm } from "@/components/auth/ActivationForm";
import { invitation } from "@/lib/mocks/auth";

export const metadata: Metadata = {
  title: "Activá tu cuenta · OpenDayCare",
};

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-soft p-6 sm:p-10">
      <ActivationForm invitation={invitation} />
    </div>
  );
}
