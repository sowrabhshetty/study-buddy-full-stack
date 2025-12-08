"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, User } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!displayName.trim()) return setError("Enter your display name")
    if (password !== confirmPassword) return setError("Passwords do not match")
    if (password.length < 6) return setError("Password must be at least 6 characters")

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpError) return setError(signUpError.message)

    // ❗ Important: Supabase does NOT log in user until email confirmed
    if (data?.user) {
      alert("Account created! Check your email and click the confirmation link before logging in.")
      router.push("/auth/login")
      return
    }

    setError("Unexpected error occurred. Please try again.")
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Create Account
          </Button>

          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
