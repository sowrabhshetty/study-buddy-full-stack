export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface PlannerTask {
  id: string
  user_id: string
  title: string
  description: string | null
  subject: string | null
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in-progress" | "completed" | "cancelled"
  due_date: string | null
  estimated_duration: number | null
  actual_duration: number | null
  scheduled_start: string | null
  scheduled_end: string | null
  color: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  task_id: string | null
  subject: string | null
  start_time: string
  end_time: string | null
  duration: number | null
  notes: string | null
  focus_score: number | null
  created_at: string
}

export interface AIConversation {
  id: string
  user_id: string
  mode: "tutor" | "chatbot" | "quiz-help"
  title: string | null
  subject: string | null
  topic: string | null
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface QuizDefinition {
  id: string
  user_id: string
  title: string
  topic: string
  subject: string | null
  difficulty: "easy" | "medium" | "hard"
  questions: QuizQuestion[]
  source: "manual" | "ai-generated"
  created_at: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  answers: number[]
  score: number
  total_questions: number
  time_taken: number
  completed_at: string
}
