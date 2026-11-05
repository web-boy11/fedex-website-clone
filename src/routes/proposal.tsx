import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calculator,
  Expand,
  Gauge,
  Globe2,
  HeartHandshake,
  LifeBuoy,
  MapPin,
  MessageSquareWarning,
  MousePointerClick,
  PackageSearch,
  Printer,
  Puzzle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/site/brand-mark'
import { cdnImage } from '@/lib/img'
import {
  hubs,
  lanes,
  presenter,
  proposalKpis,
  roadmap,
  type SitePath,
} from '@/lib/site-data'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  slide: z.coerce.number().int().min(1).optional(),
})

export const Route = createFileRoute('/proposal')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Presentation — FedEx' }] }),
  component: ProposalPage,
})

type Slide = { id: string; title: string; render: () => ReactNode }

const features: Array<{
  icon: typeof Globe2
  title: string
  copy: string
  to: SitePath
}> = [
  {
    icon: Globe2,
    title: 'Live network map',
    copy: 'Real, pannable world map with hubs, lanes and simulated aircraft in real time.',
    to: '/network',
  },
  {
    icon: PackageSearch,
    title: 'Tracking + route map',
    copy: 'Plain-language status, a step bar, travel history and the route drawn on a map.',
    to: '/tracking',
  },
  {
    icon: Calculator,
    title: 'Rate, ship & pickup',
    copy: 'Instant quotes, a four-step shipment wizard and pickup scheduling in one place.',
    to: '/shipping',
  },
  {
    icon: MapPin,
    title: 'Location finder',
    copy: 'Search and filter drop-off points on a live street map, with directions.',
    to: '/locations',
  },
  {
    icon: LifeBuoy,
    title: 'Calmer support',
    copy: 'Topic-led help centre, searchable FAQs and clear contact options.',
    to: '/support',
  },
  {
    icon: Building2,
    title: 'Business solutions',
    copy: 'Small business, freight and international trade, framed by outcome.',
    to: '/business',
  },
]

function SlideFrame({
  eyebrow,
  title,
  children,
  dark = false,
}: {
  eyebrow?: string
  title?: string
  children: ReactNode
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col p-8 md:p-12',
        dark && 'bg-primary text-primary-foreground',
      )}
    >
      {eyebrow && (
        <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h2>
      )}
      <div className="mt-8 flex-1">{children}</div>
    </div>
  )
}

