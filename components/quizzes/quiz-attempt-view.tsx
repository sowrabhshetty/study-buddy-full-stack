"use client"

import type { QuizDefinition } from "@/lib/types"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface QuizAttemptViewProps {
  quiz: QuizDefinition
  userId: string
}

type QuizState = "in-progress" | "review" | "completed"

export function QuizAttemptView({ quiz, userId }: QuizAttemptViewProps) {
  const router = useRouter()
  const [state, setState] = useState<QuizState>("in-progress")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null))
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = quiz.questions[currentIndex]
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100
  const answeredCount = answers.filter((a) => a !== null).length

  useEffect(() => {
    if (state === "in-progress") {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [state, startTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const handleSelectAnswer = (optionIndex: number) => {
    if (state !== "in-progress") return
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Calculate score
    let correct = 0
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++
      }
    })
    setScore(correct)

    // Save attempt to database
    const supabase = createClient()
    await supabase.from("quiz_attempts").insert({
      quiz_id: quiz.id,
      user_id: userId,
      answers,
      score: correct,
      total_questions: quiz.questions.length,
      time_taken: elapsed,
    })

    setState("completed")
    setIsSubmitting(false)
  }

  const handleReview = () => {
    setState("review")
    setCurrentIndex(0)
  }

  const handleRetake = () => {
    setAnswers(new Array(quiz.questions.length).fill(null))
    setCurrentIndex(0)
    setState("in-progress")
  }

  if (state === "completed") {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    const isPassing = percentage >= 70

    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div
              className={cn(
                "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full",
                isPassing ? "bg-chart-2/10" : "bg-chart-5/10",
              )}
            >
              <Trophy className={cn("h-10 w-10", isPassing ? "text-chart-2" : "text-chart-5")} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Quiz Complete!</h2>
            <p className="mb-6 text-muted-foreground">{quiz.title}</p>

            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted p-4">
                <p className={`text-3xl font-bold ${isPassing ? "text-chart-2" : "text-chart-5"}`}>{percentage}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-3xl font-bold">
                  {score}/{quiz.questions.length}
                </p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-3xl font-bold">{formatTime(elapsed)}</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleReview} className="bg-transparent">
                Review Answers
              </Button>
              <Button variant="outline" onClick={handleRetake} className="bg-transparent">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Quiz
              </Button>
              <Button onClick={() => router.push("/quizzes")}>Back to Quizzes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </div>
          {state === "review" && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Review Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>{answeredCount} answered</span>
          <span>{quiz.questions.length - answeredCount} remaining</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentIndex] === idx
              const isCorrect = idx === currentQuestion.correctAnswer
              const showResult = state === "review"

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={state === "review"}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                    state === "in-progress" && isSelected && "border-primary bg-primary/5",
                    state === "in-progress" && !isSelected && "hover:bg-muted/50",
                    showResult && isCorrect && "border-chart-2 bg-chart-2/10",
                    showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      isSelected && state === "in-progress" && "border-primary bg-primary text-primary-foreground",
                      showResult && isCorrect && "border-chart-2 bg-chart-2 text-white",
                      showResult && isSelected && !isCorrect && "border-destructive bg-destructive text-white",
                    )}
                  >
                    {showResult ? (
                      isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isSelected ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              )
            })}
          </div>

          {/* Explanation in review mode */}
          {state === "review" && currentQuestion.explanation && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Explanation:</p>
              <p className="mt-1 text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="bg-transparent">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {/* Question dots */}
        <div className="flex flex-wrap justify-center gap-1">
          {quiz.questions.map((_, idx) => {
            const isAnswered = answers[idx] !== null
            const isCurrent = idx === currentIndex
            let isCorrectInReview = false
            if (state === "review") {
              isCorrectInReview = answers[idx] === quiz.questions[idx].correctAnswer
            }

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  isCurrent && "ring-2 ring-primary ring-offset-2",
                  state === "in-progress" && isAnswered && "bg-primary",
                  state === "in-progress" && !isAnswered && "bg-muted",
                  state === "review" && isCorrectInReview && "bg-chart-2",
                  state === "review" && !isCorrectInReview && answers[idx] !== null && "bg-destructive",
                  state === "review" && answers[idx] === null && "bg-muted",
                )}
              />
            )
          })}
        </div>

        {currentIndex === quiz.questions.length - 1 && state === "in-progress" ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : state === "review" && currentIndex === quiz.questions.length - 1 ? (
          <Button onClick={() => router.push("/quizzes")}>Finish Review</Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
