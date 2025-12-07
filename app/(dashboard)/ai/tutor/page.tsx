import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AiTutorView } from "@/components/ai/tutor-view"

export default async function AiTutorPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch recent tutor conversations
  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("mode", "tutor")
    .order("updated_at", { ascending: false })
    .limit(20)

  return <AiTutorView userId={user.id} initialConversations={conversations || []} />
}
