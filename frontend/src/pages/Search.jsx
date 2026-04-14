import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { songsApi, singersApi, adminApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { SongRow, SongCard, SongRowSkeleton } from '../components/ui/SongCard'
import { Section, SongGrid, ArtistCard, GenreCard } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/PageLoader'
import { Search as SearchIcon, X, Music2, Mic2, Tag, Loader2 } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'

const TABS = ['songs', 'artists', 'genres', 'trending']

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'songs')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const debouncedQuery = useDebounce(query, 350)

  // Search results
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search', userId, debouncedQuery],
    queryFn: () => songsApi.search(debouncedQuery).then(r => r.data.data),
    enabled: debouncedQuery.length >= 2,
  })

  const { data: trending } = useQuery({
    queryKey: ['trending', userId],
    queryFn: () => songsApi.trending({ limit: 20 }).then(r => r.data.data),
    enabled: !debouncedQuery,
  })

  const { data: artists } = useQuery({
    queryKey: ['singers-list', userId],
    queryFn: () => singersApi.list({ limit: 20 }).then(r => r.data.data.singers),
    enabled: !debouncedQuery || activeTab === 'artists',
  })

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => adminApi.genres().then(r => r.data.data),
  })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const p = new URLSearchParams()
    if (debouncedQuery) p.set('q', debouncedQuery)
    if (activeTab !== 'songs') p.set('tab', activeTab)
    setParams(p)
  }, [debouncedQuery, activeTab])

  const songs = debouncedQuery ? searchResults : trending

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Search input */}
      <div className="relative max-w-xl mb-8">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          className="input pl-12 pr-10 text-base h-14 rounded-2xl"
          placeholder="Search songs, artists, genres..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveTab('songs') }}
          autoComplete="off"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
            <X size={16} />
          </button>
        )}
        {searching && (
          <Loader2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-400 animate-spin" />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
              activeTab === tab
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                : 'glass text-[var(--text-muted)] hover:text-white hover:bg-white/7'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'songs' && (
        <div>
          {debouncedQuery && (
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {searching ? 'Searching...' : `${songs?.length || 0} results for "${debouncedQuery}"`}
            </p>
          )}

          {!debouncedQuery && <h2 className="text-xl font-bold mb-4">🔥 Trending</h2>}

          {searching ? (
            <div className="space-y-1">
              {Array(6).fill(0).map((_, i) => <SongRowSkeleton key={i} />)}
            </div>
          ) : songs?.length > 0 ? (
            <div className="space-y-1">
              {songs.map((song, i) => (
                <SongRow key={song.id} song={song} index={i} queue={songs} showIndex={!debouncedQuery} />
              ))}
            </div>
          ) : debouncedQuery ? (
            <EmptyState
              icon={Music2}
              title="No songs found"
              message={`No results for "${debouncedQuery}". Try different keywords.`}
            />
          ) : null}
        </div>
      )}

      {activeTab === 'artists' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {(artists || [])
              .filter(a => !debouncedQuery || a.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
              .map(singer => (
                <ArtistCard
                  key={singer.id}
                  singer={singer}
                  onClick={() => navigate(`/singer/${singer.id}`)}
                />
              ))
            }
          </div>
          {artists?.length === 0 && (
            <EmptyState icon={Mic2} title="No artists found" />
          )}
        </div>
      )}

      {activeTab === 'genres' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(genres || []).map(genre => (
            <GenreCard
              key={genre.id}
              genre={genre}
              onClick={() => navigate(`/genre/${genre.id}`)}
            />
          ))}
        </div>
      )}

      {activeTab === 'trending' && (
        <div className="space-y-1">
          {(trending || []).map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={trending} showIndex />
          ))}
        </div>
      )}
    </div>
  )
}
