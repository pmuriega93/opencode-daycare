"use client";

import { Avatar } from "@/components/ui/Avatar";
import { IconBox } from "@/components/ui/IconBox";
import { IconCamera } from "@/components/ui/Icons";
import { useFeed } from "@/components/feed/FeedProvider";

type FeedComposerProps = { initial: string };

export function FeedComposer({ initial }: FeedComposerProps) {
  const { openComposer } = useFeed();

  return (
    <button
      type="button"
      onClick={openComposer}
      className="mb-6 flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <Avatar initial={initial} bg="#F2937A" textColor="#fff" size={40} />
      <span className="flex-1 text-[15px] text-muted-2">
        Compartí un momento…
      </span>
      <IconBox size={38}>
        <IconCamera size={19} />
      </IconBox>
    </button>
  );
}
