import type {
  LinkParentFieldErrors,
  LinkParentFormValues,
  Parent,
  ParentRole,
} from "./types/kids";

export const PARENT_ROLES: readonly ParentRole[] = ["Mamá", "Papá", "Tutor/a"];

// 5 caracteres sin ambigüedades (sin 0/O, 1/I/L).
const INVITATION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const INVITATION_LENGTH = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rotación de la paleta de padres de los mocks.
const PARENT_AVATAR_ROTATION = [
  "#C9B6E8",
  "#A9C7E8",
  "#B9DEC4",
  "#F4DC8E",
  "#F4B8CC",
] as const;

/**
 * Código de invitación de 5 caracteres alfanuméricos, generado en cada
 * apertura del modal. No se persiste.
 */
export function generateInvitationCode(): string {
  let code = "";
  for (let index = 0; index < INVITATION_LENGTH; index++) {
    code += INVITATION_ALPHABET.charAt(
      Math.floor(Math.random() * INVITATION_ALPHABET.length),
    );
  }
  return code;
}

/**
 * Reglas del alta de un padre/madre (en este orden, por campo).
 */
export function validateLinkParent(
  values: LinkParentFormValues,
  existingParents: Parent[],
): LinkParentFieldErrors {
  const errors: LinkParentFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Ingresá el nombre";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Ingresá el email";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "El email no es válido";
  } else {
    const normalized = email.toLowerCase();
    const alreadyLinked = existingParents.some(
      (parent) => parent.email?.trim().toLowerCase() === normalized,
    );
    if (alreadyLinked) {
      errors.email = "Este email ya está vinculado";
    }
  }

  if (!values.role) {
    errors.role = "Seleccioná el parentesco";
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

function uniqueId(base: string, existing: Parent[]): string {
  const taken = new Set(existing.map((parent) => parent.id));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

/**
 * Construye el Parent en memoria a partir de un form ya validado.
 * Solo se llama si validateLinkParent devolvió {}.
 */
export function buildParent(
  values: LinkParentFormValues,
  existingParents: Parent[],
): Parent {
  const name = values.name.trim();

  return {
    id: uniqueId(`parent-${slugify(name) || "padre"}`, existingParents),
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarBg:
      PARENT_AVATAR_ROTATION[
        existingParents.length % PARENT_AVATAR_ROTATION.length
      ],
    role: values.role,
    status: "pending",
    email: values.email.trim().toLowerCase(),
  };
}
