import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

// Typographic wordmark for FedEx.
// The official logo artwork is not reproduced here.
export function BrandMark({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <Link
      to="/"
      className={cn('flex items-baseline gap-2 rounded-sm', className)}
      aria-label="Home"
    >
      <span className="font-display text-2xl font-extrabold tracking-tight">
        <span className={inverted ? 'text-white' : 'text-primary'}>Fed</span>
        <span className="text-accent">Ex</span>
      </span>
    </Link>
  )
}
