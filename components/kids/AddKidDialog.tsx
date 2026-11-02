"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { salas } from "@/lib/mocks/kids";
import { buildKid, maskBirthdate, validateAddKid } from "@/lib/kids";
import type {
  AddKidFieldErrors,
  AddKidFormValues,
  Kid,
} from "@/lib/types/kids";

type AddKidDialogProps = {
  open: boolean;
  kids: Kid[];
  onClose: () => void;
  onAdd: (kid: Kid) => void;
};

const EMPTY_VALUES: AddKidFormValues = {
  name: "",
  birthdate: "",
  room: "",
  allergies: "",
  notes: "",
};

function isValidationErrorField(
  field: keyof AddKidFormValues,
): field is keyof AddKidFieldErrors {
  return field === "name" || field === "birthdate" || field === "room";
}

export function AddKidDialog({
  open,
  kids,
  onClose,
  onAdd,
}: AddKidDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Agregar niño">
      {/* Remontar el form en cada apertura resetea values y errors. */}
      {open && <AddKidForm kids={kids} onClose={onClose} onAdd={onAdd} />}
    </Modal>
  );
}

type AddKidFormProps = {
  kids: Kid[];
  onClose: () => void;
  onAdd: (kid: Kid) => void;
};

function AddKidForm({ kids, onClose, onAdd }: AddKidFormProps) {
  const [values, setValues] = useState<AddKidFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<AddKidFieldErrors>({});

  const setField = (field: keyof AddKidFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Editar un campo con error limpia el error de ese campo.
    setErrors((prev) => {
      if (!isValidationErrorField(field) || prev[field] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const today = new Date();
    const nextErrors = validateAddKid(values, today);
    if (nextErrors.name || nextErrors.birthdate || nextErrors.room) {
      setErrors(nextErrors);
      return;
    }
    onAdd(buildKid(values, kids, today));
    onClose();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-[20px]">
        <button
          type="button"
          onClick={onClose}
          className="text-[15px] font-bold text-muted"
        >
          Cancelar
        </button>
        <span className="font-fredoka text-[18px] font-semibold text-text">
          Agregar niño
        </span>
        <button type="submit" className="text-[15px] font-extrabold text-accent">
          Guardar
        </button>
      </div>
      <div className="px-[26px] py-6">
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
            options={salas}
            value={values.room}
            onChange={(value) => setField("room", value)}
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
