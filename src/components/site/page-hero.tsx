import type { ReactNode } from 'react'

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative mx-auto max-w-content px-4 py-14 sm:px-6 md:py-20">
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-reading text-lg text-primary-foreground/75">
          {description}
        </p>
        {children && <div className="mt-8 max-w-3xl">{children}</div>}
      </div>
    </section>
  )
}
