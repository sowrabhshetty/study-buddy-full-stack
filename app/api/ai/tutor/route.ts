import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import type { ChatMessage } from "@/lib/types"

const MODEL = "llama-3.1-8b-instant"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, conversationId, message, subject, style, history } =
      await request.json()

    if (userId !== user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let styleInstruction = ""
    if (style === "short")
      styleInstruction = "Give concise answers."
    else if (style === "step-by-step")
      styleInstruction = "Break your explanation into clear steps."
    else
      styleInstruction = "Give detailed explanations with examples."

    const systemPrompt = `You are an expert tutor for ${subject}.
${styleInstruction}`

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
      temperature: 0.6,
    })

    const reply =
      completion.choices?.[0]?.message?.content || "I'm not sure."

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
          mode: "tutor",
          subject,
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
    console.error("Tutor error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
