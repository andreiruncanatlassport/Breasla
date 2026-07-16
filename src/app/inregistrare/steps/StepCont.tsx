"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Field";

interface Props {
  onDone: () => void;
}

export function StepCont({ onDone }: Props) {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [numeComplet, setNumeComplet] = useState("");
  const [telefonPersonal, setTelefonPersonal] = useState("");
  const [eroare, setEroare] = useState<string | null>(null);
  const [seIncarca, setSeIncarca] = useState(false);
  const [asteaptaConfirmare, setAsteaptaConfirmare] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEroare(null);
    setSeIncarca(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: parola,
      options: {
        data: { nume_complet: numeComplet },
      },
    });

    setSeIncarca(false);

    if (error) {
      setEroare(error.message);
      return;
    }

    // Daca in Supabase e activata confirmarea prin email, nu primim sesiune imediat.
    if (!data.session) {
      setAsteaptaConfirmare(true);
      return;
    }

    // Salvam si telefonul personal (trigger-ul de bd a creat deja randul din profiles)
    if (telefonPersonal) {
      await supabase
        .from("profiles")
        .update({ telefon_personal: telefonPersonal } as never)
        .eq("id", data.user!.id);
    }

    onDone();
  }

  if (asteaptaConfirmare) {
    return (
      <div className="rounded-lg bg-teal/10 p-5 text-sm text-teal">
        Ți-am trimis un email de confirmare la <strong>{email}</strong>. Deschide-l, apasă pe
        linkul de confirmare, apoi revino aici și autentifică-te ca să continui înregistrarea firmei.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="numeComplet" required>Numele tău</Label>
        <Input
          id="numeComplet"
          required
          value={numeComplet}
          onChange={(e) => setNumeComplet(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="telefonPersonal">Telefon personal</Label>
        <Input
          id="telefonPersonal"
          type="tel"
          value={telefonPersonal}
          onChange={(e) => setTelefonPersonal(e.target.value)}
        />
        <FieldHint>
          Vizibil doar către firmele cu care accepți o conexiune — nu e public.
        </FieldHint>
      </div>
      <div>
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="parola" required>Parolă</Label>
        <Input
          id="parola"
          type="password"
          required
          minLength={8}
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          autoComplete="new-password"
        />
        <FieldHint>Minim 8 caractere.</FieldHint>
      </div>

      <FieldError>{eroare}</FieldError>

      <Button type="submit" className="w-full" disabled={seIncarca}>
        {seIncarca ? "Se creează contul..." : "Continuă"}
      </Button>
    </form>
  );
}
