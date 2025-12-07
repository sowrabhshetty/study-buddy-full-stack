import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import type {
  ChatMessage,
  PlannerTask,
  QuizAttempt,
  QuizDefinition,
} from "@/lib/types"

const MODEL = "llama-3.1-8b-instant"

interface StudyContext {
  todaysTasks: PlannerTask[]
  recentQuizzes: (QuizAttempt & { quiz_definitions: QuizDefinition })[]
  weeklyStudyMinutes: number
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const {
      userId,
      conversationId,
      message,
      history,
      includePlannerContext,
      includeQuizContext,
      context,
    } = await request.json()

    if (userId !== user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Build context
    let contextInfo = ""

    if (includePlannerContext && context.todaysTasks.length > 0) {
      contextInfo += `\n\nToday's Tasks:\n${context.todaysTasks
        .map(
          (t) =>
            `- ${t.title} (${t.subject || "No subject"}, Priority: ${t.priority}, Status: ${t.status})`
        )
        .join("\n")}`
    }

    if (includeQuizContext && context.recentQuizzes.length > 0) {
      contextInfo += `\n\nRecent Quiz Performance:\n${context.recentQuizzes
        .map((q) => {
          const p = Math.round((q.score / q.total_questions) * 100)
          return `- ${q.quiz_definitions?.topic || "Unknown"}: ${p}% (${q.score}/${q.total_questions})`
        })
        .join("\n")}`
    }

    contextInfo += `\n\nStudy Time This Week: ${context.weeklyStudyMinutes} minutes`

    const systemPrompt = `You are a helpful study assistant. Use the following context:\n${contextInfo}
Guidelines:
- Be supportive and helpful
- Provide actionable advice
- Reference tasks and quizzes
- Use markdown
- Keep explanations concise`

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response."

    const newMessages = [
      ...history,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ]

    let savedId = conversationId

    if (conversationId) {
      await supabase
        .from("ai_conversations")
        .update({
          messages: newMessages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id)
    } else {
      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          mode: "chatbot",
          title: message.slice(0, 50),
          messages: newMessages,
        })
        .select()
        .single()

      savedId = newConv?.id
    }

    return NextResponse.json({
      response: reply,
      conversationId: savedId,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
