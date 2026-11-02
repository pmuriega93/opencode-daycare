import type {
  AddKidFieldErrors,
  AddKidFormValues,
  Kid,
} from "./types/kids";

const BIRTHDATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const MONTHS_ES = [
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

export type ParsedBirthdate = { day: number; month: number; year: number };

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

  if (!values.room) {
    errors.room = "Seleccioná una sala";
  }

  return errors;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(base: string, existing: Kid[]): string {
  const taken = new Set(existing.map((kid) => kid.id));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

/**
 * Construye el Kid en memoria a partir de un form ya validado.
 * Solo se llama si validateAddKid devolvió {}.
 */
export function buildKid(
  values: AddKidFormValues,
  existing: Kid[],
  today: Date,
): Kid {
  const parsed = parseBirthdate(values.birthdate);
  if (!parsed) {
    throw new Error("buildKid: la fecha de nacimiento no es válida");
  }

  const name = values.name.trim();
  const avatar = AVATAR_ROTATION[existing.length % AVATAR_ROTATION.length];

  return {
    id: uniqueId(slugify(name) || "nino", existing),
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarBg: avatar.bg,
    avatarText: avatar.text,
    birthdate: `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(
      parsed.day,
    ).padStart(2, "0")}`,
    room: values.room,
    entryDate: `${MONTHS_ES[today.getMonth()]} ${today.getFullYear()}`,
    allergies: values.allergies
      .split(",")
      .map((allergy) => allergy.trim().toLowerCase())
      .filter((allergy) => allergy.length > 0),
    notes: values.notes.trim() || undefined,
    parents: [],
  };
}
