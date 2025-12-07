import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { QuizAttemptView } from "@/components/quizzes/quiz-attempt-view"

export default async function QuizAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: quiz } = await supabase
    .from("quiz_definitions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!quiz) {
    notFound()
  }

  return <QuizAttemptView quiz={quiz} userId={user.id} />
}
