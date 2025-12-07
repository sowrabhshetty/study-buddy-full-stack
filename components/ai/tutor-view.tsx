"use client"

import type { AIConversation, ChatMessage } from "@/lib/types"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Send,
  Plus,
  History,
  Loader2,
  Sparkles,
  BookOpen,
  ListChecks,
  MessageSquare,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"

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
  "General",
]

const RESPONSE_STYLES = [
  { value: "detailed", label: "Detailed Explanation" },
  { value: "short", label: "Short Answer" },
  { value: "step-by-step", label: "Step by Step" },
]

const QUICK_ACTIONS = [
  { icon: BookOpen, label: "Explain a concept", prompt: "Can you explain " },
  { icon: ListChecks, label: "Practice problems", prompt: "Generate practice problems for " },
  { icon: Lightbulb, label: "Summarize topic", prompt: "Summarize the key points of " },
  { icon: MessageSquare, label: "Ask a question", prompt: "" },
]

interface AiTutorViewProps {
  userId: string
  initialConversations: AIConversation[]
}

export function AiTutorView({ userId, initialConversations }: AiTutorViewProps) {
  const [conversations, setConversations] = useState<AIConversation[]>(initialConversations)
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [subject, setSubject] = useState("General")
  const [style, setStyle] = useState("detailed")
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
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
    setSubject(conv.subject || "General")
    setShowHistory(false)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          conversationId: currentConversation?.id,
          message: userMessage.content,
          subject,
          style,
          history: messages,
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

      // Update or create conversation
      if (data.conversationId) {
        if (!currentConversation) {
          const newConv: AIConversation = {
            id: data.conversationId,
            user_id: userId,
            mode: "tutor",
            title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
            subject,
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

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Tutor</h1>
              <p className="text-sm text-muted-foreground">Get personalized help with any subject</p>
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

        {/* Chat Container */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          {/* Options Bar */}
          <div className="flex items-center gap-4 border-b p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Subject:</span>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-36">
                  <SelectValue />
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Style:</span>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles className="mb-4 h-12 w-12 text-primary/30" />
                <h3 className="mb-2 text-lg font-semibold">Start a conversation</h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  Ask me anything about your studies. I can explain concepts, solve problems, generate practice
                  questions, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.prompt)}
                      className="bg-transparent"
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
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
                placeholder="Ask me anything..."
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
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="h-auto px-4">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar - History */}
      <Card className={cn("w-80 shrink-0", showHistory ? "block" : "hidden lg:block")}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      currentConversation?.id === conv.id && "border-primary bg-primary/5",
                    )}
                  >
                    <p className="truncate text-sm font-medium">{conv.title || "Untitled"}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {conv.subject && (
                        <Badge variant="secondary" className="text-xs">
                          {conv.subject}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.updated_at), "MMM d")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No conversations yet</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
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
              pre: ({ children }) => (
                <pre className="mb-2 overflow-x-auto rounded bg-background/50 p-2">{children}</pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
