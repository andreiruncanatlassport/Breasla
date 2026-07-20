"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ShieldCheck, PenLine, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReviewForm } from "@/components/ReviewForm";

export type MotivBlocare =
  | "poate"
  | "neautentificat"
  | "fara_firma"
  | "firma_neverificata"
  | "propria_firma"
  | "deja_recenzat";

interface Recenzie {
  id: string;
  rating: number;
  comentariu: string | null;
  created_at: string;
  reviewer: { id: string; denumire: string; slug?: string | null } | null;
}

interface Props {
  reviewedCompanyId: string;
  reviewerCompanyId: string | null;
  recenzii: Recenzie[];
  ratingMediu: number;
  ratingNumar: number;
  motiv: MotivBlocare;
}

/** Explica in cuvinte simple de ce nu poti lasa o recenzie acum. */
function mesajBlocare(motiv: MotivBlocare): { text: string; actiune?: { href: string; eticheta: string } } | null {
  switch (motiv) {
    case "neautentificat":
      return {
        text: "Doar firmele verificate din Rețeaua Antreprenorilor Creștini pot lăsa recenzii.",
        actiune: { href: "/login", eticheta: "Autentifică-te" },
      };
    case "fara_firma":
      return {
        text: "Ca să lași o recenzie, trebuie să ai o firmă înregistrată în Rețeaua Antreprenorilor Creștini.",
        actiune: { href: "/inregistrare", eticheta: "Înregistrează-ți firma" },
      };
    case "firma_neverificata":
      return { text: "Firma ta trebuie să fie verificată înainte de a putea lăsa recenzii." };
    case "propria_firma":
      return { text: "Nu poți lăsa o recenzie propriei firme." };
    case "deja_recenzat":
      return { text: "Ai lăsat deja o recenzie acestei firme." };
    default:
      return null;
  }
}

export function ReviewSection({
  reviewedCompanyId,
  reviewerCompanyId,
  recenzii,
  ratingMediu,
  ratingNumar,
  motiv,
}: Props) {
  const [formularDeschis, setFormularDeschis] = useState(false);
  const blocare = mesajBlocare(motiv);

  // Distributia notelor, pentru bara de sumar
  const distributie = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    numar: recenzii.filter((r) => r.rating === nota).length,
  }));

  return (
    <div className="space-y-4">
      {/* Sumar rating + explicatia procesului — mereu vizibile */}
      <Card variant="raised">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="text-center sm:w-40 sm:shrink-0">
            <p className="font-mono-num text-4xl font-bold text-ink">
              {ratingNumar > 0 ? ratingMediu.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(ratingMediu) && ratingNumar > 0
                      ? "fill-seal text-seal"
                      : "text-ink/20"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {ratingNumar === 0
                ? "nicio recenzie încă"
                : `${ratingNumar} ${ratingNumar === 1 ? "recenzie" : "recenzii"}`}
            </p>
          </div>

          {ratingNumar > 0 && (
            <div className="flex-1 space-y-1.5">
              {distributie.map((d) => (
                <div key={d.nota} className="flex items-center gap-2">
                  <span className="font-mono-num w-3 text-xs text-ink-soft">{d.nota}</span>
                  <Star className="h-3 w-3 fill-ink-soft/40 text-ink-soft/40" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                    <div
                      className="h-full gradient-seal"
                      style={{ width: ratingNumar ? `${(d.numar / ratingNumar) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="font-mono-num w-6 text-right text-xs text-ink-soft">
                    {d.numar}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cum functioneaza — raspunde direct la "de unde apar recenziile?" */}
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-teal/8 p-3.5 text-xs leading-relaxed text-ink-soft ring-1 ring-inset ring-teal/20">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <p>
            <strong className="text-ink">Recenzii verificate.</strong> Pot fi lăsate doar de firme
            verificate din Rețeaua Antreprenorilor Creștini, care încarcă o dovadă a colaborării (contract, comandă,
            corespondență). Dovada e văzută doar de administratori, iar recenzia se publică abia
            după aprobare — de aceea nu poate fi cumpărată sau falsificată.
          </p>
        </div>
      </Card>

      {/* Actiune: formular sau explicatia motivului pentru care nu poti */}
      {motiv === "poate" && reviewerCompanyId ? (
        formularDeschis ? (
          <ReviewForm reviewedCompanyId={reviewedCompanyId} reviewerCompanyId={reviewerCompanyId} />
        ) : (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <PenLine className="h-4 w-4 text-seal" />
              <p className="text-sm text-ink-soft">
                Ai colaborat cu această firmă? Împărtășește experiența ta.
              </p>
            </div>
            <Button size="sm" variant="seal" onClick={() => setFormularDeschis(true)}>
              Lasă o recenzie
            </Button>
          </Card>
        )
      ) : blocare ? (
        <Card variant="inset" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-ink-soft/60" />
            <p className="text-sm text-ink-soft">{blocare.text}</p>
          </div>
          {blocare.actiune && (
            <Link
              href={blocare.actiune.href}
              className="text-sm font-semibold text-seal hover:underline"
            >
              {blocare.actiune.eticheta} →
            </Link>
          )}
        </Card>
      ) : null}

      {/* Lista de recenzii */}
      {recenzii.length > 0 ? (
        <div className="space-y-3">
          {recenzii.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r.rating ? "fill-seal text-seal" : "text-ink/20"}`}
                      />
                    ))}
                  </div>
                  <Link
                    href={`/firma/${r.reviewer?.slug ?? r.reviewer?.id}`}
                    className="text-sm font-semibold text-ink hover:text-seal"
                  >
                    {r.reviewer?.denumire}
                  </Link>
                </div>
                <span className="font-mono-num text-xs text-ink-soft/70">
                  {new Date(r.created_at).toLocaleDateString("ro-RO")}
                </span>
              </div>
              {r.comentariu && (
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{r.comentariu}</p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-ink-soft">
          Nicio recenzie publicată încă. Fii primul care împărtășește o colaborare.
        </p>
      )}
    </div>
  );
}
