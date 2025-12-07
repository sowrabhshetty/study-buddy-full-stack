import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QuizzesView } from "@/components/quizzes/quizzes-view"

export default async function QuizzesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch user's quizzes
  const { data: quizzes } = await supabase
    .from("quiz_definitions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch recent attempts
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("*, quiz_definitions(*)")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(10)

  return <QuizzesView userId={user.id} initialQuizzes={quizzes || []} initialAttempts={attempts || []} />
}
