import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Home, Search, Library, Heart, ListMusic, Music2,
  Users, TrendingUp, Settings, LogOut, LogIn, UserPlus,
  Mic2, LayoutDashboard, ChevronRight, X, History
} from 'lucide-react'
import clsx from 'clsx'

const NAV_MAIN = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library', auth: true },
]

const NAV_COLLECTION = [
  { to: '/liked', icon: Heart, label: 'Liked Songs', auth: true },
  { to: '/history', icon: History, label: 'History', auth: true },
  { to: '/my-playlists', icon: ListMusic, label: 'My Playlists', auth: true },
]

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { user, isLoggedIn, isAdmin, logout } = useAuthStore()
  const navigate = useNavigate()

  const NavItem = ({ to, icon: Icon, label, exact }) => (
    <NavLink
      to={to}
      end={exact}
      onClick={onClose}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'text-white bg-gradient-to-r from-emerald-900/60 to-green-900/40 border border-green-500/20'
            : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
        )
      }
    >
      <Icon size={18} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <aside
      className={clsx(
        'fixed md:static inset-y-0 left-0 z-50 md:z-auto flex flex-col h-full glass-strong border-r border-white/5 transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
      style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
    >
      <div className="md:hidden px-3 pt-3 pb-1 flex justify-end">
        <button
          type="button"
          aria-label="Close menu"
          className="btn-icon w-9 h-9 text-[var(--text-secondary)]"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {/* Logo */}
      <div className="hidden md:flex px-4 py-5 items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center glow-green">
          <Music2 size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold gradient-text tracking-tight">MuSynx</span>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        {/* Main Nav */}
        <nav className="space-y-1">
          {NAV_MAIN.filter(n => !n.auth || isLoggedIn()).map(n => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>

        {/* Collection */}
        {isLoggedIn() && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 mb-2">
              Collection
            </p>
            <nav className="space-y-1">
              {NAV_COLLECTION.map(n => <NavItem key={n.to} {...n} />)}
            </nav>
          </div>
        )}

        {/* Admin */}
        {isAdmin() && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 mb-2">
              Admin
            </p>
            <nav className="space-y-1">
              <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" exact />
              <NavItem to="/admin/songs" icon={Music2} label="Songs" />
              <NavItem to="/admin/singers" icon={Mic2} label="Singers" />
              <NavItem to="/admin/users" icon={Users} label="Users" />
            </nav>
          </div>
        )}

        {/* Discover */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 mb-2">
            Discover
          </p>
          <nav className="space-y-1">
            <NavItem to="/search?tab=trending" icon={TrendingUp} label="Trending" />
            <NavItem to="/search?tab=artists" icon={Mic2} label="Artists" />
          </nav>
        </div>
      </div>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/5">
        {isLoggedIn() ? (
          <div>
            <button
              onClick={() => { onClose(); navigate('/profile') }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  : (user?.display_name?.[0] || user?.username?.[0] || 'U').toUpperCase()
                }
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user?.display_name || user?.username}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
              <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={() => { onClose(); logout() }}
              className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-xl text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => { onClose(); navigate('/login') }}
              className="btn-primary w-full text-sm py-2.5"
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              onClick={() => { onClose(); navigate('/register') }}
              className="btn-ghost w-full text-sm"
            >
              <UserPlus size={16} />
              Create Account
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
