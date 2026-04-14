import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { playlistsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { PlaylistCard, EmptyState } from '../components/ui/PageLoader'
import { Plus, X, ListMusic } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MyPlaylists() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', is_public: true })

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['my-playlists', userId],
    queryFn: () => playlistsApi.my().then(r => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (data) => playlistsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['my-playlists'])
      toast.success('Playlist created!')
      setShowCreate(false)
      setForm({ title: '', description: '', is_public: true })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => playlistsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['my-playlists']); toast.success('Deleted') },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    createMut.mutate(form)
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Playlists</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{playlists?.length || 0} playlists</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus size={18} /> New Playlist
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Create Playlist</h2>
              <button onClick={() => setShowCreate(false)} className="btn-icon w-8 h-8 text-[var(--text-muted)]"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-[var(--text-muted)] mb-1.5 block">Title *</label>
                <input className="input" placeholder="My awesome playlist" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-[var(--text-muted)] mb-1.5 block">Description</label>
                <textarea className="input resize-none h-20" placeholder="Optional description..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors ${form.is_public ? 'bg-green-600' : 'bg-white/10'} relative`}
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_public ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">{form.is_public ? 'Public playlist' : 'Private playlist'}</span>
              </label>
              <button type="submit" className="btn-primary w-full py-3" disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating...' : 'Create Playlist'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-3">
              <div className="skeleton aspect-square rounded-xl mb-3" />
              <div className="skeleton h-4 rounded mb-2 w-3/4" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : playlists?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map(pl => (
            <div key={pl.id} className="relative group">
              <PlaylistCard playlist={pl} onClick={() => navigate(`/playlist/${pl.id}`)} />
              <button
                onClick={() => { if (confirm('Delete playlist?')) deleteMut.mutate(pl.id) }}
                className="absolute top-5 right-5 btn-icon w-7 h-7 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListMusic}
          title="No playlists yet"
          message="Create your first playlist to organize your music."
          action={() => setShowCreate(true)}
          actionLabel="Create Playlist"
        />
      )}
    </div>
  )
}
