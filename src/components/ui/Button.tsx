import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  const base = 'font-mono uppercase tracking-widest transition-colors border cursor-pointer disabled:opacity-40'
  const sizes = { sm: 'px-3 py-1 text-xs', md: 'px-5 py-2 text-xs' }
  const variants = {
    primary: 'bg-accent text-background border-accent hover:bg-transparent hover:text-accent',
    ghost:   'bg-transparent text-text border-border-light hover:border-accent hover:text-accent',
    danger:  'bg-transparent text-red-500 border-red-800 hover:bg-red-950 hover:border-red-500',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
