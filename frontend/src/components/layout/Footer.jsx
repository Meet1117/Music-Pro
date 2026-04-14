import { Link } from 'react-router-dom'
import { Copyright } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--bg-secondary)] py-4 sm:py-6 px-3 sm:px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row sm:justify-between">
        {/* Left side - Copyright */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--text-muted)] text-center sm:text-left">
          <Copyright size={14} className="flex-shrink-0" />
          <span className="truncate">{currentYear} MuSynx. All rights reserved.</span>
        </div>

        {/* Right side - Designer credit and Links */}
        <div className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm text-center sm:text-right flex-wrap justify-center">
          <span className="text-[var(--text-muted)] truncate">
            Designed & Developed by{' '}
            <a
              href="https://patelmeet.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 font-semibold transition-colors"
            >
              Meet Patel
            </a>
          </span>
          <span className="text-[var(--border-color)] hidden sm:inline">•</span>
          <Link
            to="/copyrights"
            className="text-gray-300 hover:text-white underline transition-colors font-medium whitespace-nowrap"
          >
            Copyrights & Legal
          </Link>
        </div>
      </div>
    </footer>
  )
}
