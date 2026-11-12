import { StaffLayout } from "@/components/layout/StaffLayout";
import { KidsPageContent } from "@/components/kids/KidsPageContent";

export default function KidsPage() {
  return (
    <StaffLayout active="kids">
      <KidsPageContent />
    </StaffLayout>
  );
}
