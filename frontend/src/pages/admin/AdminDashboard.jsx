import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
import {
  Users, Music2, Mic2, ListMusic, Play, Heart,
  TrendingUp, LayoutDashboard, ArrowLeft, Settings
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && <span className="text-xs text-emerald-400 font-medium">+{trend}%</span>}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{Number(value || 0).toLocaleString()}</p>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data.data),
  })

  const adminLinks = [
    { to: '/admin/songs', icon: Music2, label: 'Manage Songs', color: '#1db954' },
    { to: '/admin/singers', icon: Mic2, label: 'Manage Singers', color: '#118C3F' },
    { to: '/admin/users', icon: Users, label: 'Manage Users', color: '#0891b2' },
  ]

  return (
    <div className="min-h-screen mesh-bg px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back to App
            </button>
          </div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <LayoutDashboard size={28} /> Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="#06b6d4" />
          <StatCard icon={Music2} label="Songs" value={stats?.total_songs} color="#1db954" />
          <StatCard icon={Mic2} label="Singers" value={stats?.total_singers} color="#118C3F" />
          <StatCard icon={ListMusic} label="Playlists" value={stats?.total_playlists} color="#f59e0b" />
          <StatCard icon={Play} label="Total Plays" value={stats?.total_plays} color="#10b981" />
          <StatCard icon={Heart} label="Total Likes" value={stats?.total_likes} color="#ec4899" />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {adminLinks.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}
            className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/7 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-fuchsia-300 transition-colors">{label}</p>
              <p className="text-xs text-[var(--text-muted)]">Click to manage</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Top Songs */}
      {stats?.top_songs?.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" /> Top Songs by Plays
          </h2>
          <div className="space-y-3">
            {stats.top_songs.map((song, i) => (
              <div key={song.id} className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-muted)] w-5 text-right">{i + 1}</span>
                {song.thumbnail && <img src={song.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{song.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{song.singer_name}</p>
                </div>
                <div className="text-right text-xs text-[var(--text-muted)]">
                  <p className="text-white font-medium">{Number(song.play_count).toLocaleString()}</p>
                  <p>plays</p>
                </div>
                <div className="text-right text-xs text-[var(--text-muted)]">
                  <p className="text-emerald-400 font-medium">{Number(song.like_count).toLocaleString()}</p>
                  <p>likes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent users */}
      {stats?.recent_users?.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={18} className="text-cyan-400" /> Recent Users
          </h2>
          <div className="space-y-3">
            {stats.recent_users.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user.display_name?.[0] || user.username[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{user.display_name || user.username}</p>
                  <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
