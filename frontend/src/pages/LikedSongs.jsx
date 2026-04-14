import { useQuery } from '@tanstack/react-query'
import { songsApi } from '../services/api'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { SongRow, SongRowSkeleton } from '../components/ui/SongCard'
import { EmptyState } from '../components/ui/PageLoader'
import { Heart, Play } from 'lucide-react'

export default function LikedSongs() {
  const { playSong } = usePlayerStore()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'

  const { data, isLoading } = useQuery({
    queryKey: ['liked-songs', userId],
    queryFn: () => songsApi.liked({ limit: 100 }).then(r => r.data.data),
  })

  const songs = data?.songs || []

  const handlePlayAll = () => {
    if (!songs.length) return
    playSong(songs[0], songs.slice(1))
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-8">
        <div className="w-48 h-48 rounded-3xl flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #9d174d, #118C3F)' }}>
          <Heart size={64} className="text-white/80" fill="white" />
        </div>
        <div className="pb-2">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Playlist</p>
          <h1 className="text-4xl font-bold text-white mb-2">Liked Songs</h1>
          <p className="text-[var(--text-muted)] text-sm mb-5">{data?.total || 0} songs</p>
          {songs.length > 0 && (
            <button onClick={handlePlayAll} className="btn-primary px-8 py-3 gap-2">
              <Play size={18} fill="white" /> Play All
            </button>
          )}
        </div>
      </div>

      {/* Songs */}
      {isLoading ? (
        <div className="space-y-1">
          {Array(8).fill(0).map((_, i) => <SongRowSkeleton key={i} />)}
        </div>
      ) : songs.length > 0 ? (
        <div className="space-y-1">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={songs} showIndex />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No liked songs yet"
          message="Songs you like will appear here. Start exploring and hit that heart button!"
        />
      )}
    </div>
  )
}
