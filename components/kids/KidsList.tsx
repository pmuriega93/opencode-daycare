"use client";

import { useState } from "react";
import { KidCard } from "@/components/kids/KidCard";
import type { Kid } from "@/lib/types/kids";

type KidsListProps = {
  kids: Kid[];
};

export function KidsList({ kids }: KidsListProps) {
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();
  const filteredKids = trimmedQuery
    ? kids.filter((k) => {
        const firstName = k.name.split(" ")[0];
        return firstName.includes(trimmedQuery);
      })
    : kids;

  return (
    <>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Buscar niño…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-none bg-transparent text-[15px] text-text outline-none placeholder:text-[#B6A99B]"
        />
      </div>

      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-text">
          SALA SOLES
        </span>
        <span className="text-[13px] text-muted-2">
          {filteredKids.length} {filteredKids.length === 1 ? "niño" : "niños"}
        </span>
        <span className="h-px flex-1 bg-line-div" />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {filteredKids.map((kid) => (
          <KidCard key={kid.id} kid={kid} />
        ))}
      </div>

      {filteredKids.length === 0 && (
        <div className="py-12 text-center text-[15px] text-muted-2">
          No se encontraron niños para &quot;{query}&quot;
        </div>
      )}
    </>
  );
}
