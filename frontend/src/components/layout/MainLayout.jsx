import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MiniPlayer from '../player/MiniPlayer'
import ExpandedPlayer from '../player/ExpandedPlayer'
import { usePlayerStore } from '../../store/playerStore'
import { Menu, Music2 } from 'lucide-react'
import { useState } from 'react'

export default function MainLayout() {
  const { isExpanded, currentSong } = usePlayerStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      {/* Sidebar */}
      <Sidebar mobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="md:hidden px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            className="btn-icon w-10 h-10 text-[var(--text-secondary)]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center glow-green">
              <Music2 size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">Music Pro</span>
          </div>
        </div>

        <main
          className="flex-1 overflow-y-auto page-enter"
          style={{ paddingBottom: currentSong ? 'var(--player-height)' : '0' }}
        >
          <Outlet />
        </main>

        {/* Mini Player */}
        {currentSong && <MiniPlayer />}
      </div>

      {/* Expanded Full Player */}
      {isExpanded && <ExpandedPlayer />}
    </div>
  )
}
