import { useNavigate } from 'react-router-dom'
import { X, LogIn } from 'lucide-react'

export default function LoginRequestModal({ isOpen, onClose, previewCount }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleLogin = () => {
    onClose()
    navigate('/login')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md glass-strong rounded-3xl p-6 sm:p-8 animate-in zoom-in duration-200 shadow-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn-icon w-8 h-8 text-[var(--text-muted)] hover:text-white sm:top-6 sm:right-6"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-5 glow-green mx-auto">
            <LogIn size={28} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">
            Continue Listening
          </h2>

          {/* Message */}
          <p className="text-[var(--text-secondary)] text-center mb-2 text-sm sm:text-base">
            You've enjoyed <span className="font-semibold text-green-400">{previewCount} free preview{previewCount > 1 ? 's' : ''}</span> • 30 seconds each
          </p>
          <p className="text-[var(--text-muted)] text-center mb-6 text-sm sm:text-base">
            Sign in to unlock unlimited listening and access all features.
          </p>

          {/* Features list */}
          <div className="space-y-2 mb-8 bg-white/5 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'dotHeartbeat 1.15s ease-in-out infinite' }} />
              </div>
              <span className="text-[var(--text-secondary)] text-sm">Unlimited song streaming</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'dotHeartbeat 1.15s ease-in-out 0.15s infinite' }} />
              </div>
              <span className="text-[var(--text-secondary)] text-sm">Create & manage playlists</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'dotHeartbeat 1.15s ease-in-out 0.3s infinite' }} />
              </div>
              <span className="text-[var(--text-secondary)] text-sm">Save your favorite songs</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Close
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20 transition-all font-semibold text-sm flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Sign In
            </button>
          </div>

          {/* Signup link */}
          <p className="text-center text-xs sm:text-sm text-[var(--text-muted)] mt-4">
            Don't have an account?{' '}
            <button
              onClick={() => {
                onClose()
                navigate('/register')
              }}
              className="text-green-500 hover:text-green-400 font-semibold transition-colors"
            >
              Sign up free
            </button>
          </p>

          <style>{`
            @keyframes dotHeartbeat {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              20% {
                transform: scale(1.45);
                opacity: 0.9;
              }
              40% {
                transform: scale(1.2);
                opacity: 0.85;
              }
              60% {
                transform: scale(1.5);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    </>
  )
}
