import { AppLayout } from "@/components/layout/AppLayout";
import { KidsPageContent } from "@/components/kids/KidsPageContent";

export default function KidsPage() {
  return (
    <AppLayout active="kids">
      <KidsPageContent />
    </AppLayout>
  );
}
