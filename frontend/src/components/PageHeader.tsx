import { ReactNode } from 'react'
import { useTheme } from '@/context/ThemeContext'

interface PageHeaderProps {
  greeting?:    string
  title:        string
  titleAccent?: string
  right?:       ReactNode
}

export default function PageHeader({ greeting, title, titleAccent, right }: PageHeaderProps) {
  const { theme, toggle } = useTheme()
  return (
    <div className="flex items-center justify-between pt-4 pb-5 mx-auto rounded-xl shadow-lg px-4 mt-2 mb-4 border border-[var(--border)] bg-[var(--bg2)]">
      <div>
        {greeting && <p className="text-[13px] text-[var(--text2)] mb-1">{greeting}</p>}
        <h1 className="font-['Open Sans'] text-[24px] font-bold text-[var(--text)] leading-tight">
          {title}
          {titleAccent && <span className="text-[var(--accent)]"> {titleAccent}</span>}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {right && <div className="hidden sm:inline-flex flex-shrink-0">{right}</div>}
        <button
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--bg3)] transition"
          aria-label="Toggle appearance"
        >
          <span className="text-[15px]">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="hidden md:inline">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </div>
  )
}
