"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { addChild } from "@/lib/kids-actions";
import { maskBirthdate, validateAddKid } from "@/lib/kids";
import type {
  AddKidFieldErrors,
  AddKidFormValues,
  Room,
} from "@/lib/types/kids";

type AddKidDialogProps = {
  open: boolean;
  rooms: Room[];
  onClose: () => void;
  onAdded: () => void;
};

const EMPTY_VALUES: AddKidFormValues = {
  name: "",
  birthdate: "",
  roomId: "",
  allergies: "",
  notes: "",
};

function errorFieldFor(
  field: keyof AddKidFormValues,
): keyof AddKidFieldErrors | null {
  if (field === "name" || field === "birthdate") return field;
  if (field === "roomId") return "room";
  return null;
}

export function AddKidDialog({
  open,
  rooms,
  onClose,
  onAdded,
}: AddKidDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Agregar niño">
      {/* Remontar el form en cada apertura resetea values y errors. */}
      {open && (
        <AddKidForm rooms={rooms} onClose={onClose} onAdded={onAdded} />
      )}
    </Modal>
  );
}

type AddKidFormProps = {
  rooms: Room[];
  onClose: () => void;
  onAdded: () => void;
};

function AddKidForm({ rooms, onClose, onAdded }: AddKidFormProps) {
  const [values, setValues] = useState<AddKidFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<AddKidFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setField = (field: keyof AddKidFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Editar un campo con error limpia el error de ese campo.
    setErrors((prev) => {
      const errorField = errorFieldFor(field);
      if (!errorField || prev[errorField] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[errorField];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    const nextErrors = validateAddKid(values, new Date());
    if (nextErrors.name || nextErrors.birthdate || nextErrors.room) {
      setErrors(nextErrors);
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const result = await addChild(values);

      if (result.status === "success") {
        onAdded();
        return;
      }

      setErrors(result.errors);
      setFormError(result.formError ?? null);
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-[20px]">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="text-[15px] font-bold text-muted disabled:opacity-50"
        >
          Cancelar
        </button>
        <span className="font-fredoka text-[18px] font-semibold text-text">
          Agregar niño
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="text-[15px] font-extrabold text-accent disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <div className="px-[26px] py-6">
        {formError && (
          <div
            role="alert"
            className="mb-[18px] rounded-[14px] bg-[#FBDAD6] px-4 py-3 text-[13.5px] font-bold text-[#C5413A]"
          >
            {formError}
          </div>
        )}
        <FormField
          label="NOMBRE COMPLETO"
          placeholder="Ej. Martina López"
          value={values.name}
          onChange={(value) => setField("name", value)}
          error={errors.name}
          autoFocus
          className="mb-[18px]"
        />
        <div className="mb-[18px] flex flex-col gap-[18px] sm:flex-row sm:gap-[14px]">
          <FormField
            label="FECHA DE NACIMIENTO"
            placeholder="dd/mm/aaaa"
            value={values.birthdate}
            onChange={(value) => setField("birthdate", maskBirthdate(value))}
            error={errors.birthdate}
            className="sm:flex-1"
          />
          <SelectField
            label="SALA"
            placeholder="Seleccioná una sala"
            options={rooms.map((room) => ({ value: room.id, label: room.name }))}
            value={values.roomId}
            onChange={(value) => setField("roomId", value)}
            error={errors.room}
            className="sm:flex-1"
          />
        </div>
        <FormField
          label="ALERGIAS (ETIQUETAS)"
          placeholder="Ej. Maní, Lactosa"
          value={values.allergies}
          onChange={(value) => setField("allergies", value)}
          className="mb-[18px]"
        />
        <FormField
          label="NOTAS MÉDICAS"
          placeholder="Indicaciones, medicación, contactos…"
          textarea
          value={values.notes}
          onChange={(value) => setField("notes", value)}
        />
      </div>
    </form>
  );
}
