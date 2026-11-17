"use server";

import { revalidatePath } from "next/cache";
import {
  parseAllergyTags,
  parseBirthdate,
  validateAddKid,
} from "@/lib/kids";
import { getRooms } from "@/lib/kids-server";
import { createClient } from "@/utils/supabase/server";
import type { AddKidFieldErrors, AddKidFormValues } from "@/lib/types/kids";

export type AddChildResult =
  | { status: "success" }
  | { status: "error"; errors: AddKidFieldErrors; formError?: string };

/**
 * Alta real de un niño en `public.children`. No confía en la validación del
 * cliente: repite las reglas y verifica que la sala exista antes de insertar
 * (RLS es la última frontera para la guardería).
 */
export async function addChild(
  values: AddKidFormValues,
): Promise<AddChildResult> {
  const errors = validateAddKid(values, new Date());

  if (errors.name || errors.birthdate || errors.room) {
    return { status: "error", errors };
  }

  const parsed = parseBirthdate(values.birthdate);
  if (!parsed) {
    return { status: "error", errors: { birthdate: "La fecha no es válida" } };
  }

  const rooms = await getRooms();
  if (!rooms.some((room) => room.id === values.roomId)) {
    return { status: "error", errors: { room: "Seleccioná una sala" } };
  }

  const birthDate = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-${String(
    parsed.day,
  ).padStart(2, "0")}`;

  const supabase = await createClient();
  const { error } = await supabase.from("children").insert({
    room_id: values.roomId,
    full_name: values.name.trim(),
    birth_date: birthDate,
    allergy_tags: parseAllergyTags(values.allergies),
    medical_notes: values.notes.trim() || null,
  });

  if (error) {
    return {
      status: "error",
      errors: {},
      formError: "No pudimos guardar el niño. Intentá de nuevo.",
    };
  }

  revalidatePath("/kids");

  return { status: "success" };
}
