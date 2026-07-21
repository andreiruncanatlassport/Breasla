/**
 * Regiunile istorice ale Romaniei, cu codurile de judet aferente.
 * Folosite ca sa poti selecta rapid o zona intreaga ("Transilvania",
 * "Moldova" etc.) la zona deservita — cerinta directa din testare:
 * "poate o categorie pe regiune ale tarii, Transilvania, centru".
 */
export interface Regiune {
  nume: string;
  judete: string[];
}

export const REGIUNI: Regiune[] = [
  { nume: "Transilvania", judete: ["AB", "BN", "BV", "CJ", "CV", "HR", "HD", "MS", "SB"] },
  { nume: "Banat", judete: ["TM", "CS", "AR"] },
  { nume: "Crișana", judete: ["BH", "SM", "SJ"] },
  { nume: "Maramureș", judete: ["MM"] },
  { nume: "Moldova", judete: ["BC", "BT", "GL", "IS", "NT", "SV", "VS", "VN"] },
  { nume: "Muntenia", judete: ["AG", "CL", "DB", "GR", "IL", "PH", "TR", "B", "IF"] },
  { nume: "Oltenia", judete: ["DJ", "GJ", "MH", "OT", "VL"] },
  { nume: "Dobrogea", judete: ["CT", "TL"] },
  { nume: "Muntenia de Est", judete: ["BR", "BZ"] },
];
