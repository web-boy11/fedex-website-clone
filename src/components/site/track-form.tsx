import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PackageSearch } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sampleTrackingNumbers } from '@/lib/site-data'
import { cn } from '@/lib/utils'

export function TrackForm({
  defaultValue = '',
  className,
  showSamples = true,
}: {
  defaultValue?: string
  className?: string
  showSamples?: boolean
}) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function submit(id: string) {
    const clean = id.replace(/\s+/g, '')
    if (!/^\d{12}$/.test(clean)) {
      setError('Enter a 12-digit tracking number.')
      return
    }
    setError(null)
    void navigate({ to: '/tracking', search: { id: clean } })
  }

  return (
    <div className={className}>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          submit(value)
        }}
      >
        <label htmlFor="track-input" className="sr-only">
          Tracking number
        </label>
        <Input
          id="track-input"
          inputMode="numeric"
          placeholder="Tracking number (e.g. 778899001122)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'track-error' : undefined}
          className="h-12 flex-1 bg-background text-base text-foreground"
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 bg-accent px-8 text-base font-bold text-accent-foreground hover:bg-accent/90"
        >
          <PackageSearch /> Track
        </Button>
      </form>
      {error && (
        <p id="track-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {showSamples && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs opacity-80">
          Try a sample:
          {sampleTrackingNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setValue(n)
                submit(n)
              }}
              className={cn(
                'rounded-full border border-current/30 px-2 py-0.5 font-mono transition-colors hover:bg-current/10',
              )}
            >
              {n}
            </button>
          ))}
        </p>
      )}
    </div>
  )
}
