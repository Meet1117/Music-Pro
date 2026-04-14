import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { Search, ArrowLeft, Users, ShieldCheck, User } from 'lucide-react'

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, q],
    queryFn: () => adminApi.users({ page, q, limit: 20 }).then(r => r.data.data),
  })

  const users = data?.users || []
  const total = data?.total || 0

  return (
    <div className="min-h-screen mesh-bg px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/admin" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white mb-1 transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={24} className="text-cyan-400" /> Users</h1>
        </div>
        <div className="text-sm text-[var(--text-muted)] glass rounded-xl px-4 py-2">{total.toLocaleString()} total users</div>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input className="input pl-9 text-sm" placeholder="Search users..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Email', 'Username', 'Role', 'Status', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(10).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {(user.display_name?.[0] || user.username[0]).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{user.display_name || user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">@{user.username}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${user.role === 'admin' ? 'bg-green-500/20 text-fuchsia-300' : 'bg-white/10 text-[var(--text-muted)]'}`}>
                          {user.role === 'admin' ? <ShieldCheck size={11} /> : <User size={11} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {user.is_active ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-[var(--text-muted)]">Page {page}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20}
                className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
