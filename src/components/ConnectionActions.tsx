"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ConnectionActions({
  connectionId,
  actiuni,
}: {
  connectionId: string;
  actiuni: Array<"accept" | "decline" | "cancel">;
}) {
  const router = useRouter();
  const [seIncarca, setSeIncarca] = useState(false);

  async function raspunde(actiune: "accept" | "decline" | "cancel") {
    setSeIncarca(true);
    try {
      await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actiune }),
      });
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div className="flex gap-2">
      {actiuni.includes("accept") && (
        <Button size="sm" onClick={() => raspunde("accept")} disabled={seIncarca}>Acceptă</Button>
      )}
      {actiuni.includes("decline") && (
        <Button size="sm" variant="secondary" onClick={() => raspunde("decline")} disabled={seIncarca}>Refuză</Button>
      )}
      {actiuni.includes("cancel") && (
        <Button size="sm" variant="ghost" onClick={() => raspunde("decline")} disabled={seIncarca}>Anulează</Button>
      )}
    </div>
  );
}
