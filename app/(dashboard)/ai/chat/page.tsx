import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudyChatView } from "@/components/ai/study-chat-view"

export default async function StudyChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch recent chatbot conversations
  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("mode", "chatbot")
    .order("updated_at", { ascending: false })
    .limit(20)

  // Fetch today's tasks for context
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todaysTasks } = await supabase
    .from("planner_tasks")
    .select("*")
    .eq("user_id", user.id)
    .gte("due_date", today.toISOString())
    .lt("due_date", tomorrow.toISOString())
    .neq("status", "completed")
    .neq("status", "cancelled")

  // Fetch recent quiz attempts for context
  const { data: recentQuizzes } = await supabase
    .from("quiz_attempts")
    .select("*, quiz_definitions(*)")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(5)

  // Fetch study stats
  const { data: studySessions } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const totalStudyMinutes = studySessions?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0

  return (
    <StudyChatView
      userId={user.id}
      initialConversations={conversations || []}
      context={{
        todaysTasks: todaysTasks || [],
        recentQuizzes: recentQuizzes || [],
        weeklyStudyMinutes: totalStudyMinutes,
      }}
    />
  )
}
