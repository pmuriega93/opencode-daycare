"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconChevronLeft, IconSun } from "@/components/ui/Icons";
import { ParentRow } from "@/components/kids/ParentRow";
import { AgeDisplay } from "@/components/kids/AgeDisplay";
import type { Kid } from "@/lib/types/kids";
import { formatBirthdate } from "@/lib/types/kids";

type KidProfileProps = {
  kid: Kid;
};

export function KidProfile({ kid }: KidProfileProps) {
  const birthdateFormatted = formatBirthdate(kid.birthdate);
  const hasAllergyInfo =
    kid.allergies.length > 0 || (kid.notes && kid.notes.length > 0);

  return (
    <>
      {/* Back link */}
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-muted"
      >
        <IconChevronLeft size={18} />
        Volver a Niños
      </Link>

      <div className="flex flex-wrap gap-[26px]">
        {/* Main column */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          {/* Header */}
          <div className="flex items-center gap-[18px]">
            <Avatar
              initial={kid.initial}
              bg={kid.avatarBg}
              textColor={kid.avatarText}
              size={84}
            />
            <div className="flex-1">
              <h1 className="m-0 font-fredoka text-[28px] font-semibold text-text">
                {kid.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-muted">
                <AgeDisplay birthdate={kid.birthdate} /> años · Sala {kid.room}
              </p>
            </div>
            <Link
              href={`/kids/${kid.id}/editar`}
              className="rounded-[12px] border-[1.5px] border-line bg-surface px-4 py-[9px] text-[14px] font-bold text-text-3"
            >
              Editar
            </Link>
          </div>

          {/* Allergy / notes alert */}
          {hasAllergyInfo && (
            <div className="flex gap-3.5 rounded-[16px] bg-[#FBDAD6] p-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                <IconAlertTriangle size={22} className="text-white" />
              </div>
              <div>
                <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                <div className="text-[14.5px] leading-relaxed text-[#B25249]">
                  {kid.notes ??
                    `Alergia a ${kid.allergies.join(", ")}.`}
                </div>
              </div>
            </div>
          )}

          {/* Info table */}
          <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
            <div className="flex justify-between border-b border-line-soft px-[18px] py-[15px]">
              <span className="text-[14.5px] text-muted">
                Fecha de nacimiento
              </span>
              <span className="text-[14.5px] font-extrabold text-text">
                {birthdateFormatted}
              </span>
            </div>
            <div className="flex justify-between border-b border-line-soft px-[18px] py-[15px]">
              <span className="text-[14.5px] text-muted">Sala</span>
              <span className="text-[14.5px] font-extrabold text-text">
                {kid.room}
              </span>
            </div>
            <div className="flex justify-between px-[18px] py-[15px]">
              <span className="text-[14.5px] text-muted">Ingreso</span>
              <span className="text-[14.5px] font-extrabold text-text">
                {kid.entryDate}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="flex w-[300px] flex-none flex-col gap-3.5">
          <Button href="/resumen-dia" className="w-full !justify-center !gap-[9px] !bg-[#3F362E] !text-white !shadow-none">
            <IconSun size={18} className="text-white" />
            Resumen del día
          </Button>

          <div className="rounded-[16px] border border-line bg-surface px-[18px] py-4">
            <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
              PADRES VINCULADOS
            </div>
            <div className="flex flex-col gap-3.5">
              {kid.parents.map((parent) => (
                <ParentRow key={parent.id} parent={parent} />
              ))}
              <Link
                href="/vincular-padre"
                className="flex items-center gap-3 pt-2"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-[14.5px] font-extrabold text-accent-2">
                  Vincular otro padre
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
