import { useEffect, ReactNode } from 'react'

interface BottomSheetProps {
  open:     boolean
  onClose:  () => void
  children: ReactNode
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[480px] rounded-t-[1rem] bg-[var(--bg2)] border-t border-[var(--border)] p-5 pb-10 max-h-[90dvh] overflow-y-auto transition-transform duration-300 ease-in-out transform translate-y-0"
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--bg4)]" />
        {children}
      </div>
    </div>
  )
}
