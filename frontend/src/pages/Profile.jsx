import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/api'
import { User, Mail, Edit3, Check, X, Heart, ListMusic, Mic2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, setAuth, token } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  })

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.data.data),
  })

  const updateMut = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: (res) => {
      const updated = { ...user, ...res.data.data }
      setAuth(updated, token)
      setEditing(false)
      toast.success('Profile updated!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Update failed'),
  })

  const stats = [
    { icon: Heart, label: 'Liked Songs', value: me?.liked_count || 0, color: '#ec4899' },
    { icon: ListMusic, label: 'Playlists', value: me?.playlist_count || 0, color: '#8b5cf6' },
    { icon: Mic2, label: 'Following', value: me?.following_count || 0, color: '#06b6d4' },
  ]

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.display_name.trim()) { toast.error('Display name required'); return }
    updateMut.mutate(form)
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>

      {/* Avatar + Info */}
      <div className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-green-500/30">
            {(editing ? form.avatar : user?.avatar) ? (
              <img src={editing ? form.avatar : user?.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-3xl font-bold text-white">
                {(user?.display_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>

          {/* Info / Edit */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Display Name</label>
                  <input className="input text-sm" value={form.display_name}
                    onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Avatar URL</label>
                  <input className="input text-sm" placeholder="https://..." value={form.avatar}
                    onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Bio</label>
                  <textarea className="input text-sm resize-none h-16" placeholder="Tell us about yourself..."
                    value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={updateMut.isPending}
                    className="btn-primary px-4 py-2 text-sm gap-1.5">
                    <Check size={14} /> {updateMut.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-ghost border border-white/10 px-4 py-2 text-sm gap-1.5 rounded-xl">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{user?.display_name || user?.username}</h2>
                  <button onClick={() => setEditing(true)} className="btn-icon w-7 h-7 text-[var(--text-muted)] hover:text-fuchsia-300">
                    <Edit3 size={14} />
                  </button>
                </div>
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mb-2">
                  <Mail size={13} /> {user?.email}
                </p>
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                  <User size={13} /> @{user?.username}
                </p>
                {user?.bio && <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{user?.bio}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {isLoading
          ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 text-center">
                <div className="skeleton w-10 h-10 rounded-xl mx-auto mb-2" />
                <div className="skeleton h-7 rounded w-1/2 mx-auto mb-2" />
                <div className="skeleton h-3 rounded w-3/4 mx-auto" />
              </div>
            ))
          : stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${color}22` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
              </div>
            ))}
      </div>

      {/* Role badge */}
      {user?.role === 'admin' && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin Account</p>
            <p className="text-xs text-[var(--text-muted)]">You have full admin access to MuSync</p>
          </div>
        </div>
      )}
    </div>
  )
}
