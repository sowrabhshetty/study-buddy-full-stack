"use client"

import type { PlannerTask, StudySession } from "@/lib/types"
import { useState } from "react"
import { WeeklyTaskList } from "./weekly-task-list"
import { WeeklyCalendar } from "./weekly-calendar"
import { ActiveSessionPanel } from "./active-session-panel"
import { TaskEditorModal } from "./task-editor-modal"
import { Button } from "@/components/ui/button"
import { Plus, List, Calendar } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlannerViewProps {
  initialTasks: PlannerTask[]
  userId: string
  activeSession: StudySession | null
}

export function PlannerView({ initialTasks, userId, activeSession: initialSession }: PlannerViewProps) {
  const [tasks, setTasks] = useState<PlannerTask[]>(initialTasks)
  const [activeSession, setActiveSession] = useState<StudySession | null>(initialSession)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null)
  const [view, setView] = useState<"list" | "calendar">("list")

  const handleCreateTask = () => {
    setEditingTask(null)
    setIsEditorOpen(true)
  }

  const handleEditTask = (task: PlannerTask) => {
    setEditingTask(task)
    setIsEditorOpen(true)
  }

  const handleTaskSaved = (savedTask: PlannerTask) => {
    if (editingTask) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? savedTask : t)))
    } else {
      setTasks([savedTask, ...tasks])
    }
    setIsEditorOpen(false)
    setEditingTask(null)
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  const handleTaskStatusChange = (taskId: string, status: PlannerTask["status"]) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Planner</h1>
            <p className="text-muted-foreground">Organize your study schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
              <TabsList className="bg-background">
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "list" ? (
            <WeeklyTaskList
              tasks={tasks}
              onEditTask={handleEditTask}
              onStatusChange={handleTaskStatusChange}
              onDeleteTask={handleTaskDeleted}
              userId={userId}
            />
          ) : (
            <WeeklyCalendar tasks={tasks} onEditTask={handleEditTask} onCreateTask={handleCreateTask} />
          )}
        </div>
      </div>

      {/* Right Sidebar - Active Session */}
      <ActiveSessionPanel
        session={activeSession}
        tasks={tasks}
        userId={userId}
        onSessionStart={setActiveSession}
        onSessionEnd={() => setActiveSession(null)}
      />

      {/* Task Editor Modal */}
      <TaskEditorModal
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        task={editingTask}
        userId={userId}
        onSave={handleTaskSaved}
        onDelete={handleTaskDeleted}
      />
    </div>
  )
}
