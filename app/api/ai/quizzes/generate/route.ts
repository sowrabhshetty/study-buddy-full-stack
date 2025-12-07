import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import Groq from "groq-sdk"

const MODEL = "llama-3.1-8b-instant"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  explanation: z.string(),
})

const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, topic, subject, difficulty, numQuestions, additionalContext } =
      await request.json()

    if (userId !== user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const difficultyDescriptions = {
      easy: "basic understanding",
      medium: "moderate understanding",
      hard: "advanced reasoning",
    }

    const prompt = `
Generate JSON in this exact format:

{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": 0,
      "explanation": ""
    }
  ]
}

Rules:
- Exactly ${numQuestions} questions
- ALWAYS 4 options
- correctAnswer is index 0–3
- Explanation must justify the answer.

Topic: ${topic}
Subject: ${subject || "N/A"}
Difficulty: ${difficulty} (${difficultyDescriptions[difficulty]})
Context: ${additionalContext || "None"}
`

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "Output ONLY strict JSON. No markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    })

    const raw = completion.choices?.[0]?.message?.content || ""
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim()

    let parsed
    try {
      parsed = QuizSchema.parse(JSON.parse(cleaned))
    } catch (e) {
      console.error("Invalid JSON:", cleaned)
      throw new Error("Quiz JSON invalid")
    }

    const quizTitle = `${topic} Quiz${subject ? ` - ${subject}` : ""}`

    const { data: savedQuiz, error } = await supabase
      .from("quiz_definitions")
      .insert({
        user_id: user.id,
        title: quizTitle,
        topic,
        subject,
        difficulty,
        questions: parsed.questions,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ quiz: savedQuiz })
  } catch (error) {
    console.error("Quiz error:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
