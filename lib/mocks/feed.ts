import type { Post } from "../types/feed";

export const user = {
  name: "Caro Giménez",
  initial: "C",
  role: "Maestra · Soles",
  room: "Sala Soles",
};

export const headerSummary = { children: 12, date: "martes 17 jun" };

export const posts: Post[] = [
  {
    id: "post-1",
    author: { name: "Mateo", initial: "M", avatarBg: "#A9D9E8", avatarText: "#1F7A93" },
    time: "14:20",
    meta: "publicado por vos",
    recipient: "familia de Mateo",
    chip: "achievement",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-2",
    author: { name: "Mateo", initial: "M", avatarBg: "#A9D9E8", avatarText: "#1F7A93" },
    time: "09:40",
    meta: "publicado por vos",
    recipient: "familia de Mateo",
    chip: "activity",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: { alt: "Foto · pintando con témperas" },
    likes: 5,
    comments: 2,
  },
  {
    id: "post-3",
    author: { announcement: true },
    time: "07:50",
    meta: "publicado por vos",
    recipient: "toda la sala",
    chip: "announcement",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
