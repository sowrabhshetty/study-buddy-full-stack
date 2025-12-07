import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { subDays, startOfDay, format, eachDayOfInterval } from "date-fns"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const thirtyDaysAgo = subDays(new Date(), 30)

  // Fetch study sessions for the last 30 days
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", thirtyDaysAgo.toISOString())
    .order("start_time", { ascending: true })

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("planner_tasks")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo.toISOString())

  // Fetch quiz attempts
  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("*, quiz_definitions(*)")
    .eq("user_id", user.id)
    .gte("completed_at", thirtyDaysAgo.toISOString())
    .order("completed_at", { ascending: true })

  // Calculate study time by day
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() })
  const studyByDay = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const dayStart = startOfDay(day)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dayMinutes =
      sessions
        ?.filter((s) => {
          const sessionDate = new Date(s.start_time)
          return sessionDate >= dayStart && sessionDate < dayEnd
        })
        .reduce((acc, s) => acc + (s.duration || 0), 0) || 0

    return {
      date: dayStr,
      day: format(day, "EEE"),
      minutes: dayMinutes,
    }
  })

  // Calculate quiz scores by subject
  const quizScoresBySubject: Record<string, { total: number; correct: number; count: number }> = {}
  quizAttempts?.forEach((attempt) => {
    const subject = attempt.quiz_definitions?.subject || "General"
    if (!quizScoresBySubject[subject]) {
      quizScoresBySubject[subject] = { total: 0, correct: 0, count: 0 }
    }
    quizScoresBySubject[subject].total += attempt.total_questions
    quizScoresBySubject[subject].correct += attempt.score
    quizScoresBySubject[subject].count += 1
  })

  const subjectPerformance = Object.entries(quizScoresBySubject).map(([subject, data]) => ({
    subject,
    percentage: Math.round((data.correct / data.total) * 100),
    quizCount: data.count,
    questionsAnswered: data.total,
  }))

  // Calculate task stats
  const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0
  const totalTasks = tasks?.length || 0
  const tasksByStatus = {
    todo: tasks?.filter((t) => t.status === "todo").length || 0,
    "in-progress": tasks?.filter((t) => t.status === "in-progress").length || 0,
    completed: completedTasks,
    cancelled: tasks?.filter((t) => t.status === "cancelled").length || 0,
  }

  // Calculate task completion by priority
  const tasksByPriority: Record<string, { total: number; completed: number }> = {}
  tasks?.forEach((task) => {
    if (!tasksByPriority[task.priority]) {
      tasksByPriority[task.priority] = { total: 0, completed: 0 }
    }
    tasksByPriority[task.priority].total += 1
    if (task.status === "completed") {
      tasksByPriority[task.priority].completed += 1
    }
  })

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Check from today backwards
  for (let i = studyByDay.length - 1; i >= 0; i--) {
    if (studyByDay[i].minutes > 0) {
      tempStreak++
      if (i === studyByDay.length - 1 || i === studyByDay.length - 2) {
        currentStreak = tempStreak
      }
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
      tempStreak = 0
      if (i === studyByDay.length - 1) {
        currentStreak = 0
      }
    }
  }
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak
  }

  const totalStudyMinutes = sessions?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0
  const totalSessions = sessions?.length || 0
  const avgSessionLength = totalSessions > 0 ? Math.round(totalStudyMinutes / totalSessions) : 0

  const analyticsData = {
    studyByDay,
    subjectPerformance,
    tasksByStatus,
    tasksByPriority,
    stats: {
      totalStudyMinutes,
      totalSessions,
      avgSessionLength,
      completedTasks,
      totalTasks,
      quizzesTaken: quizAttempts?.length || 0,
      avgQuizScore:
        quizAttempts && quizAttempts.length > 0
          ? Math.round(
              quizAttempts.reduce((acc, q) => acc + (q.score / q.total_questions) * 100, 0) / quizAttempts.length,
            )
          : 0,
      currentStreak,
      longestStreak,
    },
  }

  return <AnalyticsView data={analyticsData} />
}
