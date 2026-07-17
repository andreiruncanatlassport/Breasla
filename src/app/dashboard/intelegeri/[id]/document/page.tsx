import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/deal/PrintButton";
import type { Company, Deal, DealVersion } from "@/types/database";

function formatData(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" }) : "—";
}
function formatSuma(v: number | null | undefined, moneda: string) {
  return v == null ? "—" : `${v.toLocaleString("ro-RO")} ${moneda}`;
}

function BlocFirma({ c, rol }: { c: Company | undefined; rol: string }) {
  if (!c) return null;
  return (
    <div>
      <p className="doc-eticheta">{rol}</p>
      <p className="mt-1 font-semibold text-[#101828]">{c.denumire}</p>
      <dl className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-[#475467]">
        <div>CUI: <span className="font-mono">{c.cui}</span></div>
        {c.nr_reg_com && <div>Nr. Reg. Com.: <span className="font-mono">{c.nr_reg_com}</span></div>}
        {c.adresa_sediu && <div>Sediu: {c.adresa_sediu}</div>}
        {c.telefon_firma && <div>Telefon: {c.telefon_firma}</div>}
        {c.email_firma && <div>Email: {c.email_firma}</div>}
      </dl>
    </div>
  );
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dealData } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
  if (!dealData) notFound();
  const deal = dealData as Deal;

  const [{ data: versiuniData }, { data: firmeData }] = await Promise.all([
    supabase.from("deal_versions").select("*").eq("deal_id", id).order("numar", { ascending: false }),
    supabase.from("companies").select("*").in("id", [deal.company_a_id, deal.company_b_id]),
  ]);

  const versiuni = (versiuniData as DealVersion[]) ?? [];
  const firme = (firmeData as Company[]) ?? [];

  const v = versiuni.find((x) => x.id === deal.versiune_acceptata_id) ?? versiuni[0];
  if (!v) notFound();

  const firmaA = firme.find((f) => f.id === deal.company_a_id);
  const firmaB = firme.find((f) => f.id === deal.company_b_id);
  const acceptat = Boolean(deal.versiune_acceptata_id);

  return (
    <>
      {/* Bara de acțiuni — dispare la tipărire */}
      <div className="no-print border-b border-line bg-paper">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link
            href={`/dashboard/intelegeri/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Înapoi la înțelegere
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* DOCUMENTUL — culori fixe intenționat: se tipărește la fel indiferent de tema aleasă */}
      <div className="mx-auto max-w-4xl px-5 py-8 print:p-0">
        <article className="doc mx-auto bg-white p-10 text-[#101828] shadow-[var(--shadow-lg)] print:shadow-none">
          {/* ANTET */}
          <header className="flex items-start justify-between gap-6 border-b-2 border-[#f0722a] pb-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" className="h-11 w-11 object-contain" />
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-[#0a2540]">Breasla.ro</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#f0722a]">
                  Registrul antreprenorilor din România
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] leading-relaxed text-[#475467]">
              <p className="font-mono">Dosar {id.slice(0, 8).toUpperCase()}</p>
              <p className="font-mono">Versiunea {v.numar}</p>
              <p className="font-mono">{formatData(v.created_at)}</p>
            </div>
          </header>

          <div className="mt-7">
            <p className="doc-eticheta text-[#f0722a]">Rezumatul înțelegerii</p>
            <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight text-[#101828]">
              {deal.titlu}
            </h1>
            <p className="mt-2 inline-block rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[11px] font-semibold text-[#475467]">
              {acceptat ? "Termeni acceptați de ambele firme" : "Propunere — încă neacceptată"}
              {deal.status === "finalizat" && " · Colaborare finalizată"}
            </p>
          </div>

          {/* PĂRȚILE */}
          <section className="mt-7 grid grid-cols-2 gap-6 border-y border-[#e6e5e0] py-5">
            <BlocFirma c={firmaA} rol="Partea 1" />
            <BlocFirma c={firmaB} rol="Partea 2" />
          </section>

          {/* OBIECT */}
          {v.descriere_lucrare && (
            <section className="mt-6">
              <h2 className="doc-titlu">1. Obiectul colaborării</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[#344054]">
                {v.descriere_lucrare}
              </p>
            </section>
          )}

          {/* VALOARE ȘI PLATĂ */}
          <section className="mt-6">
            <h2 className="doc-titlu">2. Valoare și modalitate de plată</h2>
            <table className="mt-2 w-full border-collapse text-[13px]">
              <tbody>
                <tr className="border-b border-[#e6e5e0]">
                  <td className="w-48 py-2 text-[#475467]">Preț total</td>
                  <td className="py-2 font-mono font-bold text-[#101828]">
                    {formatSuma(v.pret_total, v.moneda)}
                  </td>
                </tr>
                <tr className="border-b border-[#e6e5e0]">
                  <td className="py-2 text-[#475467]">Modalitate de plată</td>
                  <td className="py-2 text-[#101828]">{v.modalitate_plata || "—"}</td>
                </tr>
                <tr className="border-b border-[#e6e5e0]">
                  <td className="py-2 text-[#475467]">Perioadă de execuție</td>
                  <td className="py-2 text-[#101828]">
                    {formatData(v.termen_start)} — {formatData(v.termen_final)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ETAPE */}
          {v.etape.length > 0 && (
            <section className="mt-6">
              <h2 className="doc-titlu">3. Etape</h2>
              <table className="mt-2 w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#101828] text-left">
                    <th className="py-1.5 font-semibold">Etapă</th>
                    <th className="py-1.5 font-semibold">Termen</th>
                    <th className="py-1.5 text-right font-semibold">Sumă</th>
                  </tr>
                </thead>
                <tbody>
                  {v.etape.map((e, i) => (
                    <tr key={i} className="border-b border-[#e6e5e0] align-top">
                      <td className="py-2">
                        <p className="font-medium text-[#101828]">{e.titlu}</p>
                        {e.descriere && <p className="text-[11px] text-[#475467]">{e.descriere}</p>}
                      </td>
                      <td className="py-2 font-mono text-[12px] text-[#475467]">
                        {e.termen ? formatData(e.termen) : "—"}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold">
                        {e.suma != null ? formatSuma(e.suma, v.moneda) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* CLAUZE */}
          {v.clauze.length > 0 && (
            <section className="mt-6">
              <h2 className="doc-titlu">{v.etape.length > 0 ? "4" : "3"}. Clauze convenite</h2>
              <ol className="mt-2 space-y-3">
                {v.clauze.map((c, i) => (
                  <li key={i} className="break-inside-avoid text-[13px]">
                    <p className="font-semibold text-[#101828]">
                      {i + 1}. {c.titlu}
                    </p>
                    <p className="mt-0.5 leading-relaxed text-[#344054]">{c.continut}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* SEMNĂTURI */}
          <section className="mt-10 grid grid-cols-2 gap-8 break-inside-avoid">
            {[firmaA, firmaB].map((f, i) => (
              <div key={i}>
                <div className="h-14 border-b border-[#101828]" />
                <p className="mt-1.5 text-[11px] font-semibold text-[#101828]">{f?.denumire}</p>
                <p className="text-[10px] text-[#475467]">Nume, semnătură și ștampilă</p>
              </div>
            ))}
          </section>

          {/* SUBSOL — limitarea de responsabilitate, deliberat vizibilă */}
          <footer className="mt-8 border-t border-[#e6e5e0] pt-4">
            <p className="text-[10px] leading-relaxed text-[#667085]">
              <strong className="text-[#344054]">Important:</strong> acest document este un rezumat
              al înțelegerii dintre cele două firme, generat prin platforma Breasla.ro ca bază de
              discuție și lucru. <strong className="text-[#344054]">Nu este un contract redactat
              juridic</strong> și nu ține loc de consultanță de specialitate. Pentru un contract cu
              valoare juridică deplină, consultați un avocat. Datele firmelor provin din surse
              publice oficiale (ANAF), la data preluării.
            </p>
            <p className="mt-2 font-mono text-[9px] text-[#98a2b3]">
              Generat prin Breasla.ro · Dosar {id.slice(0, 8).toUpperCase()} · v{v.numar} ·{" "}
              {formatData(new Date().toISOString())}
            </p>
          </footer>
        </article>
      </div>
    </>
  );
}
