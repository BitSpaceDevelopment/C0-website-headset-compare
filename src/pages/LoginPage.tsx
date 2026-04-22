import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/admin/devices')
    }
  }

  return (
    <div className="min-h-screen bg-background font-mono flex flex-col">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xs uppercase tracking-widest text-text font-bold">
          BSD <span className="text-muted">XR</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm border border-border bg-surface p-8">
          <div className="text-xs uppercase tracking-widest text-muted mb-1">Admin</div>
          <div className="text-xl uppercase tracking-widest text-text font-bold mb-8">Sign In</div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="text-xs text-red-500 border border-red-900 bg-red-950/30 px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-2 w-full justify-center">
              {loading ? 'Signing in...' : 'Sign In →'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
