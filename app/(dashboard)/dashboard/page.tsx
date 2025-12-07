import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard/overview"

export default async function DashboardPage() {
  const supabase = await createClient()

  let user
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      redirect("/auth/login")
    }
    user = data.user
  } catch {
    redirect("/auth/login")
  }

  let stats = {
    totalTasks: 0,
    completedTasks: 0,
    totalSessions: 0,
    totalStudyMinutes: 0,
    quizzesTaken: 0,
    avgQuizScore: 0,
    aiConversations: 0,
  }
  let recentTasks: any[] = []
  let upcomingTasks: any[] = []

  try {
    // Fetch user stats
    const [tasksResult, sessionsResult, quizzesResult, conversationsResult] = await Promise.all([
      supabase.from("planner_tasks").select("*", { count: "exact" }).eq("user_id", user.id),
      supabase.from("study_sessions").select("*", { count: "exact" }).eq("user_id", user.id),
      supabase.from("quiz_attempts").select("*", { count: "exact" }).eq("user_id", user.id),
      supabase.from("ai_conversations").select("*", { count: "exact" }).eq("user_id", user.id),
    ])

    stats = {
      totalTasks: tasksResult.count || 0,
      completedTasks: tasksResult.data?.filter((t) => t.status === "completed").length || 0,
      totalSessions: sessionsResult.count || 0,
      totalStudyMinutes: sessionsResult.data?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0,
      quizzesTaken: quizzesResult.count || 0,
      avgQuizScore:
        quizzesResult.data && quizzesResult.data.length > 0
          ? Math.round(
              quizzesResult.data.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) /
                quizzesResult.data.length,
            )
          : 0,
      aiConversations: conversationsResult.count || 0,
    }

    // Fetch recent tasks
    const { data: recent } = await supabase
      .from("planner_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
    recentTasks = recent || []

    // Fetch upcoming tasks
    const { data: upcoming } = await supabase
      .from("planner_tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .neq("status", "cancelled")
      .not("due_date", "is", null)
      .gte("due_date", new Date().toISOString())
      .order("due_date", { ascending: true })
      .limit(5)
    upcomingTasks = upcoming || []
  } catch (error) {
    // Tables may not exist yet - continue with empty data
    console.error("Error fetching dashboard data:", error)
  }

  return <DashboardOverview stats={stats} recentTasks={recentTasks} upcomingTasks={upcomingTasks} userId={user.id} />
}
