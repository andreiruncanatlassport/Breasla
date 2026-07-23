"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Widget Cloudflare Turnstile, reutilizabil pe orice formular de autentificare
 * (inregistrare, login). Token-ul obtinut se trimite mai departe la Supabase
 * Auth ca `options: { captchaToken }` — Supabase il verifica el insusi cu
 * Cloudflare (folosind Secret Key-ul configurat in Dashboard > Authentication
 * > Bot and Abuse Protection), nu trebuie sa scriem noi verificare server-side.
 *
 * Daca `NEXT_PUBLIC_TURNSTILE_SITE_KEY` nu e setat (ex: dezvoltare locala),
 * widgetul pur si simplu nu se randeaza — util ca sa nu blocheze lucrul local
 * inainte sa fie configurat Cloudflare. IN PRODUCTIE insa, daca protectia
 * CAPTCHA e activata in Supabase dar cheia asta lipseste, autentificarea va
 * esua — deci variabila trebuie neaparat setata acolo unde ruleaza aplicatia.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let promisaScript: Promise<void> | null = null;

function incarcaScriptTurnstile(): Promise<void> {
  if (typeof window !== "undefined" && window.turnstile) return Promise.resolve();
  if (promisaScript) return promisaScript;
  promisaScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Nu am putut încărca Turnstile."));
    document.head.appendChild(script);
  });
  return promisaScript;
}

export function TurnstileWidget({
  onToken,
  onExpire,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [eroareIncarcare, setEroareIncarcare] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    let anulat = false;

    incarcaScriptTurnstile()
      .then(() => {
        if (anulat || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onToken,
          "expired-callback": () => onExpire?.(),
          theme: "light",
        });
      })
      .catch(() => setEroareIncarcare(true));

    return () => {
      anulat = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null; // neconfigurat (ex: local) — nu blocam formularul

  if (eroareIncarcare) {
    return (
      <p className="text-xs text-ember">
        Nu am putut încărca verificarea anti-spam. Reîncarcă pagina.
      </p>
    );
  }

  return <div ref={containerRef} />;
}
