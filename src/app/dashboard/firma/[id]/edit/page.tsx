"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Trash2, Users, Images, Link2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { incarcaImagineFirma } from "@/lib/upload";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { ReauthGate } from "@/components/ReauthGate";
import { SkeletonPage } from "@/components/ui/Skeleton";
import { EmailUnverifiedBanner } from "@/components/EmailUnverifiedBanner";
import type { Company } from "@/types/database";

export default function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [emailNeconfirmat, setEmailNeconfirmat] = useState<string | null>(null);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [salvat, setSalvat] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [seIncarcaImagine, setSeIncarcaImagine] = useState<"avatar" | "banner" | null>(null);
  const [seSterge, setSeSterge] = useState(false);
  const [linkCopiat, setLinkCopiat] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const urlProfil =
    typeof window !== "undefined" ? `${window.location.origin}/firma/${id}` : "";

  function copiazaLink() {
    navigator.clipboard.writeText(urlProfil).then(() => {
      setLinkCopiat(true);
      setTimeout(() => setLinkCopiat(false), 2000);
    });
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setCompany(data as Company | null));
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user?.email) return;
      const { data: profil } = await supabase
        .from("profiles")
        .select("email_verificat")
        .eq("id", data.user.id)
        .maybeSingle();
      if ((profil as { email_verificat: boolean } | null)?.email_verificat === false) {
        setEmailNeconfirmat(data.user.email);
      }
    });
  }, [id]);

  if (!company) {
    return <SkeletonPage />;
  }

  function update(patch: Partial<Company>) {
    setCompany((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function incarcaImagine(tip: "avatar" | "banner", fisier: File) {
    setSeIncarcaImagine(tip);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaImagineFirma(id, tip, fisier);
      if (tip === "avatar") update({ logo_url: publicUrl });
      else update({ banner_url: publicUrl });
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(null);
    }
  }

  function adaugaTag() {
    const t = tagInput.trim();
    if (!t) return;
    const tags = company!.tags ?? [];
    if (!tags.includes(t)) update({ tags: [...tags, t] });
    setTagInput("");
  }

  function eliminaTag(t: string) {
    update({ tags: (company!.tags ?? []).filter((x) => x !== t) });
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(null);
    setSalvat(false);
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefon_firma: company!.telefon_firma,
          email_firma: company!.email_firma,
          website: company!.website,
          descriere: company!.descriere,
          numar_angajati: company!.numar_angajati,
          dimensiune_echipa: company!.dimensiune_echipa,
          timp_raspuns: company!.timp_raspuns,
          raza_deservire_km: company!.raza_deservire_km,
          cum_poate_ajuta_grupul: company!.cum_poate_ajuta_grupul,
          logo_url: company!.logo_url,
          banner_url: company!.banner_url,
          facebook_url: company!.facebook_url,
          instagram_url: company!.instagram_url,
          linkedin_url: company!.linkedin_url,
          tags: company!.tags,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setSalvat(true);
      router.refresh();
    } finally {
      setSeSalveaza(false);
    }
  }

  async function sterge() {
    if (!window.confirm(`Sigur vrei să ștergi definitiv firma "${company!.denumire}"? Nu poți reveni asupra acestei acțiuni.`)) {
      return;
    }
    setSeSterge(true);
    setEroare(null);
    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSeSterge(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {emailNeconfirmat && <EmailUnverifiedBanner email={emailNeconfirmat} />}

      <h1 className="text-xl font-semibold text-ink">Editează profilul firmei</h1>
      <p className="mt-1 text-sm text-ink-soft">{company.denumire}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <LinkButton href={`/dashboard/firma/${id}/contacte`} variant="secondary" size="sm">
          <Users className="h-3.5 w-3.5" /> Persoane de contact
        </LinkButton>
        <LinkButton href={`/dashboard/firma/${id}/portofoliu`} variant="secondary" size="sm">
          <Images className="h-3.5 w-3.5" /> Portofoliu / Lucrări
        </LinkButton>
      </div>

      <Card className="mt-6 flex flex-wrap items-center gap-4">
        {urlProfil && (
          <Image
            src={`https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encodeURIComponent(urlProfil)}`}
            alt="Cod QR profil"
            width={72}
            height={72}
            unoptimized
            className="rounded-md border border-line"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Profilul tău public</p>
          <p className="mt-0.5 truncate text-xs text-ink-soft">{urlProfil}</p>
          <Button size="sm" variant="secondary" className="mt-2" onClick={copiazaLink}>
            {linkCopiat ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            {linkCopiat ? "Copiat!" : "Copiază link-ul"}
          </Button>
        </div>
      </Card>

      <ReauthGate>
        <Card className="mt-6 space-y-6">
          {/* Banner + avatar */}
          <div>
            <Label>Imagini de profil</Label>
            <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg bg-ink/5">
              {company.banner_url && (
                <Image src={company.banner_url} alt="Banner" fill className="object-cover" unoptimized />
              )}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-navy/0 text-white opacity-0 transition hover:bg-navy/40 hover:opacity-100"
              >
                {seIncarcaImagine === "banner" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && incarcaImagine("banner", e.target.files[0])}
              />
            </div>

            <div className="relative -mt-8 ml-4 h-16 w-16 overflow-hidden rounded-full border-4 border-surface bg-surface">
              {company.logo_url && (
                <Image src={company.logo_url} alt="Logo" fill className="object-cover" unoptimized />
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-navy/0 text-white opacity-0 transition hover:bg-navy/40 hover:opacity-100"
              >
                {seIncarcaImagine === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && incarcaImagine("avatar", e.target.files[0])}
              />
            </div>
            <FieldHint>Click pe banner/avatar pentru a încărca o imagine (max 5MB). Recomandăm logo-ul firmei ca avatar.</FieldHint>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Telefon firmă</Label>
              <Input
                value={company.telefon_firma ?? ""}
                onChange={(e) => update({ telefon_firma: e.target.value })}
              />
            </div>
            <div>
              <Label>Email firmă</Label>
              <Input
                type="email"
                value={company.email_firma ?? ""}
                onChange={(e) => update({ email_firma: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input value={company.website ?? ""} onChange={(e) => update({ website: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Facebook</Label>
              <Input
                value={company.facebook_url ?? ""}
                onChange={(e) => update({ facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input
                value={company.instagram_url ?? ""}
                onChange={(e) => update({ instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                value={company.linkedin_url ?? ""}
                onChange={(e) => update({ linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>

          <div>
            <Label>Descriere</Label>
            <Textarea
              value={company.descriere ?? ""}
              onChange={(e) => update({ descriere: e.target.value })}
            />
          </div>

          <div>
            <Label>Etichete / specializări</Label>
            <div className="flex flex-wrap gap-1.5">
              {(company.tags ?? []).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-2.5 py-1 text-xs text-ink">
                  {t}
                  <button type="button" onClick={() => eliminaTag(t)} className="text-ink-soft/70 hover:text-rust">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adaugaTag())}
                placeholder="ex: sudură inox"
              />
              <Button type="button" variant="secondary" size="sm" onClick={adaugaTag}>Adaugă</Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Dimensiune echipă</Label>
              <Select
                value={company.dimensiune_echipa ?? ""}
                onChange={(e) => update({ dimensiune_echipa: e.target.value as Company["dimensiune_echipa"] })}
              >
                <option value="">Alege...</option>
                <option value="1">1</option>
                <option value="2-9">2-9</option>
                <option value="10-49">10-49</option>
                <option value="50-249">50-249</option>
                <option value="250+">250+</option>
              </Select>
            </div>
            <div>
              <Label>Timp mediu de răspuns</Label>
              <Select
                value={company.timp_raspuns ?? ""}
                onChange={(e) => update({ timp_raspuns: e.target.value as Company["timp_raspuns"] })}
              >
                <option value="">Nespecificat</option>
                <option value="sub_1h">Sub 1 oră</option>
                <option value="sub_24h">Sub 24 de ore</option>
                <option value="2_3_zile">2-3 zile</option>
                <option value="peste_3_zile">Peste 3 zile</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Rază deservire (km)</Label>
            <Input
              type="number"
              value={company.raza_deservire_km ?? ""}
              onChange={(e) => update({ raza_deservire_km: e.target.value ? Number(e.target.value) : null })}
            />
            <FieldHint>Afișată pe profilul public ca &ldquo;zonă deservită&rdquo;.</FieldHint>
          </div>

          <div>
            <Label>Ce speri să obții din grup</Label>
            <Textarea
              value={company.cum_poate_ajuta_grupul ?? ""}
              onChange={(e) => update({ cum_poate_ajuta_grupul: e.target.value })}
            />
          </div>

          <FieldError>{eroare}</FieldError>
          {salvat && <p className="text-sm font-medium text-teal">Salvat.</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>Înapoi</Button>
            <Button onClick={salveaza} disabled={seSalveaza}>
              {seSalveaza ? "Se salvează..." : "Salvează"}
            </Button>
          </div>
        </Card>

        <Card className="mt-6 border-rust/30 bg-rust/5">
          <p className="font-medium text-ink">Zonă periculoasă</p>
          <p className="mt-1 text-sm text-ink-soft">
            Ștergerea firmei e permanentă și elimină tot: profil, conexiuni, recenzii, portofoliu.
          </p>
          <Button variant="danger" size="sm" className="mt-3" onClick={sterge} disabled={seSterge}>
            <Trash2 className="h-3.5 w-3.5" /> {seSterge ? "Se șterge..." : "Șterge firma definitiv"}
          </Button>
        </Card>
      </ReauthGate>
    </div>
  );
}
