import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { songsApi, singersApi, adminApi } from '../services/api'
import { SongCard, SongCardSkeleton, SongRow } from '../components/ui/SongCard'
import { Section, SongGrid, ArtistCard, GenreCard } from '../components/ui/PageLoader'
import { Play, Heart, TrendingUp } from 'lucide-react'

export default function Home() {
  const { user, isLoggedIn } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const navigate = useNavigate()

  const { data: trending, isLoading: loadingTrend } = useQuery({
    queryKey: ['trending', userId],
    queryFn: () => songsApi.trending({ limit: 10 }).then(r => r.data.data),
  })

  const { data: recommended } = useQuery({
    queryKey: ['recommended', userId],
    queryFn: () => songsApi.recommended({ limit: 10 }).then(r => r.data.data),
    enabled: isLoggedIn(),
  })

  const { data: topSingers } = useQuery({
    queryKey: ['top-singers'],
    queryFn: () => singersApi.top({ limit: 8 }).then(r => r.data.data),
  })

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => adminApi.genres().then(r => r.data.data),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Hero greeting */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-1">
          {isLoggedIn() ? `${greeting()}, ${user?.display_name?.split(' ')[0] || user?.username} 👋` : 'Welcome to MuSynx'}
        </h1>
        <p className="text-[var(--text-muted)]">
          {isLoggedIn() ? 'Your personalized music experience awaits.' : 'Discover and stream premium music.'}
        </p>
      </div>

      {/* Quick actions */}
      {isLoggedIn() && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Liked Songs', icon: Heart, color: '#ec4899', path: '/liked' },
            { label: 'Trending Now', icon: TrendingUp, color: '#f59e0b', path: '/search?tab=trending' },
            { label: 'My Playlists', icon: Play, color: '#8b5cf6', path: '/my-playlists' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 glass rounded-xl px-4 py-3 hover:bg-white/7 transition-all duration-200 text-left group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}22` }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-white transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Recommended for You */}
      {isLoggedIn() && recommended?.length > 0 && (
        <Section title="Recommended for You" subtitle="Based on your taste">
          <SongGrid cols={5}>
            {recommended.slice(0, 5).map(song => (
              <SongCard key={song.id} song={song} queue={recommended} />
            ))}
          </SongGrid>
        </Section>
      )}

      {/* Trending */}
      <Section title="🔥 Trending Now" href="/search?tab=trending">
        {loadingTrend ? (
          <SongGrid cols={5}>
            {Array(5).fill(0).map((_, i) => <SongCardSkeleton key={i} />)}
          </SongGrid>
        ) : (
          <SongGrid cols={5}>
            {(trending || []).slice(0, 5).map(song => (
              <SongCard key={song.id} song={song} queue={trending} />
            ))}
          </SongGrid>
        )}
      </Section>

      {/* Trending list */}
      {trending?.length > 5 && (
        <Section title="Popular Songs" subtitle="Most played this week">
          <div className="space-y-1">
            {trending.slice(5, 10).map((song, i) => (
              <SongRow key={song.id} song={song} index={i} queue={trending} showIndex />
            ))}
          </div>
        </Section>
      )}

      {/* Top Artists */}
      {topSingers?.length > 0 && (
        <Section title="Top Artists" href="/search?tab=artists">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {topSingers.slice(0, 8).map(singer => (
              <ArtistCard
                key={singer.id}
                singer={singer}
                onClick={() => navigate(`/singer/${singer.id}`)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Browse by Genre */}
      {genres?.length > 0 && (
        <Section title="Browse by Genre">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {genres.slice(0, 10).map(genre => (
              <GenreCard
                key={genre.id}
                genre={genre}
                onClick={() => navigate(`/genre/${genre.id}`)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
