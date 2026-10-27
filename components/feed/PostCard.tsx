import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import {
  IconHeart,
  IconComment,
  IconMegaphone,
  IconPhoto,
} from "@/components/ui/Icons";
import type { Post } from "@/lib/types/feed";

type PostCardProps = { post: Post };

export function PostCard({ post }: PostCardProps) {
  const isAnnouncement =
    "announcement" in post.author && post.author.announcement === true;

  return (
    <Card padding="20px 22px">
      <div className="mb-[14px] flex items-center gap-3">
        {isAnnouncement ? (
          <Avatar bg="#CCD8F4" textColor="#4E72C8" size={44}>
            <IconMegaphone size={20} />
          </Avatar>
        ) : (
          <Avatar
            initial={(post.author as { initial: string }).initial}
            bg={(post.author as { avatarBg: string }).avatarBg}
            textColor={(post.author as { avatarText: string }).avatarText}
            size={44}
          />
        )}
        <div className="flex-1">
          <div className="font-fredoka text-[16.5px] font-semibold text-text">
            {isAnnouncement
              ? "Anuncio general"
              : (post.author as { name: string }).name}
          </div>
          <div className="text-[12.5px] text-muted-2">
            {post.time} · {post.meta}
          </div>
        </div>
        <Chip type={post.chip} />
      </div>

      <div className="mb-[10px] text-[12.5px] text-muted-2">
        Para: {post.recipient}
      </div>

      <p className="m-0 text-[15.5px] leading-[1.55] text-text-2">{post.text}</p>

      {post.photo ? (
        <Link href={`/fotos/${post.id}`} className="mt-[14px] block">
          <PhotoPlaceholder height={200}>
            <IconPhoto size={30} />
            <span className="text-[13.5px]">{post.photo.alt}</span>
          </PhotoPlaceholder>
        </Link>
      ) : null}

      <div className="mt-[16px] flex items-center gap-[18px] border-t border-[#F0E6D8] pt-[14px]">
        <span className="flex items-center gap-[7px] text-[14px] font-bold text-accent-3">
          <IconHeart size={19} fill="#E0654A" />
          {post.likes}
        </span>
        <Link
          href={`/publicaciones/${post.id}`}
          className="flex items-center gap-[7px] text-[14px] font-bold text-muted"
        >
          <IconComment size={18} />
          {post.comments}
        </Link>
        <span className="flex-1" />
        <Link
          href="/crear-publicacion"
          className="text-[14px] font-extrabold text-accent-2"
        >
          Editar
        </Link>
      </div>
    </Card>
  );
}
