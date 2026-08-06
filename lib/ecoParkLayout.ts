/**
 * Real-world geography for Eco Park (New Town, Kolkata), digitized by hand
 * from HIDCO's published master plan, cross-checked against public facts
 * (480-acre park, ~104-acre / 42-hectare artificial lake with an island,
 * inaugurated as "Prakriti Tirtha"). Coordinates are normalized (0–1, x
 * left→right, y top→bottom, matching the plan's own orientation) — traced
 * by eye off a scanned drawing, so treat this as a faithful approximation,
 * not survey-grade precision. Used only by the 3D replica view/export;
 * the 2D schematic map and editor use their own decluttered layout.
 */

export const ECO_PARK_POSITIONS: Record<string, { x: number; y: number }> = {
  entrance: { x: 0.86, y: 0.3 },
  visitorcenter: { x: 0.76, y: 0.28 },
  toilet1: { x: 0.89, y: 0.28 },
  sevenwonders: { x: 0.67, y: 0.19 },
  childrenpark: { x: 0.74, y: 0.32 },
  foodcourt: { x: 0.66, y: 0.25 },
  butterflygarden: { x: 0.65, y: 0.32 },
  helliconiagarden: { x: 0.62, y: 0.34 },
  aviary: { x: 0.71, y: 0.37 },
  snowtheme: { x: 0.7, y: 0.29 },
  deerpark: { x: 0.6, y: 0.16 },
  amphitheater: { x: 0.62, y: 0.23 },
  sculpturegarden: { x: 0.68, y: 0.35 },
  rosegarden: { x: 0.61, y: 0.49 },
  fruitgarden: { x: 0.6, y: 0.47 },
  bamboogarden: { x: 0.58, y: 0.43 },
  musicalfountain: { x: 0.71, y: 0.52 },
  ecoisland: { x: 0.39, y: 0.54 },
  toytrain: { x: 0.68, y: 0.6 },
  wildflowermeadow: { x: 0.66, y: 0.57 },
  rabiaranya: { x: 0.44, y: 0.71 },
  japaneseforest: { x: 0.36, y: 0.73 },
  ecoresort: { x: 0.27, y: 0.72 },
  eiffeltower: { x: 0.11, y: 0.7 },
  iceskating: { x: 0.47, y: 0.8 },
  ticketcounter: { x: 0.47, y: 0.82 },
  toilet2: { x: 0.19, y: 0.72 },
};

/** The lake — the park's dominant feature at ~104 of the park's 480 acres. */
export const ECO_PARK_LAKE: Array<[number, number]> = [
  [0.3, 0.43],
  [0.44, 0.41],
  [0.56, 0.43],
  [0.65, 0.48],
  [0.67, 0.56],
  [0.62, 0.64],
  [0.54, 0.7],
  [0.42, 0.72],
  [0.31, 0.69],
  [0.26, 0.61],
  [0.25, 0.51],
  [0.27, 0.46],
];

/** The small island in the middle of the lake (Eco-Island / Cafe Ekante). */
export const ECO_PARK_ISLAND: Array<[number, number]> = [
  [0.365, 0.515],
  [0.415, 0.505],
  [0.43, 0.53],
  [0.42, 0.56],
  [0.38, 0.565],
  [0.36, 0.545],
];

/** The big grassland/forest zone in the park's north-west corner (Deer Park side). */
export const ECO_PARK_GREEN_ZONE: Array<[number, number]> = [
  [0.18, 0.09],
  [0.42, 0.08],
  [0.5, 0.14],
  [0.5, 0.28],
  [0.44, 0.38],
  [0.3, 0.42],
  [0.2, 0.35],
  [0.16, 0.2],
];
