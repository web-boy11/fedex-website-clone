import type { ReactNode } from 'react'
import { Lock, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDemoSession, type DemoRole } from '@/lib/demo-session'

export function DemoGate({ children }: { require?: DemoRole; children: ReactNode }) {
  const { role, ready, signIn } = useDemoSession()

  if (!ready) {
    return (
      <div className="mx-auto max-w-content space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const allowed = role !== null
  if (allowed) return <>{children}</>

  return (
    <div className="mx-auto max-w-reading px-4 py-20 text-center sm:px-6">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-primary">
        <Lock className="size-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
        Sign in to Your Account
      </h1>
      <p className="mt-3 text-muted-foreground">
        Access your active shipments, delivery preferences, and billing records.
      </p>
      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={() => signIn('customer')}>
          <UserRound className="size-4" /> Continue to Account
        </Button>
      </div>
    </div>
  )
}
