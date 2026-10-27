export type ChipType = "achievement" | "activity" | "announcement";

export type PostAuthor =
  | { name: string; initial: string; avatarBg: string; avatarText: string }
  | { announcement: true };

export type Post = {
  id: string;
  author: PostAuthor;
  time: string;
  meta: string;
  recipient: string;
  chip: ChipType;
  text: string;
  photo?: { alt: string };
  likes: number;
  comments: number;
};
