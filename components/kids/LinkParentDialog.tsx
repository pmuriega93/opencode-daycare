"use client";

import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { IconClose } from "@/components/ui/Icons";
import {
  buildParent,
  generateInvitationCode,
  PARENT_ROLES,
  validateLinkParent,
} from "@/lib/parents";
import type {
  LinkParentFieldErrors,
  LinkParentFormValues,
  Parent,
  ParentRole,
} from "@/lib/types/kids";

type LinkParentDialogProps = {
  open: boolean;
  kidName: string;
  parents: Parent[];
  onClose: () => void;
  onAdd: (parent: Parent) => void;
};

export function LinkParentDialog({
  open,
  kidName,
  parents,
  onClose,
  onAdd,
}: LinkParentDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Vincular padre" size="sm">
      {/* Remontar el form en cada apertura resetea values/errors y el código. */}
      {open && (
        <LinkParentForm
          kidName={kidName}
          parents={parents}
          onClose={onClose}
          onAdd={onAdd}
        />
      )}
    </Modal>
  );
}

type LinkParentFormProps = {
  kidName: string;
  parents: Parent[];
  onClose: () => void;
  onAdd: (parent: Parent) => void;
};

function LinkParentForm({
  kidName,
  parents,
  onClose,
  onAdd,
}: LinkParentFormProps) {
  const [values, setValues] = useState<LinkParentFormValues>({
    name: "",
    email: "",
    role: "Mamá",
  });
  const [errors, setErrors] = useState<LinkParentFieldErrors>({});
  const [code] = useState(generateInvitationCode);

  const setField = (field: keyof LinkParentFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Editar un campo con error limpia el error de ese campo.
    setErrors((prev) => {
      if (prev[field] === undefined) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setRole = (role: ParentRole) => {
    setValues((prev) => ({ ...prev, role }));
    setErrors((prev) => {
      if (prev.role === undefined) return prev;
      const next = { ...prev };
      delete next.role;
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLinkParent(values, parents);
    if (nextErrors.name || nextErrors.email || nextErrors.role) {
      setErrors(nextErrors);
      return;
    }
    onAdd(buildParent(values, parents));
    onClose();
  };

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-[26px] py-5">
        <div>
          <div className="font-fredoka text-[18px] font-semibold text-text">
            Vincular padre
          </div>
          <div className="text-[13px] text-muted-2">a {kidName}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
        >
          <IconClose size={18} strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-[26px] py-[22px]">
        <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4E72C8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="mt-px flex-none"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
            Le enviaremos un correo con un código para que active su cuenta. Solo
            verá el feed de {kidName}.
          </span>
        </div>

        <FormField
          label="NOMBRE DEL PADRE/MADRE"
          placeholder="Ej. Diego Fernández"
          value={values.name}
          onChange={(value) => setField("name", value)}
          error={errors.name}
          autoFocus
          className="mb-[18px]"
        />
        <FormField
          label="EMAIL"
          type="email"
          placeholder="correo@ejemplo.com"
          value={values.email}
          onChange={(value) => setField("email", value)}
          error={errors.email}
          className="mb-[18px]"
        />

        <div className="mb-5">
          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-muted">
            PARENTESCO
          </div>
          <div className="flex gap-[9px]">
            {PARENT_ROLES.map((role) => {
              const selected = values.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRole(role)}
                  aria-pressed={selected}
                  className={`flex-1 rounded-full border-[1.5px] px-2 py-[11px] text-[14px] font-extrabold ${
                    selected
                      ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                      : "border-line bg-surface text-text-3"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
          {errors.role && (
            <span className="mt-1.5 block text-[12.5px] font-bold text-accent">
              {errors.role}
            </span>
          )}
        </div>

        <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center">
          <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
            CÓDIGO DE INVITACIÓN
          </div>
          <div className="font-fredoka text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
            {code}
          </div>
          <div className="mt-1.5 text-[13px] text-[#A88526]">
            Vence en 7 días
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-button-from to-button-to p-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </svg>
          Enviar invitación
        </button>
      </div>
    </form>
  );
}
