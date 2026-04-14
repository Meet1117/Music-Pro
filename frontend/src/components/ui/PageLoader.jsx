import { ChevronRight, Music2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Section ────────────────────────────────────────────────
export function Section({ title, subtitle, href, children, className = '' }) {
  const navigate = useNavigate()
  return (
    <section className={`mb-8 ${className}`}>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {href && (
          <button
            onClick={() => navigate(href)}
            className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-fuchsia-300 transition-colors"
          >
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

// ── Grid ──────────────────────────────────────────────────
export function SongGrid({ children, cols = 5 }) {
  const colMap = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  }
  return (
    <div className={`grid ${colMap[cols] || colMap[5]} gap-4`}>
      {children}
    </div>
  )
}

// ── PageLoader ────────────────────────────────────────────
export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center mesh-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
          style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}>
          <Music2 size={28} className="text-white" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-green-500"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
        <p className="text-[var(--text-muted)] text-sm">Loading...</p>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(192,38,211,0.3); }
          50% { box-shadow: 0 0 50px rgba(192,38,211,0.6); }
        }
      `}</style>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon: Icon = Music2, title = 'Nothing here', message = '', action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-5">
        <Icon size={32} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      {message && <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6">{message}</p>}
      {action && (
        <button onClick={action} className="btn-primary px-6 py-2.5 text-sm">
          {actionLabel || 'Action'}
        </button>
      )}
    </div>
  )
}

// ── ArtistCard ────────────────────────────────────────────
export function ArtistCard({ singer, onClick }) {
  return (
    <div
      className="glass rounded-2xl p-4 text-center cursor-pointer hover:bg-white/7 transition-all duration-300 group"
      onClick={onClick}
    >
      <div className="w-full aspect-square rounded-full overflow-hidden mb-3 mx-auto max-w-[120px] ring-2 ring-white/10 group-hover:ring-green-500/30 transition-all">
        <img
          src={singer.photo || '/placeholder-artist.jpg'}
          alt={singer.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{singer.name}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">
        {singer.follower_count?.toLocaleString()} followers
      </p>
      {singer.genre_name && (
        <span className="text-xs text-[var(--text-muted)]">{singer.genre_name}</span>
      )}
    </div>
  )
}

// ── PlaylistCard ──────────────────────────────────────────
export function PlaylistCard({ playlist, onClick }) {
  return (
    <div
      className="glass rounded-2xl p-3 cursor-pointer hover:bg-white/7 transition-all duration-300 group"
      onClick={onClick}
    >
      <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
        <img
          src={playlist.cover_image || '/uploads/placeholder.png'}
          alt={playlist.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {!playlist.is_public && (
          <div className="absolute top-2 right-2 glass rounded-lg px-1.5 py-0.5 text-xs text-white/60">
            Private
          </div>
        )}
      </div>
      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{playlist.title}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">
        {playlist.song_count || 0} songs
        {playlist.owner_name && ` · by ${playlist.owner_name}`}
      </p>
    </div>
  )
}

// ── GenreCard ─────────────────────────────────────────────
export function GenreCard({ genre, onClick }) {
  return (
    <div
      className="relative rounded-2xl p-5 cursor-pointer overflow-hidden aspect-video flex items-end group transition-transform duration-300 hover:-translate-y-1"
      style={{ background: `linear-gradient(135deg, ${genre.color}44, ${genre.color}22)`, border: `1px solid ${genre.color}33` }}
      onClick={onClick}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top right, ${genre.color}33, transparent 70%)` }} />
      <div className="absolute top-3 right-3 text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
        {genre.icon}
      </div>
      <div className="relative z-10">
        <p className="font-bold text-white">{genre.name}</p>
        {genre.song_count !== undefined && (
          <p className="text-xs text-white/60">{genre.song_count} songs</p>
        )}
      </div>
    </div>
  )
}
