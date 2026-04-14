import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { songsApi, singersApi, playlistsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { SongRow, SongRowSkeleton } from '../components/ui/SongCard'
import { Section, ArtistCard, PlaylistCard } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/PageLoader'
import { Library as LibIcon } from 'lucide-react'

export default function Library() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'

  const { data: recent, isLoading: loadingRecent } = useQuery({
    queryKey: ['recent-played', userId],
    queryFn: () => songsApi.recent({ limit: 10 }).then(r => r.data.data),
  })

  const { data: followed, isLoading: loadingFollowed } = useQuery({
    queryKey: ['followed-singers', userId],
    queryFn: () => singersApi.followed().then(r => r.data.data),
  })

  const { data: playlists, isLoading: loadingPlaylists } = useQuery({
    queryKey: ['my-playlists', userId],
    queryFn: () => playlistsApi.my().then(r => r.data.data),
  })

  const isLoading = loadingRecent || loadingFollowed || loadingPlaylists

  const hasContent = recent?.length || followed?.length || playlists?.length

  if (isLoading) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Your Library</h1>

        <Section title="Recently Played" subtitle="Jump back in">
          <div className="space-y-1">
            {Array(6).fill(0).map((_, i) => <SongRowSkeleton key={i} />)}
          </div>
        </Section>

        <Section title="Artists You Follow" href="/search?tab=artists">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 text-center">
                <div className="skeleton w-full aspect-square rounded-full mb-3 mx-auto max-w-[120px]" />
                <div className="skeleton h-3.5 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Your Playlists" href="/my-playlists">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-3">
                <div className="skeleton aspect-square rounded-xl mb-3" />
                <div className="skeleton h-4 rounded mb-2 w-3/4" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
            ))}
          </div>
        </Section>
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Your Library</h1>
        <EmptyState
          icon={LibIcon}
          title="Your library is empty"
          message="Start listening, following artists, and creating playlists to fill your library."
        />
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Your Library</h1>

      {recent?.length > 0 && (
        <Section title="Recently Played" subtitle="Jump back in">
          <div className="space-y-1">
            {recent.slice(0, 8).map((song, i) => (
              <SongRow key={song.id} song={song} index={i} queue={recent} showIndex />
            ))}
          </div>
        </Section>
      )}

      {followed?.length > 0 && (
        <Section title="Artists You Follow" href="/search?tab=artists">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {followed.map(singer => (
              <ArtistCard key={singer.id} singer={singer} onClick={() => navigate(`/singer/${singer.id}`)} />
            ))}
          </div>
        </Section>
      )}

      {playlists?.length > 0 && (
        <Section title="Your Playlists" href="/my-playlists">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map(pl => (
              <PlaylistCard key={pl.id} playlist={pl} onClick={() => navigate(`/playlist/${pl.id}`)} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
