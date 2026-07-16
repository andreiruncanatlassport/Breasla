"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { useSettings } from "@/lib/settings/context";

export default function LoginPage() {
  const { t } = useSettings();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState<string | null>(null);
  const [seIncarca, setSeIncarca] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEroare(null);
    setSeIncarca(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parola,
    });

    setSeIncarca(false);

    if (error) {
      setEroare(
        error.message.includes("Invalid login")
          ? "Email sau parolă incorectă."
          : error.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-ink">{t.auth.login}</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email" required>{t.auth.email}</Label>
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
            <Label htmlFor="parola" required>{t.auth.parola}</Label>
            <Input
              id="parola"
              type="password"
              required
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <FieldError>{eroare}</FieldError>

          <Button type="submit" className="w-full" disabled={seIncarca}>
            {seIncarca ? t.common.loading : t.auth.login}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          {t.auth.noAccount}{" "}
          <Link href="/inregistrare" className="font-medium text-seal hover:underline">
            {t.nav.register}
          </Link>
        </p>
      </Card>
    </div>
  );
}
