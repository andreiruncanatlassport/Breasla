"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Clock, Loader2, History, FileText, Wallet, Calendar,
  ChevronDown, ChevronUp, PenLine, CheckCheck, XCircle,
} from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { TermsEditor } from "./TermsEditor";
import type { Deal, DealVersion } from "@/types/database";

interface Props {
  deal: Deal;
  versiuni: DealVersion[];
  firmaMeaId: string;
  numeFirme: Record<string, string>;
  categoryId: string | null;
}

function formatSuma(v: number | null | undefined, moneda: string) {
  if (v == null) return "—";
  return `${v.toLocaleString("ro-RO")} ${moneda}`;
}

function formatData(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("ro-RO") : "—";
}

/** Afiseaza termenii unei versiuni, complet. */
function TermeniVersiune({ v }: { v: DealVersion }) {
  return (
    <div className="space-y-4">
      {v.descriere_lucrare && (
        <div>
          <p className="stamp-label text-ink-soft">Lucrarea</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{v.descriere_lucrare}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="block-inset p-3">
          <p className="stamp-label text-ink-soft">Preț total</p>
          <p className="mt-1 font-mono-num text-lg font-bold text-ink">
            {formatSuma(v.pret_total, v.moneda)}
          </p>
        </div>
        <div className="block-inset p-3">
          <p className="stamp-label text-ink-soft">Perioadă</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {formatData(v.termen_start)} → {formatData(v.termen_final)}
          </p>
        </div>
        <div className="block-inset p-3">
          <p className="stamp-label text-ink-soft">Plată</p>
          <p className="mt-1 text-sm font-medium text-ink">{v.modalitate_plata || "—"}</p>
        </div>
      </div>

      {v.etape.length > 0 && (
        <div>
          <p className="stamp-label text-ink-soft">Etape</p>
          <div className="mt-2 space-y-2">
            {v.etape.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{e.titlu}</p>
                  {e.descriere && <p className="text-xs text-ink-soft">{e.descriere}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {e.suma != null && (
                    <p className="font-mono-num text-sm font-semibold text-ink">
                      {formatSuma(e.suma, v.moneda)}
                    </p>
                  )}
                  {e.termen && (
                    <p className="font-mono-num text-xs text-ink-soft">{formatData(e.termen)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.clauze.length > 0 && (
        <div>
          <p className="stamp-label text-ink-soft">Clauze ({v.clauze.length})</p>
          <div className="mt-2 space-y-2">
            {v.clauze.map((c, i) => (
              <div key={i} className="rounded-xl border border-line p-3.5">
                <p className="text-sm font-semibold text-ink">{c.titlu}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{c.continut}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DealTerms({ deal, versiuni, firmaMeaId, numeFirme, categoryId }: Props) {
  const router = useRouter();
  const [editorDeschis, setEditorDeschis] = useState(false);
  const [istoricDeschis, setIstoricDeschis] = useState(false);
  const [seIncarca, setSeIncarca] = useState(false);

  const ultima = versiuni[0] ?? null;
  const acceptata = versiuni.find((v) => v.id === deal.versiune_acceptata_id) ?? null;
  const activa = acceptata ?? ultima;

  const suntA = firmaMeaId === deal.company_a_id;
  const amFinalizat = suntA ? deal.finalizat_de_a_la : deal.finalizat_de_b_la;
  const celalaltAFinalizat = suntA ? deal.finalizat_de_b_la : deal.finalizat_de_a_la;

  const potAcceptaUltima =
    ultima && ultima.status === "propusa" && ultima.propus_de !== firmaMeaId && deal.status !== "finalizat";
  const inchisa = deal.status === "finalizat" || deal.status === "anulat";

  async function actiune(tip: "accepta" | "finalizeaza" | "anuleaza", extra?: Record<string, unknown>) {
    if (tip === "anuleaza" && !window.confirm("Sigur anulezi această înțelegere?")) return;
    setSeIncarca(true);
    try {
      await fetch(`/api/deals/${deal.id}/actiune`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actiune: tip, ...extra }),
      });
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  if (editorDeschis) {
    return (
      <TermsEditor
        dealId={deal.id}
        categoryId={categoryId}
        versiuneCurenta={activa}
        onAnuleaza={() => setEditorDeschis(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Termenii activi */}
      <Card variant="raised">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="stamp-label text-seal">
              {acceptata ? "Termeni acceptați" : ultima ? "Ultima propunere" : "Termeni"}
            </p>
            {activa && (
              <p className="mt-1 text-sm text-ink-soft">
                Versiunea {activa.numar} · propusă de{" "}
                <strong className="text-ink">{numeFirme[activa.propus_de] ?? "—"}</strong>
              </p>
            )}
          </div>
          {acceptata ? (
            <Badge tone="success"><Check className="h-3 w-3" /> Acceptată de ambele firme</Badge>
          ) : ultima?.status === "propusa" ? (
            <Badge tone="warning"><Clock className="h-3 w-3" /> Așteaptă răspuns</Badge>
          ) : null}
        </div>

        {activa ? (
          <div className="mt-5">
            <TermeniVersiune v={activa} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">
            Niciun termen propus încă. Propune tu prima variantă — poate fi modificată oricând.
          </p>
        )}

        {/* Acțiuni */}
        {!inchisa && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            {potAcceptaUltima && (
              <Button
                variant="seal"
                onClick={() => actiune("accepta", { versiune_id: ultima!.id })}
                disabled={seIncarca}
              >
                {seIncarca ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Accept termenii
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditorDeschis(true)} disabled={seIncarca}>
              <PenLine className="h-4 w-4" />
              {activa ? "Propune modificări" : "Propune termeni"}
            </Button>

            {deal.status === "acceptat" && !amFinalizat && (
              <Button variant="primary" onClick={() => actiune("finalizeaza")} disabled={seIncarca}>
                <CheckCheck className="h-4 w-4" /> Marchează finalizată
              </Button>
            )}

            <Button variant="ghost" onClick={() => actiune("anuleaza")} disabled={seIncarca} className="ml-auto">
              <XCircle className="h-4 w-4" /> Anulează
            </Button>
          </div>
        )}

        {amFinalizat && !celalaltAFinalizat && (
          <div className="mt-4 rounded-xl bg-seal/10 p-3.5 text-sm text-seal ring-1 ring-inset ring-seal/25">
            Ai marcat colaborarea ca finalizată. Se așteaptă confirmarea celeilalte firme.
          </div>
        )}

        {deal.status === "finalizat" && (
          <div className="mt-4 rounded-xl bg-teal/10 p-3.5 text-sm text-teal ring-1 ring-inset ring-teal/25">
            <p className="font-semibold">Colaborare finalizată de ambele firme.</p>
            <p className="mt-1">
              Acum puteți lăsa recenzii — se publică automat, fără dovezi, pentru că înțelegerea s-a
              desfășurat prin Breasla.
            </p>
          </div>
        )}

        {activa && (
          <div className="mt-4 border-t border-line pt-4">
            <LinkButton href={`/dashboard/intelegeri/${deal.id}/document`} variant="secondary" size="sm">
              <FileText className="h-3.5 w-3.5" /> Vezi documentul / Export PDF
            </LinkButton>
          </div>
        )}
      </Card>

      {/* Istoric */}
      {versiuni.length > 1 && (
        <Card>
          <button
            onClick={() => setIstoricDeschis((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-ink-soft" />
              <span className="text-sm font-semibold text-ink">
                Istoricul negocierii ({versiuni.length} versiuni)
              </span>
            </span>
            {istoricDeschis ? (
              <ChevronUp className="h-4 w-4 text-ink-soft" />
            ) : (
              <ChevronDown className="h-4 w-4 text-ink-soft" />
            )}
          </button>

          {istoricDeschis && (
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              {versiuni.map((v) => (
                <div key={v.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num rounded-md bg-ink/8 px-2 py-0.5 text-xs font-bold text-ink">
                        v{v.numar}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {numeFirme[v.propus_de] ?? "—"}
                      </span>
                      <Badge
                        tone={
                          v.status === "acceptata" ? "success"
                          : v.status === "propusa" ? "warning"
                          : "neutral"
                        }
                      >
                        {v.status === "acceptata" ? "acceptată"
                          : v.status === "propusa" ? "propusă"
                          : v.status === "respinsa" ? "respinsă"
                          : "înlocuită"}
                      </Badge>
                    </div>
                    <span className="font-mono-num text-xs text-ink-soft/70">
                      {new Date(v.created_at).toLocaleDateString("ro-RO")}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      <span className="font-mono-num font-semibold text-ink">
                        {formatSuma(v.pret_total, v.moneda)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatData(v.termen_final)}
                    </span>
                    <span>{v.clauze.length} clauze · {v.etape.length} etape</span>
                  </div>

                  {v.nota_modificare && (
                    <p className="mt-2 text-xs italic leading-relaxed text-ink-soft">
                      &bdquo;{v.nota_modificare}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
