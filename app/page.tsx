import type React from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Brain, Calendar, MessageCircle, Sparkles, Target, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">StudyBuddy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-Powered Learning</span>
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Master Any Subject with Your <span className="text-primary">AI Study Companion</span>
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
              StudyBuddy combines intelligent tutoring, personalized quizzes, and smart planning to help you learn
              faster and retain more.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/auth/sign-up">
                  Start Learning Free
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t bg-muted/40 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold">Everything You Need to Excel</h2>
              <p className="text-muted-foreground">
                Powerful AI tools designed to transform how you study and retain information.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Brain}
                title="AI Tutor"
                description="Get personalized explanations and step-by-step solutions for any subject. Your 24/7 learning companion."
              />
              <FeatureCard
                icon={Target}
                title="Smart Quizzes"
                description="Generate custom quizzes on any topic. Track your progress and identify areas for improvement."
              />
              <FeatureCard
                icon={MessageCircle}
                title="Study Chatbot"
                description="Ask questions, get study tips, and receive personalized recommendations based on your learning goals."
              />
              <FeatureCard
                icon={Calendar}
                title="Advanced Planner"
                description="Organize your study sessions with a smart weekly planner that adapts to your schedule and goals."
              />
              <FeatureCard
                icon={Sparkles}
                title="Analytics & Insights"
                description="Track your study time, quiz performance, and learning patterns to optimize your study habits."
              />
              <FeatureCard
                icon={Zap}
                title="Focus Sessions"
                description="Start timed study sessions with built-in breaks to maximize concentration and prevent burnout."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold">Ready to Transform Your Learning?</h2>
              <p className="mb-8 text-muted-foreground">
                Join thousands of students who are already studying smarter with StudyBuddy.
              </p>
              <Button asChild size="lg">
                <Link href="/auth/sign-up">
                  Get Started for Free
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StudyBuddy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
