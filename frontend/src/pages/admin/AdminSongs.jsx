import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { songsApi, singersApi, adminApi } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Plus, Search, Trash2, Edit3, X, Check, ArrowLeft, Music2 } from 'lucide-react'
import { fmtDuration } from '../../components/ui/SongCard'
import toast from 'react-hot-toast'
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'

const EMPTY_FORM = {
  title: '', singer_id: '', singer_ids: [], genre_id: '', mood_id: '',
  duration: '', language: '', lyrics: '', tags: '', release_date: ''
}

export default function AdminSongs() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const userId = user?.id ?? 'guest'
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editSong, setEditSong] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [hasMultipleSingers, setHasMultipleSingers] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({
    queryKey: ['admin-songs', userId, page, q],
    queryFn: () => (q
      ? songsApi.search(q, { limit: 20 })
      : songsApi.list({ page, limit: 20, sort: 'created_at', dir: 'desc' })
    ).then(r => r.data.data),
  })

  const { data: singers } = useQuery({
    queryKey: ['singers-all', userId],
    queryFn: () => singersApi.list({ limit: 100 }).then(r => r.data.data.singers),
  })
  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => adminApi.genres().then(r => r.data.data),
  })
  const { data: moods } = useQuery({
    queryKey: ['moods'],
    queryFn: () => adminApi.moods().then(r => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (data) => songsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['admin-songs']); toast.success('Song created'); resetForm() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => songsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['admin-songs']); toast.success('Song updated'); resetForm() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => songsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['admin-songs']); toast.success('Song deleted') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const resetForm = () => {
    setShowForm(false)
    setEditSong(null)
    setForm(EMPTY_FORM)
    setHasMultipleSingers(false)
    setAudioFile(null)
    setThumbnailFile(null)
  }

  const openEdit = (song) => {
    const selectedSingerIds = String(song.singer_ids || song.singer_id || '')
      .split(',')
      .map(x => String(parseInt(x, 10)))
      .filter(x => x && x !== 'NaN')

    setEditSong(song)
    setForm({
      title: song.title || '', singer_id: song.singer_id || '', genre_id: song.genre_id || '',
      singer_ids: selectedSingerIds.length > 0 ? selectedSingerIds : (song.singer_id ? [String(song.singer_id)] : []),
      mood_id: song.mood_id || '',
      duration: song.duration || '', language: song.language || '', lyrics: song.lyrics || '',
      tags: song.tags || '', release_date: song.release_date || ''
    })
    setHasMultipleSingers(selectedSingerIds.length > 1)
    setAudioFile(null)
    setThumbnailFile(null)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const selectedSingerIds = hasMultipleSingers
      ? form.singer_ids.map(x => String(parseInt(x, 10))).filter(x => x && x !== 'NaN')
      : [String(parseInt(form.singer_id, 10))].filter(x => x && x !== 'NaN')

    if (!form.title || selectedSingerIds.length === 0) { toast.error('Title and singer are required'); return }
    if (!editSong && !audioFile) { toast.error('Audio file is required for new songs'); return }

    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('singer_id', selectedSingerIds[0])
    payload.append('singer_ids', selectedSingerIds.join(','))
    if (form.genre_id) payload.append('genre_id', String(parseInt(form.genre_id)))
    if (form.mood_id) payload.append('mood_id', String(parseInt(form.mood_id)))
    payload.append('duration', String(parseInt(form.duration) || 0))
    if (form.language) payload.append('language', form.language)
    if (form.lyrics) payload.append('lyrics', form.lyrics)
    if (form.tags) payload.append('tags', form.tags)
    if (form.release_date) payload.append('release_date', form.release_date)
    if (audioFile) payload.append('audio_file', audioFile)
    if (thumbnailFile) payload.append('thumbnail_file', thumbnailFile)

    if (editSong) updateMut.mutate({ id: editSong.id, data: payload })
    else createMut.mutate(payload)
  }

  const songs = Array.isArray(data) ? data : data?.songs || []
  const total = data?.total || songs.length

  return (
    <div className="min-h-screen mesh-bg px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/admin" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white mb-1 transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Music2 size={24} className="text-green-400" /> Songs</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary gap-2">
          <Plus size={16} /> Add Song
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input className="input pl-9 text-sm" placeholder="Search songs..." value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={resetForm}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editSong ? 'Edit Song' : 'Add Song'}</h2>
              <button onClick={resetForm} className="btn-icon w-8 h-8 text-[var(--text-muted)]"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Title *</label>
                <input className="input" value={form.title} onChange={set('title')} placeholder="Song title" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[var(--text-muted)] block">Singer *</label>
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasMultipleSingers}
                      onChange={(e) => {
                        const enabled = e.target.checked
                        setHasMultipleSingers(enabled)
                        setForm((f) => {
                          if (enabled) {
                            const base = f.singer_ids?.length ? f.singer_ids : (f.singer_id ? [String(f.singer_id)] : [])
                            return { ...f, singer_ids: base }
                          }
                          const first = f.singer_ids?.[0] || f.singer_id || ''
                          return { ...f, singer_id: first, singer_ids: first ? [String(first)] : [] }
                        })
                      }}
                    />
                    Multiple singers
                  </label>
                </div>

                {hasMultipleSingers ? (
                  <select
                    className="input h-28"
                    multiple
                    value={form.singer_ids}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(o => o.value)
                      setForm(f => ({
                        ...f,
                        singer_ids: values,
                        singer_id: values[0] || ''
                      }))
                    }}
                    required
                  >
                    {(singers || []).map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                ) : (
                  <select
                    className="input"
                    value={form.singer_id}
                    onChange={(e) => setForm(f => ({ ...f, singer_id: e.target.value, singer_ids: e.target.value ? [e.target.value] : [] }))}
                    required
                  >
                    <option value="">Select singer</option>
                    {(singers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Genre</label>
                <select className="input" value={form.genre_id} onChange={set('genre_id')}>
                  <option value="">No genre</option>
                  {(genres || []).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Mood</label>
                <select className="input" value={form.mood_id} onChange={set('mood_id')}>
                  <option value="">No mood</option>
                  {(moods || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Language</label>
                <input className="input" value={form.language} onChange={set('language')} placeholder="English" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Audio File {editSong ? '(optional to replace)' : '*'}</label>
                <input
                  className="input"
                  type="file"
                  accept=".mp3,.wav,.ogg,.aac,.m4a,.flac,audio/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null
                    if (file) {
                      setAudioFile(file)
                      const audio = new Audio(URL.createObjectURL(file))
                      audio.addEventListener('loadedmetadata', () => {
                        setForm(f => ({ ...f, duration: Math.floor(audio.duration) }))
                        URL.revokeObjectURL(audio.src) // clean up
                      })

                      // Extract metadata using jsmediatags
                      jsmediatags.read(file, {
                        onSuccess: (tag) => {
                          const { tags } = tag
                          if (!tags) return

                          setForm(f => {
                            const nf = { ...f }
                            
                            // Map simple strings if they are currently empty
                            if (tags.title && !nf.title) nf.title = tags.title
                            if (tags.year && !nf.release_date) {
                              // If year is '2024', try to set it. 'date' inputs expect YYYY-MM-DD
                              if (tags.year.length >= 4) {
                                nf.release_date = `${tags.year.substring(0, 4)}-01-01`
                              }
                            }
                            // Map relations
                            if (tags.genre && !nf.genre_id) {
                              const gStr = tags.genre.toLowerCase()
                              const matchG = genres?.find(x => x.name.toLowerCase() === gStr || gStr.includes(x.name.toLowerCase()))
                              if (matchG) nf.genre_id = matchG.id
                            }
                            if (tags.artist && !nf.singer_id && (!nf.singer_ids || nf.singer_ids.length === 0)) {
                              const artists = tags.artist
                                .split(/,|&| feat\.? | ft\.? /i)
                                .map(x => x.trim().toLowerCase())
                                .filter(Boolean)

                              const matchedSingerIds = (singers || [])
                                .filter(x => artists.some(a => a === x.name.toLowerCase() || a.includes(x.name.toLowerCase())))
                                .map(x => String(x.id))

                              if (matchedSingerIds.length > 0) {
                                nf.singer_id = matchedSingerIds[0]
                                nf.singer_ids = matchedSingerIds
                              }
                            }
                            return nf
                          })

                          // Map Thumbnail
                          if (tags.picture && !thumbnailFile) {
                            try {
                              const { data, format } = tags.picture
                              const byteArray = new Uint8Array(data)
                              const blob = new Blob([byteArray], { type: format || 'image/jpeg' })
                              const imgFile = new File([blob], `cover_${Date.now()}.${(format || 'image/jpeg').split('/')[1]}`, { type: format || 'image/jpeg' })
                              setThumbnailFile(imgFile)
                              toast.success('Metadata & Cover extracted from file')
                            } catch (e) {
                              console.error('Failed to extract embedded image', e)
                              toast.success('Metadata extracted (no cover)')
                            }
                          } else {
                             toast.success('Metadata extracted')
                          }
                        },
                        onError: (error) => {
                          console.log('Error reading tags:', error)
                        }
                      })
                    } else {
                      setAudioFile(null)
                    }
                  }}
                  required={!editSong}
                />
                {editSong?.file_url && <p className="text-[11px] text-[var(--text-muted)] mt-1">Current file: {editSong.file_url}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Thumbnail Image (optional)</label>
                <input
                  className="input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                  onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                />
                {editSong?.thumbnail && <p className="text-[11px] text-[var(--text-muted)] mt-1">Current cover: {editSong.thumbnail}</p>}
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Duration (seconds)</label>
                <input className="input" type="number" value={form.duration} onChange={set('duration')} placeholder="240" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Release Date</label>
                <input className="input" type="date" value={form.release_date} onChange={set('release_date')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Tags (comma-separated)</label>
                <input className="input" value={form.tags} onChange={set('tags')} placeholder="pop, summer, upbeat" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Lyrics</label>
                <textarea className="input resize-none h-28" value={form.lyrics} onChange={set('lyrics')} placeholder="Optional lyrics..." />
              </div>
              <div className="col-span-2 flex gap-3">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1 py-2.5 gap-2">
                  <Check size={16} /> {editSong ? 'Update Song' : 'Create Song'}
                </button>
                <button type="button" onClick={resetForm} className="btn-ghost border border-white/10 px-6 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Song', 'Singer', 'Genre', 'Duration', 'Plays', 'Likes', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : songs.map(song => (
                    <tr key={song.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {song.thumbnail && <img src={song.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                          <span className="font-medium text-white truncate max-w-[180px]">{song.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{song.singer_name}</td>
                      <td className="px-4 py-3">
                        {song.genre_name && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${song.genre_color}22`, color: song.genre_color }}>{song.genre_name}</span>}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{fmtDuration(song.duration)}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{Number(song.play_count).toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-400">{Number(song.like_count).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(song)} className="btn-icon w-7 h-7 text-[var(--text-muted)] hover:text-fuchsia-300"><Edit3 size={13} /></button>
                          <button onClick={() => { if (confirm('Delete song?')) deleteMut.mutate(song.id) }} className="btn-icon w-7 h-7 text-[var(--text-muted)] hover:text-red-400"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-[var(--text-muted)]">{total} songs total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={songs.length < 20} className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
