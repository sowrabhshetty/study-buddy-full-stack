"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Clock, CheckCircle2, Flame, Trophy, BookOpen, Calendar } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

interface AnalyticsData {
  studyByDay: { date: string; day: string; minutes: number }[]
  subjectPerformance: { subject: string; percentage: number; quizCount: number; questionsAnswered: number }[]
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, { total: number; completed: number }>
  stats: {
    totalStudyMinutes: number
    totalSessions: number
    avgSessionLength: number
    completedTasks: number
    totalTasks: number
    quizzesTaken: number
    avgQuizScore: number
    currentStreak: number
    longestStreak: number
  }
}

const COLORS = {
  primary: "hsl(var(--primary))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
}

const STATUS_COLORS = {
  todo: "#94a3b8",
  "in-progress": "hsl(var(--primary))",
  completed: "hsl(var(--chart-2))",
  cancelled: "#cbd5e1",
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const { stats, studyByDay, subjectPerformance, tasksByStatus, tasksByPriority } = data

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const taskStatusData = Object.entries(tasksByStatus).map(([status, count]) => ({
    name: status.replace("-", " "),
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  }))

  const priorityData = Object.entries(tasksByPriority).map(([priority, data]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    completed: data.completed,
    pending: data.total - data.completed,
  }))

  // Get last 14 days for the chart
  const last14Days = studyByDay.slice(-14)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your study progress and performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} title="Total Study Time" value={formatDuration(stats.totalStudyMinutes)} />
        <StatCard
          icon={Flame}
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          subtitle={`Longest: ${stats.longestStreak} days`}
        />
        <StatCard
          icon={CheckCircle2}
          title="Tasks Completed"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          subtitle={`${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion`}
        />
        <StatCard
          icon={Trophy}
          title="Quiz Performance"
          value={`${stats.avgQuizScore}%`}
          subtitle={`${stats.quizzesTaken} quizzes taken`}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="study" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="study" className="gap-2">
            <Clock className="h-4 w-4" />
            Study Time
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <Calendar className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        {/* Study Time Tab */}
        <TabsContent value="study" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Study Time Area Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Study Time (Last 14 Days)</CardTitle>
                <CardDescription>Daily study minutes over the past two weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last14Days}>
                      <defs>
                        <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} min`, "Study Time"]}
                      />
                      <Area type="monotone" dataKey="minutes" stroke={COLORS.primary} fill="url(#colorMinutes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Session Stats</CardTitle>
                <CardDescription>Your study session metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <span className="font-semibold">{stats.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Session Length</span>
                  <span className="font-semibold">{formatDuration(stats.avgSessionLength)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Time</span>
                  <span className="font-semibold">{formatDuration(stats.totalStudyMinutes)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Goal */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Goal</CardTitle>
                <CardDescription>Track your weekly study target</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{formatDuration(stats.totalStudyMinutes)}</p>
                  <p className="text-sm text-muted-foreground">of 10h weekly goal</p>
                </div>
                <Progress value={Math.min((stats.totalStudyMinutes / 600) * 100, 100)} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  {stats.totalStudyMinutes >= 600
                    ? "Goal achieved! Great work!"
                    : `${formatDuration(600 - stats.totalStudyMinutes)} remaining`}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Task Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Overview of your tasks by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tasks by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Completion by Priority</CardTitle>
                <CardDescription>Task completion rates by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        dataKey="priority"
                        type="category"
                        width={80}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="completed" stackId="a" fill={COLORS.chart2} name="Completed" />
                      <Bar dataKey="pending" stackId="a" fill={COLORS.chart3} name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Subject Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance by Subject</CardTitle>
                <CardDescription>Your quiz scores across different subjects</CardDescription>
              </CardHeader>
              <CardContent>
                {subjectPerformance.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, "Score"]}
                        />
                        <Bar dataKey="percentage" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No quiz data available yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subject Breakdown */}
            {subjectPerformance.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Subject Breakdown</CardTitle>
                  <CardDescription>Detailed performance metrics by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectPerformance.map((subject) => (
                      <div key={subject.subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{subject.subject}</span>
                          <span className="text-sm text-muted-foreground">
                            {subject.quizCount} quizzes • {subject.questionsAnswered} questions
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={subject.percentage} className="h-2 flex-1" />
                          <span className="w-12 text-right text-sm font-medium">{subject.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Trend */}
            {subjectPerformance.length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 text-lg font-semibold">No quiz data yet</h3>
                  <p className="text-sm text-muted-foreground">Take some quizzes to see your performance analytics</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  value: string
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
