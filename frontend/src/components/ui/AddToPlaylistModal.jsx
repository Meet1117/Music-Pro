import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playlistsApi } from '../../services/api'
import toast from 'react-hot-toast'
import { X, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

export function AddToPlaylistModal({ songId, onClose }) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['my-playlists', userId],
    queryFn: () => playlistsApi.my().then(r => r.data.data),
  })

  const addMut = useMutation({
    mutationFn: ({ playlistId }) => playlistsApi.addSong(playlistId, songId),
    onSuccess: (_, { playlistId }) => {
      qc.invalidateQueries({ queryKey: ['playlist', String(playlistId)] })
      qc.invalidateQueries({ queryKey: ['my-playlists'] })
      toast.success('Added to playlist')
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to add song')
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 text-[var(--text-muted)]"><X size={18} /></button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {isLoading ? (
            <p className="text-center py-4 text-[var(--text-muted)]">Loading...</p>
          ) : playlists?.length > 0 ? (
            <div className="space-y-2">
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => addMut.mutate({ playlistId: pl.id })}
                  disabled={addMut.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <img src={pl.cover_image || '/uploads/placeholder.png'} className="w-12 h-12 rounded object-cover" alt="" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{pl.title}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{pl.is_public ? 'Public' : 'Private'}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
             <p className="text-center py-4 text-[var(--text-muted)]">No playlists. Create one first!</p>
          )}
        </div>
      </div>
    </div>
  )
}
