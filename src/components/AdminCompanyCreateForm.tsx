"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";
import type { Judet } from "@/types/database";

export function AdminCompanyCreateForm({ judete }: { judete: Judet[] }) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  const [denumire, setDenumire] = useState("");
  const [cui, setCui] = useState("");
  const [nrRegCom, setNrRegCom] = useState("");
  const [judetCod, setJudetCod] = useState("");
  const [localitate, setLocalitate] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [descriere, setDescriere] = useState("");
  const [domeniiAltele, setDomeniiAltele] = useState("");

  function reset() {
    setDenumire("");
    setCui("");
    setNrRegCom("");
    setJudetCod("");
    setLocalitate("");
    setTelefon("");
    setEmail("");
    setWebsite("");
    setDescriere("");
    setDomeniiAltele("");
  }

  async function trimite() {
    setEroare(null);
    if (!denumire.trim() || !cui.trim()) {
      setEroare("Denumirea și CUI-ul sunt obligatorii.");
      return;
    }
    setSeTrimite(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          denumire,
          cui,
          nr_reg_com: nrRegCom,
          judet_cod: judetCod || null,
          localitate,
          telefon_firma: telefon,
          email_firma: email,
          website,
          descriere,
          domenii_altele: domeniiAltele,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut adăuga firma.");
        return;
      }
      reset();
      setDeschis(false);
      router.refresh();
    } finally {
      setSeTrimite(false);
    }
  }

  if (!deschis) {
    return (
      <Button variant="secondary" onClick={() => setDeschis(true)}>
        <Plus className="h-4 w-4" /> Adaugă firmă manual
      </Button>
    );
  }

  return (
    <div className="block-base p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="stamp-label text-seal">Firmă nouă (manual)</p>
        <button
          type="button"
          onClick={() => setDeschis(false)}
          className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          Închide <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label required>Denumire firmă</Label>
          <Input value={denumire} onChange={(e) => setDenumire(e.target.value)} placeholder="Ex: Tech Solutions SRL" />
        </div>
        <div>
          <Label required>CUI</Label>
          <Input value={cui} onChange={(e) => setCui(e.target.value)} placeholder="Ex: 12345678" inputMode="numeric" />
        </div>
        <div>
          <Label>Nr. înregistrare</Label>
          <Input value={nrRegCom} onChange={(e) => setNrRegCom(e.target.value)} placeholder="Ex: J40/1234/2020" />
        </div>
        <div>
          <Label>Județ</Label>
          <Select value={judetCod} onChange={(e) => setJudetCod(e.target.value)}>
            <option value="">Alege...</option>
            {judete.map((j) => (
              <option key={j.cod} value={j.cod}>
                {j.nume}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Localitate</Label>
          <Input value={localitate} onChange={(e) => setLocalitate(e.target.value)} placeholder="Ex: Cluj-Napoca" />
        </div>
        <div>
          <Label>Telefon firmă</Label>
          <Input value={telefon} onChange={(e) => setTelefon(e.target.value)} />
        </div>
        <div>
          <Label>Email firmă</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="sm:col-span-2">
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="ex: firma.ro" />
        </div>
        <div className="sm:col-span-2">
          <Label>Descriere</Label>
          <Textarea value={descriere} onChange={(e) => setDescriere(e.target.value)} placeholder="Ce face firma..." />
        </div>
        <div className="sm:col-span-2">
          <Label>Domenii (text liber)</Label>
          <Input value={domeniiAltele} onChange={(e) => setDomeniiAltele(e.target.value)} placeholder="Ex: construcții, instalații electrice" />
        </div>
      </div>

      <FieldError>{eroare}</FieldError>

      <div className="mt-4 flex gap-2">
        <Button variant="seal" onClick={trimite} disabled={seTrimite}>
          {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adaugă firma
        </Button>
        <Button variant="ghost" onClick={() => setDeschis(false)} disabled={seTrimite}>
          Anulează
        </Button>
      </div>
    </div>
  );
}
