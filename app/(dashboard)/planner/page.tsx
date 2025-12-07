import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlannerView } from "@/components/planner/planner-view"

export default async function PlannerPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch all tasks for this user
  const { data: tasks } = await supabase
    .from("planner_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch active study session if any
  const { data: activeSession } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .single()

  return <PlannerView initialTasks={tasks || []} userId={user.id} activeSession={activeSession} />
}
