import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Fill all fields'); return }
    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-[var(--text-muted)] text-sm mb-7">Sign in to your Music Pro account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="email"
            className="input pl-11"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            autoComplete="email"
            required
          />
        </div>

        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type={showPass ? 'text' : 'password'}
            className="input pl-11 pr-11"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="current-password"
            required
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            <><LogIn size={18} /> Sign In</>
          )}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-5 glass rounded-xl p-3 text-xs text-center">
        <p className="text-[var(--text-muted)] mb-1">Demo account:</p>
        <p className="text-fuchsia-300 font-mono">demo@melodia.com / demo123</p>
        <p className="text-fuchsia-300 font-mono mt-0.5">admin@melodia.com / admin123</p>
      </div>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-green-400 hover:text-fuchsia-300 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}
