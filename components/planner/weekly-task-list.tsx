"use client"

import type { PlannerTask } from "@/lib/types"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, Calendar, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, startOfWeek, addDays, isToday, isSameDay, isPast } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface WeeklyTaskListProps {
  tasks: PlannerTask[]
  onEditTask: (task: PlannerTask) => void
  onStatusChange: (taskId: string, status: PlannerTask["status"]) => void
  onDeleteTask: (taskId: string) => void
  userId: string
}

export function WeeklyTaskList({ tasks, onEditTask, onStatusChange, onDeleteTask, userId }: WeeklyTaskListProps) {
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const supabase = useMemo(() => createClient(), [])

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const toggleDay = (day: string) => {
    const newCollapsed = new Set(collapsedDays)
    if (newCollapsed.has(day)) {
      newCollapsed.delete(day)
    } else {
      newCollapsed.add(day)
    }
    setCollapsedDays(newCollapsed)
  }

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (task.due_date) {
        return isSameDay(new Date(task.due_date), day)
      }
      if (task.scheduled_start) {
        return isSameDay(new Date(task.scheduled_start), day)
      }
      return false
    })
  }

  const unscheduledTasks = tasks.filter((task) => !task.due_date && !task.scheduled_start)

  const handleToggleComplete = async (task: PlannerTask) => {
    const newStatus = task.status === "completed" ? "todo" : "completed"
    await supabase
      .from("planner_tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", task.id)
      .eq("user_id", userId)
    onStatusChange(task.id, newStatus)
  }

  const handleDelete = async (taskId: string) => {
    await supabase.from("planner_tasks").delete().eq("id", taskId).eq("user_id", userId)
    onDeleteTask(taskId)
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4 pb-4">
        {/* Week Days */}
        {weekDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd")
          const dayTasks = getTasksForDay(day)
          const isCollapsed = collapsedDays.has(dayKey)
          const today = isToday(day)
          const past = isPast(day) && !today

          return (
            <Card key={dayKey} className={cn(today && "ring-2 ring-primary", past && "opacity-70")}>
              <CardHeader className="cursor-pointer py-3" onClick={() => toggleDay(dayKey)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <CardTitle className="text-base">
                      {format(day, "EEEE")}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">{format(day, "MMM d")}</span>
                    </CardTitle>
                    {today && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Today
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{dayTasks.length} tasks</Badge>
                </div>
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="pt-0">
                  {dayTasks.length > 0 ? (
                    <div className="space-y-2">
                      {dayTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onEdit={() => onEditTask(task)}
                          onToggleComplete={() => handleToggleComplete(task)}
                          onDelete={() => handleDelete(task.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">No tasks scheduled</p>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {/* Unscheduled Tasks */}
        {unscheduledTasks.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Unscheduled</CardTitle>
                <Badge variant="secondary">{unscheduledTasks.length} tasks</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {unscheduledTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={() => onEditTask(task)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

function TaskItem({
  task,
  onEdit,
  onToggleComplete,
  onDelete,
}: {
  task: PlannerTask
  onEdit: () => void
  onToggleComplete: () => void
  onDelete: () => void
}) {
  const priorityColors = {
    low: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    medium: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    high: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    urgent: "bg-destructive/10 text-destructive border-destructive/30",
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
        task.status === "completed" && "opacity-60",
      )}
      style={{ borderLeftColor: task.color, borderLeftWidth: 3 }}
    >
      <Checkbox checked={task.status === "completed"} onCheckedChange={onToggleComplete} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", task.status === "completed" && "line-through")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.subject && <span>{task.subject}</span>}
          {task.estimated_duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimated_duration}m
            </span>
          )}
          {task.scheduled_start && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.scheduled_start), "h:mm a")}
            </span>
          )}
        </div>
      </div>
      <Badge variant="outline" className={priorityColors[task.priority]}>
        {task.priority}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
