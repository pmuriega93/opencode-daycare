import { StaffLayout } from "@/components/layout/StaffLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { FeedContent } from "@/components/feed/FeedContent";
import { headerSummary, user } from "@/lib/mocks/feed";

export default function Home() {
  return (
    <StaffLayout active="feed">
      <div className="mx-auto w-full max-w-[760px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
        <PageHeader
          eyebrow="GUARDERÍA · SALA SOLES"
          title={`Buenas, ${user.name.split(" ")[0]}`}
          subtitle={`${headerSummary.children} niños · ${headerSummary.date}`}
        />
        <FeedComposer initial={user.initial} />
        <FeedContent />
      </div>
    </StaffLayout>
  );
}
