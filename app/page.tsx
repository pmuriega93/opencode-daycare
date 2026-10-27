import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { PostCard } from "@/components/feed/PostCard";
import { headerSummary, posts, user } from "@/lib/mocks/feed";

export default function Home() {
  return (
    <AppLayout active="feed">
      <div className="mx-auto w-full max-w-[760px] px-5 py-6 sm:px-8 lg:px-[40px] lg:py-[34px] lg:pb-[80px]">
        <PageHeader
          eyebrow="GUARDERÍA · SALA SOLES"
          title={`Buenas, ${user.name.split(" ")[0]}`}
          subtitle={`${headerSummary.children} niños · ${headerSummary.date}`}
        />
        <FeedComposer initial={user.initial} />
        <SectionLabel>PUBLICADO HOY</SectionLabel>
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
