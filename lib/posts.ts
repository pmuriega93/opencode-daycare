import type {
  ChipType,
  NewPostFieldErrors,
  NewPostFormValues,
  NewPostRecipient,
  Post,
} from "./types/feed";
import type { Kid } from "./types/kids";

export type PostTypeMeta = {
  value: ChipType;
  label: string;
  chipLabel: string;
  softBg: string;
  dot: string;
  text: string;
  solidBg: string;
  solidText: string;
};

// Única fuente de la paleta de tipos: la consumen `Chip` (variante "soft"
// de la card) y el form de crear publicación (variante "solid").
export const POST_TYPES: readonly PostTypeMeta[] = [
  {
    value: "meal",
    label: "Comida",
    chipLabel: "COMIDA",
    softBg: "#F3E4BC",
    dot: "#9A7B1E",
    text: "#9A7B1E",
    solidBg: "#9A7B1E",
    solidText: "#FFFFFF",
  },
  {
    value: "nap",
    label: "Siesta",
    chipLabel: "SIESTA",
    softBg: "#E7DCF6",
    dot: "#7B5FC0",
    text: "#7B5FC0",
    solidBg: "#E7DCF6",
    solidText: "#7B5FC0",
  },
  {
    value: "activity",
    label: "Actividad",
    chipLabel: "ACTIVIDAD",
    softBg: "#C7E7F1",
    dot: "#2E89A6",
    text: "#2E89A6",
    solidBg: "#2E89A6",
    solidText: "#FFFFFF",
  },
  {
    value: "achievement",
    label: "Logro",
    chipLabel: "LOGRO",
    softBg: "#CFEBD8",
    dot: "#3E9B6C",
    text: "#3E9B6C",
    solidBg: "#CFEBD8",
    solidText: "#3E9B6C",
  },
  {
    value: "mood",
    label: "Ánimo",
    chipLabel: "ÁNIMO",
    softBg: "#F9D2DE",
    dot: "#C56486",
    text: "#C56486",
    solidBg: "#F9D2DE",
    solidText: "#C56486",
  },
  {
    value: "photo",
    label: "Foto",
    chipLabel: "FOTO",
    softBg: "#FBD8CC",
    dot: "#D9684A",
    text: "#D9684A",
    solidBg: "#FBD8CC",
    solidText: "#D9684A",
  },
  {
    value: "announcement",
    label: "Anuncio",
    chipLabel: "ANUNCIO",
    softBg: "#CCD8F4",
    dot: "#4E72C8",
    text: "#4E72C8",
    solidBg: "#CCD8F4",
    solidText: "#4E72C8",
  },
];

const ROOM_NAME = "Soles";

/** Niños de la sala Soles, en el orden de los mocks. */
export function roomKids(kids: Kid[]): Kid[] {
  return kids.filter((kid) => kid.room === ROOM_NAME);
}

/** ["Mateo", "Sofía", "Benjamín"] → "Mateo, Sofía y Benjamín". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function firstName(kid: Kid): string {
  return kid.name.split(" ")[0];
}

/**
 * ["kid:mateo-fernandez"]                  → "familia de Mateo"
 * ["kid:mateo-fernandez", "kid:sofia..."]  → "familias de Mateo y Sofía"
 * ["room"]                                 → "toda la sala"
 */
export function recipientLabel(
  recipients: NewPostRecipient[],
  kids: Kid[],
): string {
  if (recipients.includes("room")) return "toda la sala";

  const names = recipients.map((recipient) => {
    const id = recipient.slice("kid:".length);
    const kid = kids.find((item) => item.id === id);
    return kid ? firstName(kid) : id;
  });

  if (names.length === 0) return "sin destinatario";
  if (names.length === 1) return `familia de ${names[0]}`;
  return `familias de ${joinNames(names)}`;
}

/** Solo la descripción es obligatoria. */
export function validateNewPost(
  values: NewPostFormValues,
): NewPostFieldErrors {
  const errors: NewPostFieldErrors = {};
  if (!values.text.trim()) {
    errors.text = "Escribí una descripción";
  }
  return errors;
}

/** "15:42" (hora local, 2 dígitos). */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Construye la publicación en memoria a partir de un form ya validado.
 * Solo se llama si validateNewPost devolvió {}.
 */
export function buildPost(
  values: NewPostFormValues,
  kids: Kid[],
  now: Date,
): Post {
  const selectedKids = values.recipients
    .filter((recipient) => recipient !== "room")
    .map((recipient) =>
      kids.find((item) => `kid:${item.id}` === recipient),
    )
    .filter((kid): kid is Kid => Boolean(kid));
  const kid = selectedKids[0];

  return {
    id: `post-${now.getTime()}`,
    author: kid
      ? {
          name: joinNames(selectedKids.map(firstName)),
          initial: kid.initial,
          avatarBg: kid.avatarBg,
          avatarText: kid.avatarText,
        }
      : { announcement: true },
    time: formatTime(now),
    meta: "publicado por vos",
    recipient: recipientLabel(values.recipients, kids),
    chip: values.type,
    text: values.text.trim(),
    photos: values.photos.length ? values.photos : undefined,
    likes: 0,
    comments: 0,
  };
}
