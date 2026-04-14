// pages/PlaylistPage.jsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { playlistsApi } from '../services/api'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { SongRow } from '../components/ui/SongCard'
import { EmptyState } from '../components/ui/PageLoader'
import { Play, Lock, Globe, Music2, ChevronLeft, Trash2, Edit3, Share2 } from 'lucide-react'
import { fmtDuration } from '../components/ui/SongCard'
import { copyToClipboard } from '../utils/clipboard'
import toast from 'react-hot-toast'

export function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayerStore()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', userId, id],
    queryFn: () => playlistsApi.get(id).then(r => r.data.data),
  })

  const handlePlayAll = () => {
    if (!playlist?.songs?.length) return
    playSong(playlist.songs[0], playlist.songs.slice(1))
  }

  const handleShare = () => {
    const url = window.location.href
    copyToClipboard(url)
    toast.success('Playlist link copied to clipboard!')
  }

  const totalDur = playlist?.songs?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0
  const isOwner = user?.id === playlist?.user_id

  if (isLoading) return <div className="px-6 py-8"><div className="skeleton h-64 rounded-3xl" /></div>
  if (!playlist) return <div className="px-6 py-8 text-[var(--text-muted)]">Playlist not found</div>

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
        <div className="w-52 h-52 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 bg-gradient-to-br from-green-900 to-emerald-900">
          <img src={playlist.cover_image || '/uploads/placeholder.png'} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 pt-2">
          <div className="flex items-center gap-2 mb-2">
            {playlist.is_public ? <Globe size={14} className="text-[var(--text-muted)]" /> : <Lock size={14} className="text-[var(--text-muted)]" />}
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Playlist</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{playlist.title}</h1>
          {playlist.description && <p className="text-[var(--text-muted)] text-sm mb-3">{playlist.description}</p>}
          <p className="text-sm text-[var(--text-muted)] mb-5">
            by {playlist.owner_name} · {playlist.songs?.length} songs · {fmtDuration(totalDur)}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={handlePlayAll} disabled={!playlist.songs?.length} className="btn-primary px-8 py-3 gap-2">
              <Play size={18} fill="white" /> Play All
            </button>
            <button onClick={handleShare} className="btn-icon w-12 h-12 glass hover:bg-white/10" title="Share Playlist">
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Songs */}
      {playlist.songs?.length > 0 ? (
        <div className="space-y-1">
          {playlist.songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={playlist.songs} showIndex />
          ))}
        </div>
      ) : (
        <EmptyState icon={Music2} title="No songs yet" message="This playlist is empty." />
      )}
    </div>
  )
}

export default PlaylistPage
