"use client"

import type { AIConversation, ChatMessage, PlannerTask, QuizAttempt, QuizDefinition } from "@/lib/types"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  MessageCircle,
  Send,
  Plus,
  History,
  Loader2,
  Sparkles,
  Calendar,
  Target,
  Clock,
  BookOpen,
  ListChecks,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"

interface StudyContext {
  todaysTasks: PlannerTask[]
  recentQuizzes: (QuizAttempt & { quiz_definitions: QuizDefinition })[]
  weeklyStudyMinutes: number
}

interface StudyChatViewProps {
  userId: string
  initialConversations: AIConversation[]
  context: StudyContext
}

const QUICK_SUGGESTIONS = [
  { icon: Calendar, label: "What should I study today?", prompt: "What should I focus on studying today?" },
  { icon: TrendingUp, label: "Summarize my week", prompt: "Summarize my study progress this week" },
  { icon: ListChecks, label: "Create a revision plan", prompt: "Help me create a revision plan for my upcoming tasks" },
  { icon: Target, label: "Identify weak areas", prompt: "Based on my quiz history, what topics should I review?" },
]

export function StudyChatView({ userId, initialConversations, context }: StudyChatViewProps) {
  const [conversations, setConversations] = useState<AIConversation[]>(initialConversations)
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [includePlannerContext, setIncludePlannerContext] = useState(true)
  const [includeQuizContext, setIncludeQuizContext] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const startNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
    setInput("")
  }

  const loadConversation = (conv: AIConversation) => {
    setCurrentConversation(conv)
    setMessages(conv.messages)
    setShowHistory(false)
  }

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input.trim()
    if (!messageToSend || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: messageToSend,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: currentConversation?.id,
          message: userMessage.content,
          history: messages,
          includePlannerContext,
          includeQuizContext,
          context,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (data.conversationId) {
        if (!currentConversation) {
          const newConv: AIConversation = {
            id: data.conversationId,
            user_id: userId,
            mode: "chatbot",
            title: messageToSend.slice(0, 50) + (messageToSend.length > 50 ? "..." : ""),
            subject: null,
            topic: null,
            messages: [...messages, userMessage, assistantMessage],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setCurrentConversation(newConv)
          setConversations((prev) => [newConv, ...prev])
        } else {
          const updatedConv = {
            ...currentConversation,
            messages: [...messages, userMessage, assistantMessage],
            updated_at: new Date().toISOString(),
          }
          setCurrentConversation(updatedConv)
          setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)))
        }
      }
    } catch {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Study Chat</h1>
              <p className="text-sm text-muted-foreground">Your personal study assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="bg-transparent lg:hidden"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={startNewConversation} className="bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Context Chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            {context.todaysTasks.length} tasks today
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Target className="h-3 w-3" />
            {context.recentQuizzes.length} recent quizzes
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(context.weeklyStudyMinutes)} this week
          </Badge>
        </div>

        {/* Chat Container */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          {/* Context Options */}
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm text-muted-foreground">Include context from:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="planner-context"
                  checked={includePlannerContext}
                  onCheckedChange={setIncludePlannerContext}
                />
                <Label htmlFor="planner-context" className="text-sm">
                  Planner
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="quiz-context" checked={includeQuizContext} onCheckedChange={setIncludeQuizContext} />
                <Label htmlFor="quiz-context" className="text-sm">
                  Quizzes
                </Label>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles className="mb-4 h-12 w-12 text-primary/30" />
                <h3 className="mb-2 text-lg font-semibold">How can I help you study?</h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  I can help with time management, study planning, and provide personalized recommendations based on
                  your tasks and quiz performance.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend(suggestion.prompt)}
                      className="bg-transparent"
                    >
                      <suggestion.icon className="mr-2 h-4 w-4" />
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask me anything about your studies..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={2}
                className="min-h-[60px] resize-none"
              />
              <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="h-auto px-4">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className={cn("w-80 shrink-0 space-y-4", showHistory ? "block" : "hidden lg:block")}>
        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Today&apos;s Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {context.todaysTasks.length > 0 ? (
              <div className="space-y-2">
                {context.todaysTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.color }} />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {context.todaysTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{context.todaysTasks.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks due today</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Recent Quiz Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {context.recentQuizzes.length > 0 ? (
              <div className="space-y-2">
                {context.recentQuizzes.slice(0, 3).map((attempt) => {
                  const percentage = Math.round((attempt.score / attempt.total_questions) * 100)
                  return (
                    <div key={attempt.id} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[150px]">{attempt.quiz_definitions?.topic || "Quiz"}</span>
                      <Badge variant={percentage >= 70 ? "default" : "secondary"}>{percentage}%</Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent quizzes</p>
            )}
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              Recent Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className={cn(
                        "w-full rounded-lg border p-2 text-left transition-colors hover:bg-muted/50",
                        currentConversation?.id === conv.id && "border-primary bg-primary/5",
                      )}
                    >
                      <p className="truncate text-sm">{conv.title || "Untitled"}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.updated_at), "MMM d")}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No conversations yet</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted prose prose-sm max-w-none dark:prose-invert",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              code: ({ className, children, ...props }) => {
                const isInline = !className
                return isInline ? (
                  <code className="rounded bg-background/50 px-1 py-0.5 text-sm" {...props}>
                    {children}
                  </code>
                ) : (
                  <code
                    className={cn("block overflow-x-auto rounded bg-background/50 p-2 text-sm", className)}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
