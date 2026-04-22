import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/admin/login')
      } else {
        setUser(data.user)
      }
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin/login')
      else setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted uppercase tracking-widest font-mono">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-mono flex flex-col">
      {/* Top bar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xs uppercase tracking-widest text-text font-bold">
            BSD <span className="text-muted">XR</span>
          </Link>
          <span className="text-border-light">|</span>
          <span className="text-xs uppercase tracking-widest text-muted">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted hidden md:block">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-48 border-r border-border flex-shrink-0 pt-6">
          <nav className="flex flex-col">
            {[
              { to: '/admin/devices', label: 'Devices' },
              { to: '/admin/specs',   label: 'Spec Structure' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-6 py-3 text-xs uppercase tracking-widest border-l-2 transition-colors ${
                    isActive
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-text hover:border-border-light'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
