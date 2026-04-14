import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' })
  const [showPass, setShowPass] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { toast.error('Fill all required fields'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    const result = await register(form)
    if (result.success) {
      toast.success('Account created! Welcome to Music Pro 🎵')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
      <p className="text-[var(--text-muted)] text-sm mb-7">Join Music Pro and start your music journey</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" className="input pl-10 text-sm" placeholder="Username *" value={form.username} onChange={set('username')} required />
          </div>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" className="input pl-10 text-sm" placeholder="Display name" value={form.display_name} onChange={set('display_name')} />
          </div>
        </div>

        <div className="relative">
          <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="email" className="input pl-11" placeholder="Email address *" value={form.email} onChange={set('email')} required />
        </div>

        <div className="relative">
          <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type={showPass ? 'text' : 'password'}
            className="input pl-11 pr-11"
            placeholder="Password * (min 6 chars)"
            value={form.password}
            onChange={set('password')}
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
          className="btn-primary w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </div>
          ) : (
            <><UserPlus size={18} /> Create Account</>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-green-400 hover:text-fuchsia-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
