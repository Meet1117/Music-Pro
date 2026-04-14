import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { songsApi } from '../../services/api'
import {
  X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Repeat1, Heart, Share2, ListMusic,
  ChevronDown, Mic2, PlusCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddToPlaylistModal } from '../ui/AddToPlaylistModal'
import { copyToClipboard } from '../../utils/clipboard'
import toast from 'react-hot-toast'

export default function ExpandedPlayer() {
  const {
    currentSong, queue, isPlaying, isLoading, progress, duration, volume,
    isMuted, isShuffled, repeatMode,
    togglePlay, seek, setVolume, toggleMute,
    nextSong, prevSong, toggleShuffle, cycleRepeat,
    setExpanded, toggleLikeCurrentSong
  } = usePlayerStore()
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const [showLyrics, setShowLyrics] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0
  const fmt = (s) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleLike = async () => {
    if (!isLoggedIn()) { toast.error('Sign in to like songs'); return }
    toggleLikeCurrentSong()
    try { await songsApi.like(currentSong.id) }
    catch { toggleLikeCurrentSong() }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/song/${currentSong.id}`
    copyToClipboard(url)
    toast.success('Link copied!')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setExpanded(false)
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!currentSong) return null
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
    <div className="fixed inset-0 z-50 flex">
      {/* Blurred BG */}
      <div className="absolute inset-0">
        <img
          src={currentSong.thumbnail || '/placeholder-album.jpg'}
          alt=""
          className="w-full h-full object-cover scale-110"
          style={{ filter: 'blur(80px) brightness(0.3) saturate(1.5)' }}
        />
        <div className="absolute inset-0 bg-[#121212]/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full h-full pb-8 md:pb-0 overflow-y-auto overflow-x-hidden md:overflow-visible custom-scrollbar">

        {/* Main player */}
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 md:py-8 max-w-lg mx-auto w-full min-h-[min-content]">
          
          {/* Top bar */}
          <div className="w-full flex items-center justify-between mb-4 md:mb-0">
            <button onClick={() => setExpanded(false)} className="btn-icon w-10 h-10 text-white/60 hover:text-white">
              <ChevronDown size={22} />
            </button>
            <div className="text-center">
              <p className="text-xs text-white/50 uppercase tracking-widest">Now Playing</p>
            </div>
            <button onClick={() => setShowQueue(!showQueue)} className={`btn-icon w-10 h-10 ${showQueue ? 'text-green-400' : 'text-white/60 hover:text-white'}`}>
              <ListMusic size={20} />
            </button>
          </div>

          {/* Album Art */}
          <div className="mb-6 md:my-8 relative shrink-0">
            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl"
              style={{ boxShadow: '0 0 80px rgba(192,38,211,0.4), 0 40px 60px rgba(0,0,0,0.6)' }}>
              <img
                src={currentSong.thumbnail || '/placeholder-album.jpg'}
                alt={currentSong.title}
                className={`w-full h-full object-cover transition-all duration-500 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />
            </div>
            {/* Vinyl ring */}
            <div
              className={`absolute inset-0 rounded-full border-4 border-white/5 m-8 ${isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '12s' }}
            />
          </div>

          {/* Song info */}
          <div className="w-full text-center px-4 mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">{currentSong.title}</h2>
            <button
              onClick={() => { navigate(`/singer/${currentSong.singer_id}`); setExpanded(false) }}
              className="text-[var(--text-muted)] hover:text-fuchsia-300 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <Mic2 size={13} />
              <span className="text-sm truncate">{currentSong.singer_name}</span>
            </button>
          </div>

          {/* Progress */}
          <div className="w-full space-y-2 mb-4 md:mb-6">
            <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
              onPointerDown={handleScrub}
              style={{ touchAction: 'none' }}
            >
              <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-none"
                style={{ width: `${progressPct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg -translate-x-1/2"
                style={{ left: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-white/40">
              <span>{fmt(progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full flex items-center justify-between mb-4 md:mb-6">
            <button onClick={toggleShuffle}
              className={`btn-icon w-10 h-10 ${isShuffled ? 'text-green-400' : 'text-white/40 hover:text-white'}`}>
              <Shuffle size={18} />
            </button>
            <button onClick={prevSong} className="btn-icon w-12 h-12 text-white/80 hover:text-white">
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shrink-0"
              style={{ boxShadow: '0 0 40px rgba(192,38,211,0.5)' }}
            >
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : isPlaying
                  ? <Pause size={24} fill="white" />
                  : <Play size={24} fill="white" className="translate-x-0.5" />
              }
            </button>
            <button onClick={nextSong} className="btn-icon w-12 h-12 text-white/80 hover:text-white">
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button onClick={cycleRepeat}
              className={`btn-icon w-10 h-10 ${repeatMode !== 'none' ? 'text-green-400' : 'text-white/40 hover:text-white'}`}>
              <RepeatIcon size={18} />
            </button>
          </div>

          {/* Actions row */}
          <div className="w-full flex items-center justify-between px-2 pb-4 md:pb-0">
            <button onClick={handleLike}
              className={`btn-icon w-10 h-10 ${currentSong.is_liked ? 'text-green-400' : 'text-white/40 hover:text-white'}`}>
              <Heart size={20} fill={currentSong.is_liked ? 'currentColor' : 'none'} />
            </button>
            
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="btn-icon w-8 h-8 text-white/40 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range" min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="range-slider w-20 md:w-24"
              />
            </div>

            <div className="flex items-center gap-2">
              <button title="Add to Playlist" onClick={() => setShowAddToPlaylist(true)} className="btn-icon w-10 h-10 text-white/40 hover:text-white">
                <PlusCircle size={18} />
              </button>
              <button onClick={handleShare} className="btn-icon w-10 h-10 text-white/40 hover:text-white">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Lyrics toggle */}
          {currentSong.lyrics && (
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="mt-2 text-xs text-white/40 hover:text-fuchsia-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Mic2 size={12} />
              {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
            </button>
          )}

          {/* Lyrics */}
          {showLyrics && currentSong.lyrics && (
            <div className="mt-4 w-full glass rounded-2xl p-5 max-h-48 overflow-y-auto custom-scrollbar text-center">
              <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
                {currentSong.lyrics}
              </pre>
            </div>
          )}
        </div>

        {/* Queue sidebar */}
        {showQueue && (
          <div className="absolute top-0 right-0 w-full md:w-80 h-full glass-strong border-l border-white/5 flex flex-col z-20 shadow-2xl">
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-white">Queue ({queue.length})</h3>
              <button onClick={() => setShowQueue(false)} className="md:hidden text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
              {queue.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-8">Queue is empty</p>
              ) : queue.map((song, i) => (
                <div key={`${song.id}-${i}`} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer"
                  onClick={() => usePlayerStore.getState().playSong(song, queue.slice(i + 1))}>
                  <img src={song.thumbnail || '/placeholder-album.jpg'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-white/40 truncate">{song.singer_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddToPlaylist && <AddToPlaylistModal songId={currentSong.id} onClose={() => setShowAddToPlaylist(false)} />}
    </div>
  )
}
