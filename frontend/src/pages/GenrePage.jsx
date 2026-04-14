import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { songsApi, adminApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { SongRow, SongCard } from '../components/ui/SongCard'
import { Section, SongGrid } from '../components/ui/PageLoader'
import { Play, ChevronLeft } from 'lucide-react'

export default function GenrePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayerStore()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => adminApi.genres().then(r => r.data.data),
  })

  const genre = genres?.find(g => g.id === parseInt(id))

  const { data: songs, isLoading } = useQuery({
    queryKey: ['genre-songs', userId, id],
    queryFn: () => songsApi.byGenre(id, { limit: 30 }).then(r => r.data.data),
    enabled: !!id,
  })

  const handlePlayAll = () => {
    if (!songs?.length) return
    playSong(songs[0], songs.slice(1))
  }

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div
        className="relative h-64 flex items-end overflow-hidden"
        style={{
          background: genre
            ? `linear-gradient(135deg, ${genre.color}55, ${genre.color}22, #121212)`
            : 'linear-gradient(135deg, #4a044e, #1e1b4b)',
        }}
      >
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute top-6 right-8 text-8xl opacity-20">{genre?.icon}</div>
        <div className="relative z-10 px-6 pb-8 max-w-7xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Genre</p>
          <h1 className="text-5xl font-bold text-white">{genre?.icon} {genre?.name || 'Genre'}</h1>
          <p className="text-white/50 mt-2 text-sm">{songs?.length || 0} songs</p>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {songs?.length > 0 && (
          <div className="mb-6">
            <button onClick={handlePlayAll} className="btn-primary px-8 py-3 gap-2">
              <Play size={18} fill="white" /> Play All
            </button>
          </div>
        )}

        <Section title="Songs">
          {isLoading ? (
            <div className="space-y-1">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 rounded w-1/2" />
                    <div className="skeleton h-3 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {(songs || []).map((song, i) => (
                <SongRow key={song.id} song={song} index={i} queue={songs} showIndex />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
