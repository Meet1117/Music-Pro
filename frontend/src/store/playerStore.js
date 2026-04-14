import { create } from 'zustand'
import { Howl } from 'howler'
import { songsApi } from '../services/api'

let howl = null

const createHowl = (url, onEnd, onLoad, onError) => {
  if (howl) { howl.unload(); howl = null }
  howl = new Howl({
    src: [url],
    html5: true,
    preload: true,
    onend: onEnd,
    onload: onLoad,
    onloaderror: onError,
    onplayerror: onError,
  })
  return howl
}

export const usePlayerStore = create((set, get) => ({
  // State
  currentSong: null,
  queue: [],
  history: [],
  isPlaying: false,
  isLoading: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: 'none', // 'none' | 'one' | 'all'
  isExpanded: false,
  progressInterval: null,

  // Play a song
  playSong: (song, queue = []) => {
    const state = get()
    if (state.progressInterval) clearInterval(state.progressInterval)

    set({ isLoading: true, isExpanded: false })

    if (queue.length > 0) {
      const idx = queue.findIndex(s => s.id === song.id)
      const newQueue = idx >= 0
        ? [...queue.slice(idx + 1), ...queue.slice(0, idx)]
        : [...queue]
      set({ queue: newQueue })
    }

    const handleEnd = () => {
      const { repeatMode, nextSong } = get()
      if (repeatMode === 'one') {
        howl?.seek(0)
        howl?.play()
        set({ progress: 0 })
      } else {
        nextSong()
      }
    }

    createHowl(
      song.file_url,
      handleEnd,
      () => {
        set({ duration: song.duration || howl.duration() || 0, isLoading: false })
        howl.volume(get().isMuted ? 0 : get().volume)
        howl.play()
        set({ isPlaying: true })

        const interval = setInterval(() => {
          if (howl && howl.playing()) {
            set({ progress: typeof howl.seek() === 'number' ? howl.seek() : 0 })
          }
        }, 500)
        set({ progressInterval: interval })
      },
      () => set({ isLoading: false })
    )

    // Track play history (add prev to history)
    if (state.currentSong) {
      set(s => ({ history: [state.currentSong, ...s.history].slice(0, 50) }))
    }

    set({ currentSong: song, isPlaying: false, progress: 0, duration: 0 })
    songsApi.play(song.id).catch(() => {})
  },

  // Toggle play/pause
  togglePlay: () => {
    if (!howl) return
    const { isPlaying } = get()
    if (isPlaying) {
      howl.pause()
      set({ isPlaying: false })
      const { progressInterval } = get()
      if (progressInterval) clearInterval(progressInterval)
    } else {
      howl.play()
      set({ isPlaying: true })
      const interval = setInterval(() => {
        if (howl && howl.playing()) {
          set({ progress: typeof howl.seek() === 'number' ? howl.seek() : 0 })
        }
      }, 500)
      set({ progressInterval: interval })
    }
  },

  seek: (time) => {
    if (!howl) return
    howl.seek(time)
    set({ progress: time })
  },

  // Volume
  setVolume: (vol) => {
    const v = Math.max(0, Math.min(1, vol))
    if (howl) howl.volume(v)
    set({ volume: v, isMuted: v === 0 })
  },

  toggleMute: () => {
    const { isMuted, volume } = get()
    const newMuted = !isMuted
    if (howl) howl.volume(newMuted ? 0 : volume)
    set({ isMuted: newMuted })
  },

  // Next song
  nextSong: () => {
    const { queue, currentSong, history, isShuffled, repeatMode } = get()
    if (queue.length === 0) {
      if (repeatMode === 'all' && history.length > 0) {
        const prev = history[history.length - 1]
        get().playSong(prev, [])
      }
      return
    }
    let nextIdx = 0
    if (isShuffled) nextIdx = Math.floor(Math.random() * queue.length)
    const nextSong = queue[nextIdx]
    const newQueue = queue.filter((_, i) => i !== nextIdx)
    set({ queue: newQueue })
    get().playSong(nextSong, [])
  },

  // Previous
  prevSong: () => {
    const { progress, history } = get()
    if (progress > 3) { get().seek(0); return }
    if (history.length === 0) { get().seek(0); return }
    const [prev, ...rest] = history
    set({ history: rest })
    get().playSong(prev, [])
  },

  // Queue management
  addToQueue: (song) => set(s => ({
    queue: s.queue.some(q => q.id === song.id) ? s.queue : [...s.queue, song]
  })),

  removeFromQueue: (songId) => set(s => ({
    queue: s.queue.filter(q => q.id !== songId)
  })),

  clearQueue: () => set({ queue: [] }),

  // Shuffle
  toggleShuffle: () => set(s => ({ isShuffled: !s.isShuffled })),

  // Repeat
  cycleRepeat: () => set(s => ({
    repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none'
  })),

  // Expanded player
  setExpanded: (val) => set({ isExpanded: val }),

  // Like (optimistic UI update)
  toggleLikeCurrentSong: () => set(s => ({
    currentSong: s.currentSong
      ? { ...s.currentSong, is_liked: !s.currentSong.is_liked }
      : null
  })),
}))
