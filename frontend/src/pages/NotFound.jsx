import { useNavigate } from 'react-router-dom'
import { Music2, Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold gradient-text mb-4">404</div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-5">
          <Music2 size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">This track doesn't exist. Let's get you back to the music.</p>
        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 gap-2 text-base">
          <Home size={18} /> Back to Home
        </button>
      </div>
    </div>
  )
}
