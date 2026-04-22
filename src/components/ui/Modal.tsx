import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export default function Modal({ title, onClose, children, wide }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 overflow-y-auto py-12 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-surface border border-border w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="text-xs uppercase tracking-widest text-muted">{title}</span>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
