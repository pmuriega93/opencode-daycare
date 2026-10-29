"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { IconChevronRight } from "@/components/ui/Icons";
import { AgeDisplay } from "@/components/kids/AgeDisplay";
import type { Kid } from "@/lib/types/kids";
import { getParentCountLabel } from "@/lib/types/kids";

type KidCardProps = {
  kid: Kid;
};

export function KidCard({ kid }: KidCardProps) {
  const parentLabel = getParentCountLabel(kid.parents);

  // Determine flag to show
  const hasAllergy = kid.allergies.length > 0;
  const allParentsPending =
    kid.parents.length > 0 && kid.parents.every((p) => p.status === "pending");
  const noParents = kid.parents.length === 0;
  const showVincular = noParents || allParentsPending;

  return (
    <Link
      href={`/kids/${kid.id}`}
      className="group flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition-all hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <Avatar
        initial={kid.initial}
        bg={kid.avatarBg}
        textColor={kid.avatarText}
        size={48}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-fredoka text-[16px] font-semibold text-text">
          {kid.name}
        </div>
        <div className="text-[13px] text-muted-2">
          <AgeDisplay birthdate={kid.birthdate} /> años · {parentLabel}
        </div>
      </div>
      {hasAllergy ? (
        <span className="flex-none rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]">
          {kid.allergies[0].toUpperCase()}
        </span>
      ) : showVincular ? (
        <span className="flex-none rounded-full bg-[#F9D2DE] px-[9px] py-[5px] text-[11px] font-extrabold text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <IconChevronRight
          size={18}
          className="flex-none text-[#CBB89F]"
        />
      )}
    </Link>
  );
}
