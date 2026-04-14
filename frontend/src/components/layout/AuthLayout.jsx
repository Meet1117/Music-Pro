import { Outlet, Link } from 'react-router-dom'
import Footer from './Footer'
import { Music2 } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl bg-green-600" style={{animation:'float 8s ease-in-out infinite'}} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl bg-emerald-600" style={{animation:'float 10s ease-in-out infinite reverse'}} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center glow-green">
              <Music2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">MuSynx</span>
          </Link>

          {/* Card */}
          <div className="glass-strong rounded-3xl p-8">
            <Outlet />
          </div>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            © 2024 MuSynx. Feel the Music.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
