import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { singersApi, adminApi } from '../../services/api'
import { Plus, Search, Trash2, Edit3, X, Check, ArrowLeft, Mic2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', bio: '', country: '', genre_id: '', verified: false }

export default function AdminSingers() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editSinger, setEditSinger] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data, isLoading } = useQuery({
    queryKey: ['admin-singers', q],
    queryFn: () => singersApi.list({ q, limit: 50 }).then(r => r.data.data),
  })

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => adminApi.genres().then(r => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (data) => singersApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['admin-singers']); toast.success('Singer created'); resetForm() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => singersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['admin-singers']); toast.success('Singer updated'); resetForm() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => singersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['admin-singers']); toast.success('Singer deleted') },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditSinger(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    setCoverFile(null)
  }

  const openEdit = (singer) => {
    setEditSinger(singer)
    setForm({
      name: singer.name || '', bio: singer.bio || '',
      country: singer.country || '',
      genre_id: singer.genre_id || '', verified: singer.verified || false
    })
    setPhotoFile(null)
    setCoverFile(null)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) { toast.error('Name required'); return }
    const payload = new FormData()
    payload.append('name', form.name)
    if (form.bio) payload.append('bio', form.bio)
    if (form.country) payload.append('country', form.country)
    if (form.genre_id) payload.append('genre_id', String(parseInt(form.genre_id)))
    payload.append('verified', form.verified ? '1' : '0')
    if (photoFile) payload.append('photo_file', photoFile)
    if (coverFile) payload.append('cover_file', coverFile)

    if (editSinger) updateMut.mutate({ id: editSinger.id, data: payload })
    else createMut.mutate(payload)
  }

  const singers = data?.singers || []

  return (
    <div className="min-h-screen mesh-bg px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/admin" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white mb-1 transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Mic2 size={24} className="text-emerald-400" /> Singers</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary gap-2">
          <Plus size={16} /> Add Singer
        </button>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input className="input pl-9 text-sm" placeholder="Search singers..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={resetForm}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editSinger ? 'Edit Singer' : 'Add Singer'}</h2>
              <button onClick={resetForm} className="btn-icon w-8 h-8 text-[var(--text-muted)]"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Name *</label>
                <input className="input" value={form.name} onChange={set('name')} placeholder="Artist name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Genre</label>
                  <select className="input" value={form.genre_id} onChange={set('genre_id')}>
                    <option value="">No genre</option>
                    {(genres || []).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Country</label>
                  <input className="input" value={form.country} onChange={set('country')} placeholder="USA" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Artist Photo</label>
                <input
                  className="input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                  onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                />
                {editSinger?.photo && <p className="text-[11px] text-[var(--text-muted)] mt-1">Current photo: {editSinger.photo}</p>}
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Cover Image</label>
                <input
                  className="input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                  onChange={e => setCoverFile(e.target.files?.[0] || null)}
                />
                {editSinger?.cover_image && <p className="text-[11px] text-[var(--text-muted)] mt-1">Current cover: {editSinger.cover_image}</p>}
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Bio</label>
                <textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder="Artist biography..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.verified} onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                <span className="text-sm text-[var(--text-secondary)]">Verified artist</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1 py-2.5 gap-2">
                  <Check size={16} /> {editSinger ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="btn-ghost border border-white/10 px-5 rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {singers.map(singer => (
            <div key={singer.id} className="glass rounded-2xl p-3 text-center group relative">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 ring-2 ring-white/10">
                <img src={singer.photo || '/placeholder-artist.jpg'} alt={singer.name}
                  className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                {singer.verified && <CheckCircle size={12} className="text-green-400" />}
                <p className="text-sm font-semibold text-white truncate">{singer.name}</p>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{singer.follower_count?.toLocaleString()} followers</p>
              <p className="text-xs text-[var(--text-muted)]">{singer.song_count} songs</p>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(singer)} className="btn-icon w-6 h-6 bg-white/10 text-white"><Edit3 size={11} /></button>
                <button onClick={() => { if (confirm('Delete singer?')) deleteMut.mutate(singer.id) }} className="btn-icon w-6 h-6 bg-red-500/80 text-white"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