const slides: Array<Slide> = [
  {
    id: 'title',
    title: 'Title',
    render: () => (
      <div className="relative isolate flex h-full flex-col justify-end overflow-hidden bg-primary p-8 text-primary-foreground md:p-12">
        <img
          src={cdnImage('hero.png', 1600)}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary via-primary/85 to-primary/20" />
        <BrandMark inverted />
        <p className="mt-10 text-xs font-bold tracking-[0.2em] text-accent uppercase">
          Website Platform
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
          Every delivery, visible end to end.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-primary-foreground/80">
          A customer-first rethink of tracking, shipping and support — with a
          live view of the global network at its heart.
        </p>
        <p className="mt-10 text-sm text-primary-foreground/80">
          <span className="font-bold text-primary-foreground">
            {presenter.name}
          </span>{' '}
          · {presenter.role}
        </p>
      </div>
    ),
  },
  {
    id: 'challenge',
    title: 'The challenge',
    render: () => (
      <SlideFrame
        eyebrow="The challenge"
        title="Customers want certainty, not more pages."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: MessageSquareWarning,
              title: '“Where is it?”',
              copy: 'Status questions are the largest driver of contact volume. Most can be answered proactively.',
            },
            {
              icon: Puzzle,
              title: 'Fragmented journeys',
              copy: 'Quoting, labelling and pickups often live in separate flows, so people re-enter the same details.',
            },
            {
              icon: Smartphone,
              title: 'Mobile first, really',
              copy: 'Most tracking happens on a phone, on the move — layouts and tap targets must start there.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="size-7 text-accent" aria-hidden />
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </SlideFrame>
    ),
  },
  {
    id: 'principles',
    title: 'Design principles',
    render: () => (
      <SlideFrame
        eyebrow="Approach"
        title="Four principles behind every screen"
      >
        <ol className="grid gap-5 md:grid-cols-2">
          {[
            [
              'Answer first',
              'Put the status, the date and the next action above the fold. Details follow.',
            ],
            [
              'One flow, not five',
              'Rate → ship → pickup is one continuous journey with saved progress.',
            ],
            [
              'Show, don’t tell',
              'Maps and timelines make distance and progress instantly legible.',
            ],
            [
              'Inclusive by default',
              'Keyboard paths, visible focus, reduced-motion support and clear contrast.',
            ],
          ].map(([t, c], i) => (
            <li key={t} className="flex gap-4 rounded-xl border bg-card p-6">
              <span className="font-display text-4xl font-extrabold text-accent">
                0{i + 1}
              </span>
              <span>
                <span className="block text-xl font-bold">{t}</span>
                <span className="mt-1 block text-muted-foreground">{c}</span>
              </span>
            </li>
          ))}
        </ol>
      </SlideFrame>
    ),
  },
  {
    id: 'features',
    title: 'Key features',
    render: () => (
      <SlideFrame
        eyebrow="What’s in the prototype"
        title="Six journeys, all clickable today"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, copy, to }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-lg motion-reduce:transition-none"
            >
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary print:hidden">
                Open demo{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </SlideFrame>
    ),
  },
  {
    id: 'network',
    title: 'Live network map',
    render: () => (
      <SlideFrame
        dark
        eyebrow="Spotlight"
        title="A live window into the global network"
      >
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
          <ul className="space-y-4 text-primary-foreground/85">
            {[
              [
                MousePointerClick,
                'Pan, zoom and click a real world map — no screenshots.',
              ],
              [
                Globe2,
                `${hubs.length} hubs and ${lanes.length} air lanes drawn on true great-circle routes.`,
              ],
              [
                Sparkles,
                'Aircraft move in real time; select one to follow it across an ocean.',
              ],
              [
                Search,
                'Filter by region, search hubs and toggle layers for focused stories.',
              ],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Globe2
              return (
                <li key={text as string} className="flex gap-3">
                  <I
                    className="mt-0.5 size-5 shrink-0 text-accent"
                    aria-hidden
                  />
                  <span>{text as string}</span>
                </li>
              )
            })}
          </ul>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <p className="text-sm text-primary-foreground/70">Try it live</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              Start at the Memphis world hub
            </p>
            <div className="mt-5 flex flex-wrap gap-3 print:hidden">
              <Button
                asChild
                className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/network" search={{ hub: 'mem' }}>
                  <Globe2 /> Open the live map
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link to="/network" search={{ hub: 'can' }}>
                  Asia Pacific view
                </Link>
              </Button>
            </div>
            <p className="mt-4 hidden text-sm print:block">
              Live demo: /network
            </p>
          </div>
        </div>
      </SlideFrame>
    ),
  },
  {
    id: 'design',
    title: 'Design system',
    render: () => (
      <SlideFrame
        eyebrow="Design system"
        title="Tokens first, so the brand scales"
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
              Colour
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                ['bg-primary', 'Primary'],
                ['bg-accent', 'Accent'],
                ['bg-foreground', 'Ink'],
                ['bg-secondary', 'Surface'],
                ['bg-muted', 'Muted'],
                ['bg-destructive', 'Alert'],
              ].map(([cls, label]) => (
                <div key={label}>
                  <div className={cn('h-16 rounded-lg border', cls)} />
                  <p className="mt-1 text-xs font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
              Type
            </h3>
            <p className="mt-3 font-display text-4xl font-extrabold">
              Sora Display
            </p>
            <p className="mt-1 text-lg">
              Manrope for body copy — calm, legible, friendly.
            </p>
            <h3 className="mt-6 text-sm font-bold tracking-widest text-muted-foreground uppercase">
              Components
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Accent
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
            </div>
          </div>
        </div>
      </SlideFrame>
    ),
  },
  {
    id: 'engineering',
    title: 'Engineering & quality',
    render: () => (
      <SlideFrame
        eyebrow="Under the hood"
        title="Built like production, not a mock-up"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Gauge,
              title: 'Fast by default',
              copy: 'Server-rendered React with TanStack Start; images resized and converted at the edge by an image CDN.',
            },
            {
              icon: Accessibility,
              title: 'Accessible',
              copy: 'Semantic headings, labelled controls, keyboard-friendly menus and reduced-motion support.',
            },
            {
              icon: ShieldCheck,
              title: 'Type-safe',
              copy: 'Strict TypeScript, typed routes and validated search params catch bugs before users do.',
            },
            {
              icon: HeartHandshake,
              title: 'Ready for real APIs',
              copy: 'All sample data sits in one module, so live tracking or rating services can plug in cleanly.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="size-6 text-accent" aria-hidden />
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </SlideFrame>
    ),
  },
  {
    id: 'impact',
    title: 'Expected impact',
    render: () => (
      <SlideFrame
        eyebrow="Expected impact"
        title="What success could look like"
      >
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {proposalKpis.map((k) => (
            <div key={k.label} className="border-l-4 border-accent pl-4">
              <dd className="font-display text-5xl font-extrabold text-primary">
                {k.value}
              </dd>
              <dt className="mt-2 font-bold">{k.label}</dt>
              <dd className="text-sm text-muted-foreground">{k.note}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-xs text-muted-foreground">
          Targets are hypotheses to validate with research and A/B testing, not
          measured results.
        </p>
      </SlideFrame>
    ),
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    render: () => (
      <SlideFrame
        eyebrow="Roadmap"
        title="From prototype to production in four phases"
      >
        <ol className="grid gap-4 md:grid-cols-4">
          {roadmap.map((r) => (
            <li
              key={r.phase}
              className="relative rounded-xl border bg-card p-5"
            >
              <p className="text-xs font-bold tracking-widest text-accent uppercase">
                {r.phase}
              </p>
              <p className="text-xs text-muted-foreground">{r.time}</p>
              <h3 className="mt-2 text-lg font-bold">{r.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {r.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                    {i}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </SlideFrame>
    ),
  },
  {
    id: 'thanks',
    title: 'Thank you',
    render: () => (
      <div className="flex h-full flex-col items-start justify-center bg-foreground p-8 text-background md:p-12">
        <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
          Thank you
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
          Questions, ideas, next steps?
        </h2>
        <p className="mt-6 text-lg text-background/80">
          {presenter.name} · {presenter.role}
        </p>
        <p className="text-background/70">{presenter.email}</p>
        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <Button
            asChild
            size="lg"
            className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/">Explore the full prototype</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
          >
            <Link to="/network">Live network map</Link>
          </Button>
        </div>
      </div>
    ),
  },
]

function ProposalPage() {
  const { slide = 1 } = Route.useSearch()
  const navigate = useNavigate({ from: '/proposal' })
  const index = Math.min(Math.max(slide, 1), slides.length) - 1
  const deckRef = useRef<HTMLDivElement>(null)

  const go = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), slides.length - 1)
      void navigate({
        search: { slide: next + 1 },
        replace: true,
        resetScroll: false,
      })
    },
    [navigate],
  )

  const toggleFullscreen = () => {
    const el = deckRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /input|textarea|select/i.test(target.tagName)) return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        go(index + 1)
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(slides.length - 1)
      else if (e.key.toLowerCase() === 'f') toggleFullscreen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="bg-secondary print:bg-background">
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 print:max-w-none print:p-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              FedEx Platform Presentation
            </h1>
            <p className="text-sm text-muted-foreground">
              Use ← → or Space to move, F for full screen. Print saves a PDF
              handout.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> Print / PDF
            </Button>
            <Button onClick={toggleFullscreen}>
              <Expand /> Present
            </Button>
          </div>
        </div>

        <div
          ref={deckRef}
          className="group/deck relative flex flex-col overflow-hidden rounded-2xl border bg-background shadow-xl presenting:rounded-none presenting:border-0 print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
        >
          <div
            className="relative aspect-[16/10] min-h-[34rem] overflow-y-auto presenting:aspect-auto presenting:flex-1 print:aspect-auto print:min-h-0 print:overflow-visible"
            aria-live="polite"
          >
            {slides.map((s, i) => (
              <article
                key={s.id}
                aria-label={`Slide ${i + 1} of ${slides.length}: ${s.title}`}
                aria-hidden={i !== index}
                inert={i !== index}
                className={cn(
                  'slide absolute inset-0 overflow-y-auto transition-opacity duration-300 motion-reduce:transition-none print:relative print:block print:h-[180mm] print:opacity-100',
                  i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
              >
                {s.render()}
                <p className="absolute right-6 bottom-3 hidden text-[10px] text-muted-foreground print:block">
                  Unofficial portfolio concept — not affiliated with or endorsed
                  by FedEx · {i + 1}/{slides.length}
                </p>
              </article>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 border-t bg-background px-4 py-3 print:hidden">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Previous slide"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              <ArrowLeft />
            </Button>
            <div
              className="flex flex-1 items-center gap-1.5 overflow-x-auto"
              role="tablist"
              aria-label="Slides"
            >
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1}: ${s.title}`}
                  onClick={() => go(i)}
                  className={cn(
                    'h-1.5 min-w-6 flex-1 rounded-full bg-muted transition-colors motion-reduce:transition-none',
                    i <= index && 'bg-primary',
                    i === index && 'bg-accent',
                  )}
                />
              ))}
            </div>
            <span className="w-28 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
              {index + 1} / {slides.length} · {slides[index].title}
            </span>
            <Button
              size="icon-sm"
              aria-label="Next slide"
              disabled={index === slides.length - 1}
              onClick={() => go(index + 1)}
            >
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
