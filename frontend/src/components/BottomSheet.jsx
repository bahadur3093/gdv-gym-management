import { useEffect } from 'react'
import styles from './BottomSheet.module.css'

export default function BottomSheet({ open, onClose, children }) {
  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  )
}
