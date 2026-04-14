import axios from 'axios'
import { queryClient } from '../main.jsx'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

const postIfMultipart = (url, data) =>
  data instanceof FormData ? api.post(url, data) : api.put(url, data)

// Attach token
api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = localStorage.getItem('musicpro_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 and success invalidations
api.interceptors.response.use(
  (r) => {
    const url = r.config.url || ''
    if (r.config.method === 'post' || r.config.method === 'put' || r.config.method === 'delete') {
      if (url.includes('action=play')) {
        queryClient.invalidateQueries({ queryKey: ['song'] })
        queryClient.invalidateQueries({ queryKey: ['trending'] })
        queryClient.invalidateQueries({ queryKey: ['recommended'] })
        queryClient.invalidateQueries({ queryKey: ['recent-played'] })
        queryClient.invalidateQueries({ queryKey: ['singer-songs'] })
        queryClient.invalidateQueries({ queryKey: ['search'] })
      }
      if (url.includes('action=like')) {
        queryClient.invalidateQueries({ queryKey: ['song'] })
        queryClient.invalidateQueries({ queryKey: ['liked-songs'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['trending'] })
        queryClient.invalidateQueries({ queryKey: ['recommended'] })
        queryClient.invalidateQueries({ queryKey: ['recent-played'] })
        queryClient.invalidateQueries({ queryKey: ['singer-songs'] })
        queryClient.invalidateQueries({ queryKey: ['search'] })
        queryClient.invalidateQueries({ queryKey: ['related'] })
      }
      if (url.includes('action=follow')) {
        queryClient.invalidateQueries({ queryKey: ['singer'] })
        queryClient.invalidateQueries({ queryKey: ['top-singers'] })
        queryClient.invalidateQueries({ queryKey: ['singers-followed'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['singers-list'] })
        queryClient.invalidateQueries({ queryKey: ['search'] })
      }
    }
    return r
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('musicpro_token')
      localStorage.removeItem('musicpro_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth?action=register', data),
  login: (data) => api.post('/auth?action=login', data),
  logout: () => api.post('/auth?action=logout'),
  me: () => api.get('/auth?action=me'),
  updateProfile: (data) => api.put('/auth?action=update-profile', data),
}

// ── Songs ─────────────────────────────────────────────
export const songsApi = {
  list: (params) => api.get('/songs?action=list', { params }),
  get: (id) => api.get(`/songs?action=get&id=${id}`),
  create: (data) => api.post('/songs?action=create', data),
  update: (id, data) => postIfMultipart(`/songs?action=update&id=${id}`, data),
  delete: (id) => api.delete(`/songs?action=delete&id=${id}`),
  trending: (params) => api.get('/songs?action=trending', { params }),
  recent: (params) => api.get('/songs?action=recent', { params }),
  liked: (params) => api.get('/songs?action=liked', { params }),
  like: (id) => api.post(`/songs?action=like&id=${id}`),
  play: (id, duration) => api.post(`/songs?action=play&id=${id}`, { duration }),
  search: (q, params) => api.get('/songs?action=search', { params: { q, ...params } }),
  recommended: (params) => api.get('/songs?action=recommended', { params }),
  bySinger: (singer_id, params) => api.get('/songs?action=by-singer', { params: { singer_id, ...params } }),
  byGenre: (genre_id, params) => api.get('/songs?action=by-genre', { params: { genre_id, ...params } }),
  byMood: (mood_id, params) => api.get('/songs?action=by-mood', { params: { mood_id, ...params } }),
  related: (id, params) => api.get(`/songs?action=related&id=${id}`, { params }),
}

// ── Singers ───────────────────────────────────────────
export const singersApi = {
  list: (params) => api.get('/singers?action=list', { params }),
  get: (id) => api.get(`/singers?action=get&id=${id}`),
  create: (data) => api.post('/singers?action=create', data),
  update: (id, data) => postIfMultipart(`/singers?action=update&id=${id}`, data),
  delete: (id) => api.delete(`/singers?action=delete&id=${id}`),
  follow: (id) => api.post(`/singers?action=follow&id=${id}`),
  top: (params) => api.get('/singers?action=top', { params }),
  followed: () => api.get('/singers?action=followed'),
}

// ── Playlists ─────────────────────────────────────────
export const playlistsApi = {
  list: (params) => api.get('/playlists?action=list', { params }),
  get: (id) => api.get(`/playlists?action=get&id=${id}`),
  create: (data) => api.post('/playlists?action=create', data),
  update: (id, data) => api.put(`/playlists?action=update&id=${id}`, data),
  delete: (id) => api.delete(`/playlists?action=delete&id=${id}`),
  addSong: (id, song_id) => api.post(`/playlists?action=add-song&id=${id}`, { song_id }),
  removeSong: (id, song_id) => api.delete(`/playlists?action=remove-song&id=${id}`, { data: { song_id } }),
  my: () => api.get('/playlists?action=my'),
}

// ── Admin ─────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin?action=dashboard'),
  users: (params) => api.get('/admin?action=users', { params }),
  genres: () => api.get('/admin?action=genres'),
  moods: () => api.get('/admin?action=moods'),
  createGenre: (data) => api.post('/admin?action=genres', data),
  createMood: (data) => api.post('/admin?action=moods', data),
  topSongs: (params) => api.get('/admin?action=top-songs', { params }),
  topSingers: () => api.get('/admin?action=top-singers'),
}

export default api
