import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { songsApi } from '../services/api'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { SongRow } from '../components/ui/SongCard'
import { Section } from '../components/ui/PageLoader'
import {
  Play, Pause, Heart, Share2, Plus, Mic2, Music2,
  Clock, ListMusic, ChevronLeft, MoreHorizontal, PlusCircle
} from 'lucide-react'
import { AddToPlaylistModal } from '../components/ui/AddToPlaylistModal'
import { fmtDuration } from '../components/ui/SongCard'
import { copyToClipboard } from '../utils/clipboard'
import toast from 'react-hot-toast'
import { useState } from 'react'

function StatBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
      <Icon size={14} />
      <span>{label}</span>
    </div>
  )
}

export default function SongPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore()
  const { user, isLoggedIn } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const qc = useQueryClient()
  const [liked, setLiked] = useState(null)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)

  const { data: song, isLoading } = useQuery({
    queryKey: ['song', userId, id],
    queryFn: () => songsApi.get(id).then(r => r.data.data),
    onSuccess: (s) => setLiked(s.is_liked),
  })

  const { data: related } = useQuery({
    queryKey: ['related', userId, id],
    queryFn: () => songsApi.related(id, { limit: 10 }).then(r => r.data.data),
    enabled: !!id,
  })

  const isActive = currentSong?.id === parseInt(id)
  const isActuallyLiked = liked ?? song?.is_liked

  const handlePlay = () => {
    if (!song) return
    if (isActive) togglePlay()
    else playSong(song, related || [])
  }

  const handleLike = async () => {
    if (!isLoggedIn()) { toast.error('Sign in to like songs'); return }
    const prev = isActuallyLiked
    setLiked(!prev)
    try { await songsApi.like(song.id) }
    catch { setLiked(prev) }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/song/${id}`
    copyToClipboard(url)
    toast.success('Link copied to clipboard!')
  }

  if (isLoading) return <SongPageSkeleton />
  if (!song) return <div className="px-6 py-8 text-[var(--text-muted)]">Song not found</div>

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Bg blur */}
        <div className="absolute inset-0">
          <img src={song.thumbnail} alt="" className="w-full h-full object-cover scale-110"
            style={{ filter: 'blur(60px) brightness(0.25) saturate(1.5)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-primary)]" />
        </div>

        <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-8">
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Album Art */}
            <div className="flex-shrink-0">
              <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-3xl overflow-hidden shadow-2xl"
                style={{ boxShadow: '0 0 60px rgba(192,38,211,0.3), 0 30px 60px rgba(0,0,0,0.5)' }}>
                <img src={song.thumbnail || '/placeholder-album.jpg'} alt={song.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-2">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Song</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">{song.title}</h1>

              <button
                onClick={() => navigate(`/singer/${song.singer_id}`)}
                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-fuchsia-300 transition-colors mb-4 group"
              >
                {song.singer_photo && (
                  <img src={song.singer_photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                )}
                <span className="font-medium">{song.singer_name}</span>
              </button>

              <div className="flex flex-wrap gap-4 mb-6 text-sm text-[var(--text-muted)]">
                {song.album_title && <StatBadge icon={Music2} label={song.album_title} />}
                {song.genre_name && <StatBadge icon={ListMusic} label={song.genre_name} />}
                {song.duration && <StatBadge icon={Clock} label={fmtDuration(song.duration)} />}
                <StatBadge icon={Play} label={`${song.play_count?.toLocaleString()} plays`} />
                <StatBadge icon={Heart} label={`${song.like_count?.toLocaleString()} likes`} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handlePlay}
                  className="btn-primary px-8 py-3 text-base gap-2.5"
                >
                  {isActive && isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                  {isActive && isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  onClick={handleLike}
                  className={`btn-icon w-12 h-12 border ${isActuallyLiked ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20'}`}
                >
                  <Heart size={20} fill={isActuallyLiked ? 'currentColor' : 'none'} />
                </button>

                <button onClick={handleShare} className="btn-icon w-12 h-12 border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20">
                  <Share2 size={18} />
                </button>

                <button onClick={() => setShowAddToPlaylist(true)} className="btn-icon w-12 h-12 border border-white/10 text-[var(--text-muted)] hover:text-white hover:border-white/20" title="Add to Playlist">
                  <PlusCircle size={18} />
                </button>

                <button
                  onClick={() => { usePlayerStore.getState().addToQueue(song); toast.success('Added to queue') }}
                  className="btn-ghost border border-white/10 px-4 py-2.5 rounded-xl text-sm"
                >
                  <Plus size={16} /> Add to Queue
                </button>
              </div>

              {/* Tags */}
              {song.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {song.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 glass rounded-full text-[var(--text-muted)]">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-10 max-w-7xl mx-auto">
        {/* Lyrics */}
        {song.lyrics && (
          <Section title="Lyrics" className="mt-8">
            <div className="glass rounded-2xl p-6 max-h-80 overflow-y-auto">
              <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-8">
                {song.lyrics}
              </pre>
            </div>
          </Section>
        )}

        {/* Related Songs */}
        {related?.length > 0 && (
          <Section title="Related Songs" className="mt-8">
            <div className="space-y-1">
              {related.map((s, i) => (
                <SongRow key={s.id} song={s} index={i} queue={related} showIndex />
              ))}
            </div>
          </Section>
        )}
      </div>

      {showAddToPlaylist && <AddToPlaylistModal songId={song.id} onClose={() => setShowAddToPlaylist(false)} />}
    </div>
  )
}

function SongPageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex gap-8">
        <div className="skeleton w-64 h-64 rounded-3xl flex-shrink-0" />
        <div className="flex-1 space-y-4 pt-2">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-14 w-2/3 rounded" />
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-12 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
