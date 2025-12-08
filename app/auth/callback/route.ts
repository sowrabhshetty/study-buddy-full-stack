import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)

  // Supabase sends ?code= for email confirmation & sign-in links
  const code = url.searchParams.get("code")

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
    }

    console.error("Auth exchange error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=invalid-code`)
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)
}
