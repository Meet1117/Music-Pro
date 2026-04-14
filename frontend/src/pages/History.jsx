import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { songsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { SongRow, SongRowSkeleton } from '../components/ui/SongCard'
import { EmptyState } from '../components/ui/PageLoader'
import { History as HistoryIcon } from 'lucide-react'

export default function History() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'

  const { data: recent, isLoading } = useQuery({
    queryKey: ['recent-played', userId],
    queryFn: () => songsApi.recent({ limit: 50 }).then(r => r.data.data),
  })

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Listening History</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Resume tracks you played previously.</p>

      {isLoading ? (
        <div className="glass rounded-2xl p-2 md:p-3">
          <div className="space-y-1">
            {Array(8).fill(0).map((_, i) => <SongRowSkeleton key={i} />)}
          </div>
        </div>
      ) : !recent?.length ? (
        <EmptyState
          icon={HistoryIcon}
          title="No listening history yet"
          message="Play some songs and they will appear here."
          action={() => navigate('/search')}
          actionLabel="Explore songs"
        />
      ) : (
        <div className="glass rounded-2xl p-2 md:p-3">
          <div className="space-y-1">
            {recent.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} queue={recent} showIndex />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
