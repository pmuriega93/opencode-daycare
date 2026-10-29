"use client";

import { useSyncExternalStore } from "react";
import { calculateAge } from "@/lib/types/kids";

function subscribe() {
  return () => {};
}

// Cache the timestamp so getSnapshot returns a stable reference
// across calls within the same client session (age only changes once/year).
let cachedNow: number | undefined;
function getNow() {
  return (cachedNow ??= Date.now());
}

// Fixed reference for SSR/prerender — returns a stable timestamp.
function getServerNow() {
  return new Date("2026-10-28T00:00:00").getTime();
}

type AgeDisplayProps = {
  birthdate: string;
  className?: string;
};

export function AgeDisplay({ birthdate, className = "" }: AgeDisplayProps) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);
  const age = calculateAge(birthdate, new Date(now));
  return <span className={className}>{age}</span>;
}
