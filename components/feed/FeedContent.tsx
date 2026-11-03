"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { PostCard } from "@/components/feed/PostCard";
import { useFeed } from "@/components/feed/FeedProvider";

export function FeedContent() {
  const { posts } = useFeed();

  return (
    <>
      <SectionLabel>PUBLICADO HOY</SectionLabel>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
