"use client"

import type React from "react"

import type { PlannerTask } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageCircle,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalTasks: number
  completedTasks: number
  totalSessions: number
  totalStudyMinutes: number
  quizzesTaken: number
  avgQuizScore: number
  aiConversations: number
}

interface DashboardOverviewProps {
  stats: DashboardStats
  recentTasks: PlannerTask[]
  upcomingTasks: PlannerTask[]
  userId: string
}

export function DashboardOverview({ stats, recentTasks, upcomingTasks }: DashboardOverviewProps) {
  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/planner">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/ai/tutor">
            <Brain className="mr-2 h-4 w-4" />
            Ask AI Tutor
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/quizzes">
            <ClipboardList className="mr-2 h-4 w-4" />
            Generate Quiz
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks Completed"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          description={`${completionRate}% completion rate`}
          icon={CheckCircle2}
          progress={completionRate}
        />
        <StatCard
          title="Study Time"
          value={formatDuration(stats.totalStudyMinutes)}
          description={`${stats.totalSessions} sessions`}
          icon={Clock}
        />
        <StatCard
          title="Quizzes Taken"
          value={stats.quizzesTaken.toString()}
          description={`${stats.avgQuizScore}% avg score`}
          icon={Target}
        />
        <StatCard
          title="AI Conversations"
          value={stats.aiConversations.toString()}
          description="Total interactions"
          icon={MessageCircle}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
              <CardDescription>Your next deadlines</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/planner">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                <Button asChild variant="link" size="sm" className="mt-2">
                  <Link href="/planner">Create your first task</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Access</CardTitle>
            <CardDescription>Jump into your study tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAccessLink href="/ai/tutor" icon={Brain} title="AI Tutor" description="Get help with any subject" />
            <QuickAccessLink
              href="/ai/chat"
              icon={MessageCircle}
              title="Study Chat"
              description="Ask questions & get recommendations"
            />
            <QuickAccessLink href="/quizzes" icon={ClipboardList} title="Quizzes" description="Test your knowledge" />
            <QuickAccessLink href="/analytics" icon={TrendingUp} title="Analytics" description="Track your progress" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
          <CardDescription>Your latest activities</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <TaskItem key={task.id} task={task} showCreatedAt />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link href="/planner">Get started with your first task</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
  progress?: number
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {progress !== undefined && <Progress value={progress} className="mt-4 h-1.5" />}
      </CardContent>
    </Card>
  )
}

function TaskItem({ task, showCreatedAt }: { task: PlannerTask; showCreatedAt?: boolean }) {
  const priorityColors = {
    low: "bg-chart-2/10 text-chart-2",
    medium: "bg-chart-3/10 text-chart-3",
    high: "bg-chart-5/10 text-chart-5",
    urgent: "bg-destructive/10 text-destructive",
  }

  const statusColors = {
    todo: "bg-muted text-muted-foreground",
    "in-progress": "bg-primary/10 text-primary",
    completed: "bg-chart-2/10 text-chart-2",
    cancelled: "bg-muted text-muted-foreground line-through",
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{task.title}</p>
          <Badge variant="secondary" className={statusColors[task.status]}>
            {task.status.replace("-", " ")}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {task.subject && <span>{task.subject}</span>}
          {task.subject && task.due_date && <span>•</span>}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), "MMM d")}
            </span>
          )}
          {showCreatedAt && (
            <>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
            </>
          )}
        </div>
      </div>
      <Badge variant="secondary" className={priorityColors[task.priority]}>
        {task.priority}
      </Badge>
    </div>
  )
}

function QuickAccessLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
