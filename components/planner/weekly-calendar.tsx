"use client"

import type { PlannerTask } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isSameDay,
  isToday,
  startOfDay,
  setHours,
  setMinutes,
} from "date-fns"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WeeklyCalendarProps {
  tasks: PlannerTask[]
  onEditTask: (task: PlannerTask) => void
  onCreateTask: () => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function WeeklyCalendar({ tasks, onEditTask }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const goToToday = () => setCurrentWeek(new Date())

  const getTasksForDayAndHour = (day: Date, hour: number) => {
    return tasks.filter((task) => {
      if (task.scheduled_start) {
        const taskStart = new Date(task.scheduled_start)
        return isSameDay(taskStart, day) && taskStart.getHours() === hour
      }
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        return isSameDay(dueDate, day) && dueDate.getHours() === hour
      }
      return false
    })
  }

  const getUnscheduledTasks = (day: Date) => {
    return tasks.filter((task) => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        if (isSameDay(dueDate, day)) {
          const hours = dueDate.getHours()
          return hours === 0
        }
      }
      return false
    })
  }

  return (
    <Card className="flex h-full flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek} className="bg-transparent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} className="bg-transparent">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="bg-transparent">
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </h2>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-8 border-b">
        <div className="w-16 shrink-0 border-r p-2" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn("flex flex-col items-center border-r p-2 last:border-r-0", isToday(day) && "bg-primary/5")}
          >
            <span className="text-xs text-muted-foreground">{format(day, "EEE")}</span>
            <span
              className={cn(
                "mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-8">
          {/* Time Column */}
          <div className="w-16 shrink-0 border-r">
            {HOURS.map((hour) => (
              <div key={hour} className="relative h-12 border-b">
                <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                  {format(setMinutes(setHours(startOfDay(new Date()), hour), 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className={cn("border-r last:border-r-0", isToday(day) && "bg-primary/5")}>
              {HOURS.map((hour) => {
                const hourTasks = getTasksForDayAndHour(day, hour)
                const unscheduledTasks = hour === 0 ? getUnscheduledTasks(day) : []
                const allTasks = [...hourTasks, ...unscheduledTasks]

                return (
                  <div key={hour} className="relative h-12 border-b">
                    {allTasks.map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className={cn(
                          "absolute inset-x-1 cursor-pointer rounded px-1 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
                          idx > 0 && "mt-5",
                        )}
                        style={{
                          backgroundColor: task.color + "20",
                          color: task.color,
                          top: idx * 20,
                        }}
                      >
                        <span className="truncate block">{task.title}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
