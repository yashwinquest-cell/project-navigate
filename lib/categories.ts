import type { Category } from "./venue";

export const CATEGORY_META: Record<Category, { colorVar: string; label: string }> = {
  entrance: { colorVar: "--ink-soft", label: "Entrance" },
  ticket: { colorVar: "--accent", label: "Tickets" },
  exit: { colorVar: "--safety", label: "Emergency exit" },
  food: { colorVar: "--amber", label: "Food & dining" },
  shop: { colorVar: "--route", label: "Shopping" },
  restroom: { colorVar: "--ink-faint", label: "Restroom" },
  entertainment: { colorVar: "--route", label: "Entertainment" },
};

export const POI_CODES: Record<string, string> = {
  entrance: "EN",
  ticket: "TK",
  exitA: "EA",
  exitB: "EB",
  foodcourt: "FC",
  toystore: "TY",
  electronics: "EL",
  restrooms: "RR",
  cinema: "CN",
  kidszone: "KZ",
};

export const CATEGORY_OPTIONS: Category[] = [
  "entrance",
  "ticket",
  "exit",
  "food",
  "shop",
  "restroom",
  "entertainment",
];

/** Short 2-letter code for a pin. Falls back to the name's initials for POIs outside the fixed demo set. */
export function getPoiCode(poi: { id: string; name: string }): string {
  const known = POI_CODES[poi.id];
  if (known) return known;
  const letters = poi.name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return letters.slice(0, 2) || "??";
}
