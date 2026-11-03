export type ChipType =
  | "meal" // Comida
  | "nap" // Siesta
  | "activity" // Actividad
  | "achievement" // Logro
  | "mood" // Ánimo
  | "photo" // Foto
  | "announcement"; // Anuncio

export type PostAuthor =
  | { name: string; initial: string; avatarBg: string; avatarText: string }
  | { announcement: true };

export type PostPhoto = {
  alt: string;
  src?: string; // object URL local (solo en publicaciones creadas en la sesión)
};

export type Post = {
  id: string;
  author: PostAuthor;
  time: string;
  meta: string;
  recipient: string;
  chip: ChipType;
  text: string;
  photos?: PostPhoto[];
  likes: number;
  comments: number;
};

export type NewPostRecipient = `kid:${string}` | "room";

export type NewPostFormValues = {
  // Al menos uno. "room" es exclusivo: o va solo, o van niños.
  recipients: NewPostRecipient[];
  type: ChipType;
  text: string;
  photos: PostPhoto[];
};

export type NewPostFieldErrors = Partial<Record<"text", string>>;
