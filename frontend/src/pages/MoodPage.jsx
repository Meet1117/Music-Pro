// MoodPage.jsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { songsApi, adminApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { SongRow } from '../components/ui/SongCard'
import { Section } from '../components/ui/PageLoader'
import { Play, ChevronLeft } from 'lucide-react'

export function MoodPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayerStore()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'

  const { data: moods } = useQuery({
    queryKey: ['moods'],
    queryFn: () => adminApi.moods().then(r => r.data.data),
  })
  const mood = moods?.find(m => m.id === parseInt(id))

  const { data: songs } = useQuery({
    queryKey: ['mood-songs', userId, id],
    queryFn: () => songsApi.byMood(id, { limit: 30 }).then(r => r.data.data),
    enabled: !!id,
  })

  return (
    <div className="min-h-screen">
      <div className="relative h-52 flex items-end overflow-hidden"
        style={{ background: mood ? `linear-gradient(135deg, ${mood.color}44, #121212)` : '#121212' }}>
        <div className="absolute top-6 right-8 text-7xl opacity-20">{mood?.icon}</div>
        <div className="relative z-10 px-6 pb-8 max-w-7xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="text-4xl font-bold text-white">{mood?.icon} {mood?.name || 'Mood'}</h1>
          <p className="text-white/50 mt-1 text-sm">{songs?.length || 0} songs for this mood</p>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {songs?.length > 0 && (
          <button onClick={() => playSong(songs[0], songs.slice(1))} className="btn-primary px-8 py-3 gap-2 mb-6">
            <Play size={18} fill="white" /> Play All
          </button>
        )}
        <div className="space-y-1">
          {(songs || []).map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={songs} showIndex />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MoodPage
