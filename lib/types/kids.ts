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
  id: string; // slug: "mateo-fernandez"
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
  room: string; // "" | "Soles" | "Lunas" | "Estrellas"
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
