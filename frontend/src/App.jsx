import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { usePlayerStore } from './store/playerStore'
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import PageLoader from './components/ui/PageLoader'

// Lazy pages
const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const SongPage = lazy(() => import('./pages/SongPage'))
const SingerPage = lazy(() => import('./pages/SingerPage'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage'))
const MyPlaylists = lazy(() => import('./pages/MyPlaylists'))
const LikedSongs = lazy(() => import('./pages/LikedSongs'))
const History = lazy(() => import('./pages/History'))
const Library = lazy(() => import('./pages/Library'))
const GenrePage = lazy(() => import('./pages/GenrePage'))
const MoodPage = lazy(() => import('./pages/MoodPage'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminSongs = lazy(() => import('./pages/admin/AdminSongs'))
const AdminSingers = lazy(() => import('./pages/admin/AdminSingers'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const Copyrights = lazy(() => import('./pages/Copyrights'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin } = useAuthStore()
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { isLoggedIn } = useAuthStore()
  if (isLoggedIn()) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { fetchMe, isLoggedIn } = useAuthStore()
  const { currentSong, isPlaying } = usePlayerStore()

  useEffect(() => {
    if (isLoggedIn()) fetchMe()
  }, [])

  useEffect(() => {
    const defaultTitle = 'MuSync — Feel the Music'
    document.title = isPlaying && currentSong?.title
      ? `${currentSong.title} • MuSync`
      : defaultTitle

    const defaultFavicon = '/favicon.svg'
    const iconHref = isPlaying && currentSong?.thumbnail && !currentSong.thumbnail.includes('placeholder-album.jpg')
      ? currentSong.thumbnail
      : defaultFavicon

    let icon = document.querySelector("link[rel='icon']")
    if (!icon) {
      icon = document.createElement('link')
      icon.setAttribute('rel', 'icon')
      document.head.appendChild(icon)
    }
    icon.setAttribute('href', iconHref)
  }, [currentSong, isPlaying])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        </Route>

        {/* Main App */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/song/:id" element={<SongPage />} />
          <Route path="/singer/:id" element={<SingerPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/genre/:id" element={<GenrePage />} />
          <Route path="/mood/:id" element={<MoodPage />} />
          <Route path="/my-playlists" element={<ProtectedRoute><MyPlaylists /></ProtectedRoute>} />
          <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/copyrights" element={<Copyrights />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/songs" element={<ProtectedRoute adminOnly><AdminSongs /></ProtectedRoute>} />
          <Route path="/admin/singers" element={<ProtectedRoute adminOnly><AdminSingers /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
