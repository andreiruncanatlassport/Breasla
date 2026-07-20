"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Export PDF prin dialogul de tiparire al browserului.
 *
 * De ce asa si nu cu o bibliotecă de PDF: fonturile din bibliotecile JS de PDF
 * nu contin diacriticele romanesti (ș, ț, ă, î, â) fara sa incorporam manual
 * un font — iar rezultatul iese cu caractere lipsa exact in numele firmelor.
 * Tiparirea din browser foloseste fonturile paginii, deci diacriticele ies
 * perfect, iar utilizatorul alege "Salvează ca PDF" din dialogul standard.
 */
export function PrintButton() {
  return (
    <Button variant="seal" size="sm" onClick={() => window.print()}>
      <Download className="h-3.5 w-3.5" /> Descarcă PDF
    </Button>
  );
}
