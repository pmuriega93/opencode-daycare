import type {
  AddKidFieldErrors,
  AddKidFormValues,
  ChildRow,
  Kid,
} from "./types/kids";

const BIRTHDATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

// Rotación de las 5 combinaciones pastel de los mocks.
const AVATAR_ROTATION = [
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
] as const;

/**
 * Diccionario español → tag inglés para el texto libre del modal.
 * Los tags se persisten en inglés (convención del schema).
 */
const ALLERGY_TO_TAG: Record<string, string> = {
  mani: "peanut",
  lactosa: "lactose",
  "frutos secos": "nuts",
  gluten: "gluten",
  huevo: "egg",
  soja: "soy",
  pescado: "fish",
  mariscos: "shellfish",
};

/** Tag inglés → etiqueta visible en español. */
const TAG_TO_LABEL: Record<string, string> = {
  peanut: "Maní",
  lactose: "Lactosa",
  nuts: "Frutos secos",
  gluten: "Gluten",
  egg: "Huevo",
  soy: "Soja",
  fish: "Pescado",
  shellfish: "Mariscos",
  strawberry: "Frutilla",
};

export type ParsedBirthdate = { day: number; month: number; year: number };

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toAsciiSlug(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Traduce el texto libre de la UI a tags en inglés, sin duplicados.
 * Separa por coma, trim, minúsculas y sin acentos; "maní" → "peanut".
 * Desconocidos: slug ASCII ("Frutilla" → "frutilla"); vacíos se descartan.
 */
export function parseAllergyTags(raw: string): string[] {
  const tags: string[] = [];

  for (const piece of raw.split(",")) {
    const key = stripAccents(piece).toLowerCase().trim().replace(/\s+/g, " ");
    if (!key) continue;

    const tag = ALLERGY_TO_TAG[key] ?? toAsciiSlug(piece);
    if (!tag || tags.includes(tag)) continue;

    tags.push(tag);
  }

  return tags;
}

/**
 * Tag → etiqueta visible: peanut → "Maní", lactose → "Lactosa", …
 * Desconocido: slug en mayúsculas ("kiwi" → "KIWI").
 */
export function allergyTagLabel(tag: string): string {
  const key = stripAccents(tag).toLowerCase().trim();
  const label = TAG_TO_LABEL[key];
  if (label) return label;

  const slug = toAsciiSlug(tag);
  return (slug || tag).toUpperCase();
}

/**
 * "2025-02-01" → "feb 2025" (mismo formato que los mocks).
 */
export function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const monthIndex = Number(month) - 1;
  const monthLabel = MONTHS_SHORT[monthIndex];

  if (!year || !monthLabel) return isoDate;

  return `${monthLabel} ${year}`;
}

/**
 * Hash determinístico del UUID para elegir el avatar sin persistir cosmética.
 */
function avatarForId(id: string): (typeof AVATAR_ROTATION)[number] {
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return AVATAR_ROTATION[hash % AVATAR_ROTATION.length];
}

/**
 * Adapta una fila de `public.children` (con la sala embebida) al shape `Kid`
 * que ya consumen `KidCard`, `KidsList` y `KidProfile`.
 */
export function toKidView(row: ChildRow): Kid {
  const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
  const avatar = avatarForId(row.id);
  const name = row.full_name.trim();

  return {
    id: row.id,
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarBg: avatar.bg,
    avatarText: avatar.text,
    birthdate: row.birth_date,
    room: room?.name ?? "",
    entryDate: formatMonthYear(row.enrolled_at),
    allergies: row.allergy_tags.map(allergyTagLabel),
    notes: row.medical_notes?.trim() || undefined,
    parents: [],
  };
}

/**
 * Solo dígitos; inserta "/" tras el día y el mes. Máx. 10 caracteres.
 * "1203" → "12/03", "12032022" → "12/03/2022".
 */
export function maskBirthdate(raw: string): string {
  const digits = raw.replace(/\D+/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * "dd/mm/aaaa" → partes de la fecha, o null si el formato está incompleto
 * o la fecha no existe (31/02/2024, mes 13…). Incluye bisiestos.
 */
export function parseBirthdate(masked: string): ParsedBirthdate | null {
  const match = BIRTHDATE_PATTERN.exec(masked);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return null;
  // El día 0 del mes siguiente es el último día del mes actual.
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  return { day, month, year };
}

/**
 * Reglas del alta (se evalúan en este orden, por campo). Solo los tres
 * campos obligatorios generan error.
 */
export function validateAddKid(
  values: AddKidFormValues,
  today: Date,
): AddKidFieldErrors {
  const errors: AddKidFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Ingresá el nombre";
  }

  if (!values.birthdate) {
    errors.birthdate = "Ingresá la fecha de nacimiento";
  } else {
    const parsed = parseBirthdate(values.birthdate);
    if (!parsed) {
      errors.birthdate = "La fecha no es válida";
    } else {
      const date = new Date(parsed.year, parsed.month - 1, parsed.day);
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      if (date.getTime() > todayStart.getTime()) {
        errors.birthdate = "La fecha no puede ser futura";
      }
    }
  }

  if (!values.roomId) {
    errors.room = "Seleccioná una sala";
  }

  return errors;
}
