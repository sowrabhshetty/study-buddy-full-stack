import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const type = url.searchParams.get("type")

  // Supabase sends token + type=signup for email confirmation
  if (token && type === "signup") {
    await supabase.auth.exchangeCodeForSession(token)
    return NextResponse.redirect("/dashboard")
  }

  return NextResponse.redirect("/auth/login")
}
