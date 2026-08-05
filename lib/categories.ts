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
