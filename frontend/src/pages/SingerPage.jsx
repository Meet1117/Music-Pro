import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { singersApi, songsApi } from '../services/api'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { SongRow } from '../components/ui/SongCard'
import { Section } from '../components/ui/PageLoader'
import { Play, Users, Music2, ChevronLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SingerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayerStore()
  const { user, isLoggedIn } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const [following, setFollowing] = useState(null)

  const { data: singer, isLoading } = useQuery({
    queryKey: ['singer', userId, id],
    queryFn: () => singersApi.get(id).then(r => r.data.data),
    onSuccess: (s) => setFollowing(s.is_followed),
  })

  const { data: songs } = useQuery({
    queryKey: ['singer-songs', userId, id],
    queryFn: () => songsApi.bySinger(id, { limit: 20 }).then(r => r.data.data),
    enabled: !!id,
  })

  const isFollowing = following ?? singer?.is_followed

  const handleFollow = async () => {
    if (!isLoggedIn()) { toast.error('Sign in to follow artists'); return }
    const prev = isFollowing
    setFollowing(!prev)
    try { await singersApi.follow(id) }
    catch { setFollowing(prev) }
  }

  const handlePlayAll = () => {
    if (!songs?.length) return
    playSong(songs[0], songs.slice(1))
  }

  if (isLoading) return <SingerSkeleton />
  if (!singer) return <div className="px-6 py-8 text-[var(--text-muted)]">Artist not found</div>

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={singer.cover_image || singer.photo || '/placeholder-cover.jpg'}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.4)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]" />

        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors glass rounded-xl px-3 py-1.5">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="px-6 -mt-20 relative z-10 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-end mb-8">
          {/* Photo */}
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[var(--bg-primary)] shadow-2xl flex-shrink-0"
            style={{ boxShadow: '0 0 40px rgba(192,38,211,0.3)' }}>
            <img src={singer.photo || '/placeholder-artist.jpg'} alt={singer.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 mb-1">
              {singer.verified && <CheckCircle size={18} className="text-green-400" />}
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Artist</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{singer.name}</h1>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
              <span className="flex items-center gap-1">
                <Users size={14} /> {singer.follower_count?.toLocaleString()} followers
              </span>
              <span className="flex items-center gap-1">
                <Music2 size={14} /> {singer.song_count} songs
              </span>
              {singer.genre_name && <span>{singer.genre_name}</span>}
              {singer.country && <span>🌍 {singer.country}</span>}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handlePlayAll} className="btn-primary px-8 py-3 gap-2">
                <Play size={18} fill="white" /> Play All
              </button>
              {singer.name.toLowerCase() !== 'unknown' && singer.name.toLowerCase() !== 'unknown singer' && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-200 ${
                    isFollowing
                      ? 'border-green-500/40 text-fuchsia-300 bg-green-500/10 hover:bg-green-500/20'
                      : 'border-white/20 text-white hover:border-white/40 hover:bg-white/5'
                  }`}
                >
                  {isFollowing ? 'Following ✓' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {singer.bio && (
          <Section title="About">
            <div className="glass rounded-2xl p-5">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{singer.bio}</p>
            </div>
          </Section>
        )}

        {/* Songs */}
        <Section title="Songs">
          <div className="space-y-1">
            {(songs || []).map((song, i) => (
              <SongRow key={song.id} song={song} index={i} queue={songs} showIndex />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function SingerSkeleton() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="skeleton h-48 rounded-3xl mb-4 w-full" />
      <div className="flex gap-6">
        <div className="skeleton w-40 h-40 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-4">
          <div className="skeleton h-10 w-1/2 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
