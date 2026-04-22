import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs uppercase tracking-widest text-muted">{label}</label>
      )}
      <input
        className={`bg-surface border border-border text-text font-mono text-sm px-3 py-2 outline-none focus:border-border-light transition-colors placeholder:text-muted ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
