"use client"

import type { PlannerTask } from "@/lib/types"
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "History",
  "Geography",
  "English",
  "Literature",
  "Economics",
  "Other",
]

interface TaskEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: PlannerTask | null
  userId: string
  onSave: (task: PlannerTask) => void
  onDelete: (taskId: string) => void
}

export function TaskEditorModal({ open, onOpenChange, task, userId, onSave, onDelete }: TaskEditorModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [priority, setPriority] = useState<PlannerTask["priority"]>("medium")
  const [status, setStatus] = useState<PlannerTask["status"]>("todo")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [scheduledStart, setScheduledStart] = useState<Date | undefined>()
  const [scheduledStartTime, setScheduledStartTime] = useState("09:00")
  const [color, setColor] = useState(COLORS[0])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setSubject(task.subject || "")
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.due_date ? new Date(task.due_date) : undefined)
      setEstimatedDuration(task.estimated_duration?.toString() || "")
      setScheduledStart(task.scheduled_start ? new Date(task.scheduled_start) : undefined)
      if (task.scheduled_start) {
        const date = new Date(task.scheduled_start)
        setScheduledStartTime(format(date, "HH:mm"))
      }
      setColor(task.color || COLORS[0])
    } else {
      setTitle("")
      setDescription("")
      setSubject("")
      setPriority("medium")
      setStatus("todo")
      setDueDate(undefined)
      setEstimatedDuration("")
      setScheduledStart(undefined)
      setScheduledStartTime("09:00")
      setColor(COLORS[0])
    }
  }, [task, open])

  const handleSave = async () => {
    if (!title.trim()) return
    setIsLoading(true)

    let scheduledStartISO = null
    if (scheduledStart) {
      const [hours, minutes] = scheduledStartTime.split(":").map(Number)
      const scheduled = new Date(scheduledStart)
      scheduled.setHours(hours, minutes, 0, 0)
      scheduledStartISO = scheduled.toISOString()
    }

    const taskData = {
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      subject: subject || null,
      priority,
      status,
      due_date: dueDate?.toISOString() || null,
      estimated_duration: estimatedDuration ? Number.parseInt(estimatedDuration) : null,
      scheduled_start: scheduledStartISO,
      color,
      updated_at: new Date().toISOString(),
    }

    if (task) {
      const { data, error } = await supabase
        .from("planner_tasks")
        .update(taskData)
        .eq("id", task.id)
        .eq("user_id", userId)
        .select()
        .single()

      if (!error && data) {
        onSave(data)
      }
    } else {
      const { data, error } = await supabase.from("planner_tasks").insert(taskData).select().single()

      if (!error && data) {
        onSave(data)
      }
    }

    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!task) return
    setIsLoading(true)

    await supabase.from("planner_tasks").delete().eq("id", task.id).eq("user_id", userId)

    onDelete(task.id)
    onOpenChange(false)
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as PlannerTask["priority"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {task && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as PlannerTask["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-transparent",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Start</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal bg-transparent",
                        !scheduledStart && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledStart ? format(scheduledStart, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={scheduledStart} onSelect={setScheduledStart} initialFocus />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 60"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform hover:scale-110",
                      color === c && "ring-2 ring-offset-2 ring-primary",
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex items-center justify-between">
          {task ? (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : task ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
