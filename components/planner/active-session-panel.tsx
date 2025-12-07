"use client"

import type { PlannerTask, StudySession } from "@/lib/types"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Play, Square, Clock, Target, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface ActiveSessionPanelProps {
  session: StudySession | null
  tasks: PlannerTask[]
  userId: string
  onSessionStart: (session: StudySession) => void
  onSessionEnd: () => void
}

export function ActiveSessionPanel({ session, tasks, userId, onSessionStart, onSessionEnd }: ActiveSessionPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [notes, setNotes] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled")

  useEffect(() => {
    if (session) {
      const interval = setInterval(() => {
        const start = new Date(session.start_time).getTime()
        const now = Date.now()
        setElapsed(Math.floor((now - start) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsed(0)
    }
  }, [session])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleStartSession = async () => {
    setIsLoading(true)

    const newSession = {
      user_id: userId,
      task_id: selectedTaskId || null,
      subject: subject || (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId)?.subject : null),
      start_time: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("study_sessions").insert(newSession).select().single()

    if (!error && data) {
      onSessionStart(data)
    }
    setIsLoading(false)
  }

  const handleEndSession = async () => {
    if (!session) return
    setIsLoading(true)

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - new Date(session.start_time).getTime()) / 60000)

    await supabase
      .from("study_sessions")
      .update({
        end_time: endTime.toISOString(),
        duration,
        notes: notes || null,
      })
      .eq("id", session.id)

    setNotes("")
    onSessionEnd()
    setIsLoading(false)
  }

  if (session) {
    const linkedTask = tasks.find((t) => t.id === session.task_id)

    return (
      <Card className="w-80 shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-chart-2" />
              Active Session
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer */}
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-4xl font-bold tabular-nums text-primary">{formatTime(elapsed)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Started {formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}
            </p>
          </div>

          {/* Session Info */}
          {linkedTask && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">{linkedTask.title}</span>
              </div>
              {linkedTask.subject && <p className="mt-1 text-xs text-muted-foreground">{linkedTask.subject}</p>}
            </div>
          )}

          {session.subject && !linkedTask && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{session.subject}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes</Label>
            <Textarea
              id="notes"
              placeholder="What did you accomplish?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* End Button */}
          <Button variant="destructive" className="w-full" onClick={handleEndSession} disabled={isLoading}>
            <Square className="mr-2 h-4 w-4" />
            End Session
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80 shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Start Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Track your study time by starting a focused session.</p>

        <div className="space-y-2">
          <Label htmlFor="task">Link to Task (optional)</Label>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No task</SelectItem>
              {activeTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject (optional)</Label>
          <input
            type="text"
            id="subject"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="e.g., Mathematics"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={handleStartSession} disabled={isLoading}>
          <Play className="mr-2 h-4 w-4" />
          Start Session
        </Button>
      </CardContent>
    </Card>
  )
}
