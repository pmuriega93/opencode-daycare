import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { toKidView } from "@/lib/kids";
import type { ChildRow, Kid, Room } from "@/lib/types/kids";

/**
 * Salas de la guardería del usuario, ordenadas por nombre.
 * RLS filtra por `daycare_id` y rol staff/admin.
 *
 * `cache()` deduplica la lectura entre Server Components del mismo request.
 */
export const getRooms = cache(async (): Promise<Room[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name")
    .order("name")
    .returns<Room[]>();

  if (error || !data) return [];

  return data;
});

/**
 * Niños activos de la guardería, con su sala embebida, ordenados por nombre.
 */
export const getKids = cache(async (): Promise<Kid[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status, rooms(id, name)",
    )
    .eq("status", "active")
    .order("full_name")
    .returns<ChildRow[]>();

  if (error || !data) return [];

  return data.map(toKidView);
});

/**
 * Un niño activo por UUID. Un id que no es UUID (p. ej. un slug viejo) hace
 * que Postgres devuelva 22P02: se trata como "no encontrado".
 */
export const getKid = cache(async (id: string): Promise<Kid | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status, rooms(id, name)",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle<ChildRow>();

  if (error || !data) return null;

  return toKidView(data);
});
