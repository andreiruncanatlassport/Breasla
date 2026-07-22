import { MessageCircle } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function MesajePage() {
  const { t } = await getT();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
      <MessageCircle className="h-10 w-10 text-ink-soft/30" strokeWidth={1.5} />
      <p className="max-w-xs text-sm text-ink-soft">{t.messages.selectConversation}</p>
    </div>
  );
}
