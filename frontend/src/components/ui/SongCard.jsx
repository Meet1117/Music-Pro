import { Play, Pause, Heart, MoreHorizontal, Plus, ListMusic, Share2, PlusCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { songsApi } from '../../services/api'
import { AddToPlaylistModal } from './AddToPlaylistModal'
import { copyToClipboard } from '../../utils/clipboard'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Format duration seconds → m:ss
export const fmtDuration = (s) => {
  if (!s) return '0:00'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ── SongCard (grid card with album art) ──────────────────
export function SongCard({ song, queue = [], className = '' }) {
  const { playSong, currentSong, isPlaying, addToQueue } = usePlayerStore()
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const isActive = currentSong?.id === song.id
  const [liked, setLiked] = useState(song.is_liked)
  const [hovering, setHovering] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)

  const handlePlay = (e) => {
    e.stopPropagation()
    if (isActive) usePlayerStore.getState().togglePlay()
    else playSong(song, queue)
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!isLoggedIn()) { toast.error('Sign in to like'); return }
    setLiked(!liked)
    try { await songsApi.like(song.id) }
    catch { setLiked(liked) }
  }

  return (
    <div
      className={clsx('group relative glass rounded-2xl p-3 cursor-pointer hover:bg-white/7 transition-all duration-300', className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => navigate(`/song/${song.id}`)}
    >
      {/* Album Art */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
        <img
          src={song.thumbnail || '/placeholder-album.jpg'}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay */}
        <div className={clsx('absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200',
          hovering || isActive ? 'opacity-100' : 'opacity-0')}>
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            style={{ boxShadow: '0 0 30px rgba(192,38,211,0.5)' }}
          >
            {isActive && isPlaying
              ? <Pause size={18} fill="white" className="text-white" />
              : <Play size={18} fill="white" className="text-white translate-x-0.5" />
            }
          </button>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 flex gap-0.5 items-end h-4">
            {[1,2,3].map(i => (
              <div key={i} className="equalizer-bar" style={{animationDelay:`${i*0.15}s`}} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5 pr-6">
        <p className={clsx('font-semibold text-sm truncate', isActive ? 'text-fuchsia-300' : 'text-[var(--text-primary)]')}>
          {song.title}
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">{song.singer_name}</p>
        {song.genre_name && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
            style={{ background: `${song.genre_color}22`, color: song.genre_color }}>
            {song.genre_name}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={clsx('absolute bottom-3 right-3 flex items-center gap-1 transition-opacity duration-200',
        liked || hovering ? 'opacity-100' : 'opacity-0')}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(true) }}
          className="btn-icon w-7 h-7 text-[var(--text-muted)] hover:text-white"
          title="Add to playlist"
        >
          <PlusCircle size={14} />
        </button>
        <button
          onClick={handleLike}
          className={clsx('btn-icon w-7 h-7', liked ? 'text-green-400' : 'text-[var(--text-muted)] hover:text-white')}
        >
          <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {showAddToPlaylist && <AddToPlaylistModal songId={song.id} onClose={() => setShowAddToPlaylist(false)} />}
    </div>
  )
}

// ── SongRow (list row) ────────────────────────────────────
export function SongRow({ song, index, queue = [], showIndex = false, showAlbum = false }) {
  const { playSong, currentSong, isPlaying, addToQueue } = usePlayerStore()
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const isActive = currentSong?.id === song.id
  const [liked, setLiked] = useState(song.is_liked)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const handlePlay = () => {
    if (isActive) usePlayerStore.getState().togglePlay()
    else playSong(song, queue)
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!isLoggedIn()) { toast.error('Sign in to like'); return }
    setLiked(!liked)
    try { await songsApi.like(song.id) }
    catch { setLiked(liked) }
  }

  const handleShare = (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/song/${song.id}`
    copyToClipboard(url)
    toast.success('Link copied!')
    setMenuOpen(false)
  }

  return (
    <div
      className={clsx('card-song group', isActive && 'active')}
      onClick={handlePlay}
    >
      {/* Index / Play indicator */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {isActive && isPlaying ? (
          <div className="flex gap-0.5 items-end h-4">
            {[1,2,3].map(i => (
              <div key={i} className="equalizer-bar" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : (
          <>
            <span className={clsx('text-sm group-hover:hidden', isActive ? 'text-green-400' : 'text-[var(--text-muted)]')}>
              {showIndex ? index + 1 : null}
            </span>
            <Play size={14} className="hidden group-hover:block text-white" fill="white" />
          </>
        )}
      </div>

      {/* Thumbnail */}
      <img
        src={song.thumbnail || '/placeholder-album.jpg'}
        alt={song.title}
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
      />

      {/* Title + Singer */}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', isActive ? 'text-fuchsia-300' : 'text-[var(--text-primary)]')}>
          {song.title}
        </p>
        <button
          className="text-xs text-[var(--text-muted)] hover:text-fuchsia-300 truncate transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate(`/singer/${song.singer_id}`) }}
        >
          {song.singer_name}
        </button>
      </div>

      {/* Genre */}
      {song.genre_name && (
        <span className="hidden md:block text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${song.genre_color}22`, color: song.genre_color }}>
          {song.genre_name}
        </span>
      )}

      {/* Duration */}
      <span className="text-xs text-[var(--text-muted)] hidden sm:block flex-shrink-0 w-10 text-right">
        {fmtDuration(song.duration)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={e => e.stopPropagation()}>
        <button onClick={() => setShowAddToPlaylist(true)}
          className="btn-icon w-8 h-8 text-[var(--text-muted)] hover:text-white" title="Add to playlist">
          <PlusCircle size={14} />
        </button>
        <button onClick={handleLike}
          className={clsx('btn-icon w-8 h-8', liked ? 'text-green-400' : 'text-[var(--text-muted)] hover:text-white')}>
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn-icon w-8 h-8 text-[var(--text-muted)]">
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 glass-strong rounded-xl py-1.5 w-44 z-20 shadow-2xl border border-white/10">
              <MenuItem icon={Plus} label="Add to Queue" onClick={() => { addToQueue(song); toast.success('Added to queue'); setMenuOpen(false) }} />
              <MenuItem icon={Share2} label="Share Song" onClick={handleShare} />
              <MenuItem icon={ListMusic} label="View Song" onClick={() => { navigate(`/song/${song.id}`); setMenuOpen(false) }} />
            </div>
          )}
        </div>
      </div>
      {showAddToPlaylist && <AddToPlaylistModal songId={song.id} onClose={() => setShowAddToPlaylist(false)} />}
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors">
      <Icon size={14} />
      {label}
    </button>
  )
}

// ── Skeleton Cards ────────────────────────────────────────
export function SongCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="skeleton aspect-square rounded-xl mb-3" />
      <div className="skeleton h-4 rounded mb-2 w-3/4" />
      <div className="skeleton h-3 rounded w-1/2" />
    </div>
  )
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="skeleton w-8 h-4 rounded" />
      <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3.5 rounded w-1/2" />
        <div className="skeleton h-3 rounded w-1/3" />
      </div>
      <div className="skeleton h-3 w-10 rounded" />
    </div>
  )
}
