import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: (user, token) => {
        localStorage.setItem('musicpro_token', token)
        set({ user, token })
      },

      clearAuth: () => {
        localStorage.removeItem('musicpro_token')
        localStorage.removeItem('musicpro_user')
        set({ user: null, token: null })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login({ email, password })
          const { user, token } = res.data.data
          localStorage.setItem('musicpro_token', token)
          set({ user, token, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.error || 'Login failed' }
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res = await authApi.register(data)
          const { user, token } = res.data.data
          localStorage.setItem('musicpro_token', token)
          set({ user, token, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.error || 'Registration failed' }
        }
      },

      logout: async () => {
        await authApi.logout().catch(() => {})
        get().clearAuth()
      },

      fetchMe: async () => {
        const token = localStorage.getItem('musicpro_token')
        if (!token) return
        try {
          const res = await authApi.me()
          set({ user: res.data.data })
        } catch {
          get().clearAuth()
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      isLoggedIn: () => !!get().token,
    }),
    {
      name: 'musicpro_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
