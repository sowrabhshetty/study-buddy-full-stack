import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)

  const code = url.searchParams.get("code")
  const type = url.searchParams.get("type")

  if (code && type === "signup") {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Session exchange failed:", error.message)
      return NextResponse.redirect("/auth/login?error=verification_failed")
    }

    return NextResponse.redirect("/dashboard")
  }

  return NextResponse.redirect("/auth/login")
}
