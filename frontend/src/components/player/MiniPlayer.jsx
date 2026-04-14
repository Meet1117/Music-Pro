import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { songsApi } from '../../services/api'
import { AddToPlaylistModal } from '../ui/AddToPlaylistModal'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, Heart, ChevronUp, ListMusic, PlusCircle
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

function EqualizerBars() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="equalizer-bar" style={{ height: '100%', animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, isLoading, progress, duration, volume,
    isMuted, isShuffled, repeatMode,
    togglePlay, seek, setVolume, toggleMute,
    nextSong, prevSong, toggleShuffle, cycleRepeat,
    setExpanded, toggleLikeCurrentSong
  } = usePlayerStore()

  const { isLoggedIn } = useAuthStore()
  const [showVolume, setShowVolume] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)

  if (!currentSong) return null

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0
  const fmt = (s) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleLike = async () => {
    if (!isLoggedIn()) { toast.error('Sign in to like songs'); return }
    toggleLikeCurrentSong()
    try {
      await songsApi.like(currentSong.id)
    } catch {
      toggleLikeCurrentSong() // revert
    }
  }

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  const handleScrub = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    
    const update = (evt) => {
      const rect = el.getBoundingClientRect()
      let pct = (evt.clientX - rect.left) / rect.width
      pct = Math.max(0, Math.min(1, pct))
      seek(pct * duration)
    }

    const onMove = (evt) => update(evt)
    const onUp = (evt) => {
      update(evt)
      el.releasePointerCapture(evt.pointerId)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
    }
    
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    update(e.nativeEvent)
  }

  return (
    <div
      className="fixed bottom-0 right-0 z-40 glass-strong border-t border-white/5 md:left-[var(--sidebar-width)] left-0"
      style={{ height: 'var(--player-height)' }}
    >
      {/* Progress bar (thin top) */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 cursor-pointer group"
        onPointerDown={handleScrub}
        style={{ touchAction: 'none' }}
      >
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 relative"
          style={{ width: `${progressPct}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center h-full px-4 gap-4">
        {/* Song info */}
        <button
          className="flex items-center gap-3 flex-1 min-w-0 md:max-w-xs group"
          onClick={() => setExpanded(true)}
        >
          <div className="relative flex-shrink-0">
            <img
              src={currentSong.thumbnail || '/placeholder-album.jpg'}
              alt={currentSong.title}
              className="w-12 h-12 rounded-xl object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                <EqualizerBars />
              </div>
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-fuchsia-300 transition-colors">
              {currentSong.title}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">{currentSong.singer_name}</p>
          </div>
          <ChevronUp size={14} className="text-[var(--text-muted)] flex-shrink-0 ml-1" />
        </button>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1.5 flex-none md:flex-1">
          <div className="flex items-center gap-3">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`hidden md:flex items-center justify-center btn-icon w-8 h-8 ${isShuffled ? 'text-green-400' : 'text-[var(--text-muted)]'}`}
            >
              <Shuffle size={14} />
            </button>

            {/* Prev */}
            <button onClick={prevSong} className="hidden md:flex items-center justify-center btn-icon w-9 h-9 text-[var(--text-secondary)] hover:text-white">
              <SkipBack size={18} fill="currentColor" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-150 glow-green"
            >
              {isLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : isPlaying
                  ? <Pause size={18} fill="white" />
                  : <Play size={18} fill="white" className="translate-x-0.5" />
              }
            </button>

            {/* Next */}
            <button onClick={nextSong} className="flex items-center justify-center btn-icon w-9 h-9 text-[var(--text-secondary)] hover:text-white">
              <SkipForward size={18} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              className={`hidden md:flex items-center justify-center btn-icon w-8 h-8 ${repeatMode !== 'none' ? 'text-green-400' : 'text-[var(--text-muted)]'}`}
            >
              <RepeatIcon size={14} />
            </button>
          </div>

          {/* Progress bar desktop */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-[var(--text-muted)] w-8 text-right">{fmt(progress)}</span>
            <div className="flex-1 relative h-1 bg-white/10 rounded-full cursor-pointer group"
              onPointerDown={handleScrub}
              style={{ touchAction: 'none' }}
            >
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-[var(--text-muted)] w-8">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-none md:flex-1 justify-end md:max-w-xs">
          {/* Add to Playlist */}
          <button
            onClick={() => setShowAddToPlaylist(true)}
            className="btn-icon w-9 h-9 text-[var(--text-muted)] hover:text-white"
            title="Add to Playlist"
          >
            <PlusCircle size={16} />
          </button>
          
          {/* Like */}
          <button
            onClick={handleLike}
            className={`btn-icon w-9 h-9 ${currentSong.is_liked ? 'text-green-400' : 'text-[var(--text-muted)]'}`}
          >
            <Heart size={16} fill={currentSong.is_liked ? 'currentColor' : 'none'} />
          </button>

          {/* Volume */}
          <div className="relative hidden md:block" onMouseLeave={() => setShowVolume(false)}>
            <button
              onMouseEnter={() => setShowVolume(true)}
              onClick={toggleMute}
              className="btn-icon w-9 h-9 text-[var(--text-muted)] hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            {showVolume && (
              <div className="absolute bottom-full right-0 mb-2 glass rounded-xl p-3 w-10 flex flex-col items-center gap-2"
                onMouseEnter={() => setShowVolume(true)}
              >
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="range-slider h-24"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                    width: '4px',
                    height: '80px',
                    appearance: 'slider-vertical',
                    WebkitAppearance: 'slider-vertical',
                  }}
                />
                <span className="text-xs text-[var(--text-muted)]">{Math.round((isMuted ? 0 : volume) * 100)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddToPlaylist && <AddToPlaylistModal songId={currentSong.id} onClose={() => setShowAddToPlaylist(false)} />}
    </div>
  )
}
