"use client";

import { useEffect, useState } from "react";

/**
 * Numarul de conversatii cu mesaje necitite — pentru badge-ul "(N)" de pe
 * tab-ul Mesaje (header desktop, meniul mobil si bara de jos). Se actualizeaza
 * la montare si apoi periodic, cat timp userul e autentificat.
 */
export function useUnreadMessagesCount(autentificat: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!autentificat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(0);
      return;
    }
    let anulat = false;
    async function incarca() {
      try {
        const res = await fetch("/api/messages/unread-count");
        const json = await res.json();
        if (!anulat) setCount(json?.data?.count ?? 0);
      } catch {
        // retea indisponibila — reincercam la urmatorul interval
      }
    }
    incarca();
    const interval = setInterval(incarca, 20000);
    return () => {
      anulat = true;
      clearInterval(interval);
    };
  }, [autentificat]);

  return count;
}
