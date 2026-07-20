import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function MesajePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
      <MessageCircle className="h-10 w-10 text-ink-soft/30" strokeWidth={1.5} />
      <p className="max-w-xs text-sm text-ink-soft">
        Alege o conversație din stânga, sau pornește una nouă din pagina de{" "}
        <Link href="/membri" className="font-semibold text-seal hover:underline">
          Membri
        </Link>
        .
      </p>
    </div>
  );
}
