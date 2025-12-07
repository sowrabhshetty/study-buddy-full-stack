"use client"

import type { QuizDefinition, QuizAttempt } from "@/lib/types"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ClipboardList, Plus, Sparkles, Loader2, Clock, Target, Play, History } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

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
]

interface QuizzesViewProps {
  userId: string
  initialQuizzes: QuizDefinition[]
  initialAttempts: (QuizAttempt & { quiz_definitions: QuizDefinition })[]
}

export function QuizzesView({ userId, initialQuizzes, initialAttempts }: QuizzesViewProps) {
  const [quizzes, setQuizzes] = useState<QuizDefinition[]>(initialQuizzes)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate quiz form state
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [numQuestions, setNumQuestions] = useState("5")
  const [additionalContext, setAdditionalContext] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          topic: topic.trim(),
          subject,
          difficulty,
          numQuestions: Number.parseInt(numQuestions),
          additionalContext: additionalContext.trim(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setQuizzes([data.quiz, ...quizzes])
      setTopic("")
      setAdditionalContext("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Quizzes</h1>
            <p className="text-sm text-muted-foreground">Generate and take quizzes to test your knowledge</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-quizzes" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="my-quizzes" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            My Quizzes
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Quiz
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* My Quizzes Tab */}
        <TabsContent value="my-quizzes">
          {quizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No quizzes yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Generate your first quiz to start testing your knowledge
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Generate Quiz Tab */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate Quiz with AI
              </CardTitle>
              <CardDescription>
                Enter a topic and let AI generate a custom quiz to test your understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Photosynthesis, World War II, Linear Algebra"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
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
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numQuestions">Number of Questions</Label>
                  <Select value={numQuestions} onValueChange={setNumQuestions}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="context">Additional Context (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Add any specific details, notes, or areas you want to focus on..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={3}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleGenerateQuiz} disabled={!topic.trim() || isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {initialAttempts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>Your past quiz attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {initialAttempts.map((attempt) => (
                      <AttemptCard key={attempt.id} attempt={attempt} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No attempts yet</h3>
                <p className="text-sm text-muted-foreground">Take a quiz to see your history here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function QuizCard({ quiz }: { quiz: QuizDefinition }) {
  const difficultyColors = {
    easy: "bg-chart-2/10 text-chart-2",
    medium: "bg-chart-3/10 text-chart-3",
    hard: "bg-chart-5/10 text-chart-5",
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{quiz.title}</CardTitle>
          <Badge variant="secondary" className={difficultyColors[quiz.difficulty]}>
            {quiz.difficulty}
          </Badge>
        </div>
        <CardDescription className="line-clamp-1">{quiz.topic}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {quiz.subject && (
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {quiz.subject}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            {quiz.questions.length} questions
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Created {format(new Date(quiz.created_at), "MMM d, yyyy")}</p>
      </CardContent>
      <div className="border-t p-3">
        <Button asChild className="w-full" size="sm">
          <Link href={`/quizzes/${quiz.id}/attempt`}>
            <Play className="mr-2 h-4 w-4" />
            Start Quiz
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function AttemptCard({ attempt }: { attempt: QuizAttempt & { quiz_definitions: QuizDefinition } }) {
  const percentage = Math.round((attempt.score / attempt.total_questions) * 100)
  const scoreColor = percentage >= 70 ? "text-chart-2" : percentage >= 50 ? "text-chart-3" : "text-destructive"

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{attempt.quiz_definitions?.title || "Unknown Quiz"}</p>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {Math.round(attempt.time_taken / 60)}m
          </span>
          <span>{format(new Date(attempt.completed_at), "MMM d, yyyy")}</span>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-2xl font-bold ${scoreColor}`}>{percentage}%</p>
        <p className="text-sm text-muted-foreground">
          {attempt.score}/{attempt.total_questions}
        </p>
      </div>
    </div>
  )
}
