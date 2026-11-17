export type ParentStatus = "active" | "pending";

export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export type Parent = {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  role: string; // "Mamá" | "Papá" | "Tutor/a"
  status: ParentStatus;
  email?: string; // opcional: los mocks de padres no lo tienen
};

export type Kid = {
  id: string; // uuid de public.children
  name: string;
  initial: string;
  avatarBg: string;
  avatarText: string;
  birthdate: string; // "2022-03-12"
  room: string; // "Soles"
  entryDate: string; // "feb 2025"
  allergies: string[]; // ["maní"]
  notes?: string; // free-text health notes
  parents: Parent[];
};

export type ChildStatus = "active" | "archived";

/** Fila de `public.rooms` tal como la devuelve la query. */
export type RoomRow = { id: string; name: string };

/** Fila de `public.children` con la sala embebida (`rooms(...)`). */
export type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string; // "2022-03-12"
  enrolled_at: string; // "2025-02-01"
  medical_notes: string | null;
  allergy_tags: string[]; // ["peanut"]
  status: ChildStatus;
  rooms: { id: string; name: string } | { id: string; name: string }[] | null;
};

/** Forma de sala que consume la UI. */
export type Room = { id: string; name: string };

/** Datos normalizados para insertar en `public.children`. */
export type NewChildInput = {
  fullName: string;
  birthDate: string; // "YYYY-MM-DD"
  roomId: string;
  allergyTags: string[]; // ["peanut"]
  medicalNotes: string | null;
};

/**
 * Calculate age in years from a birthdate string (YYYY-MM-DD).
 * @param birthdate - Birth date in YYYY-MM-DD format
 * @param referenceDate - Reference date for the calculation
 */
export function calculateAge(birthdate: string, referenceDate: Date): number {
  const today = referenceDate;
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Format a birthdate string to display format: "12 mar 2022"
 */
export function formatBirthdate(birthdate: string): string {
  const months = [
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
  ];
  const d = new Date(birthdate + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Get parent count label for display
 */
export function getParentCountLabel(parents: Parent[]): string {
  if (parents.length === 0) return "sin padres vinculados";
  if (parents.length === 1) return "1 padre vinculado";
  return `${parents.length} padres vinculados`;
}

export type AddKidFormValues = {
  name: string; // "Martina López"
  birthdate: string; // valor con máscara: "12/03/2022"
  roomId: string; // uuid de la sala ("" cuando no se eligió)
  allergies: string; // texto libre: "Maní, Lactosa"
  notes: string; // texto libre
};

export type AddKidFieldErrors = Partial<
  Record<"name" | "birthdate" | "room", string>
>;

export type LinkParentFormValues = {
  name: string; // "Diego Fernández"
  email: string; // "diego.fernandez@example.com"
  role: ParentRole; // "Mamá" | "Papá" | "Tutor/a"
};

export type LinkParentFieldErrors = Partial<
  Record<"name" | "email" | "role", string>
>;
