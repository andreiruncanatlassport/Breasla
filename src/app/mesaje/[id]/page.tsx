import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/MessageThread";

export default async function MesajeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // autentificarea e deja garantata de mesaje/layout.tsx (redirect la /login)
  if (!user) return null;

  return <MessageThread conversationId={id} myProfileId={user.id} />;
}
