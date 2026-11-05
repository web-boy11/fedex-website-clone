import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  Calculator,
  Globe2,
  Leaf,
  MapPin,
  PackagePlus,
  Plane,
  Store,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TrackForm } from '@/components/site/track-form'
import { cdnImage } from '@/lib/img'
import { stats } from '@/lib/site-data'

export const Route = createFileRoute('/')({
  component: Home,
})

const quickActions = [
  { label: 'Rate & ship', icon: Calculator, to: '/shipping' },
  { label: 'Create a shipment', icon: PackagePlus, to: '/shipping' },
  { label: 'Schedule a pickup', icon: CalendarClock, to: '/shipping' },
  { label: 'Find a location', icon: MapPin, to: '/locations' },
  { label: 'Live network map', icon: Globe2, to: '/network' },
] as const
const features = [
  {
    eyebrow: 'Small business',
    title: 'Shipping that scales with your shop',
    copy: 'Discounted rates, saved addresses and one-click labels for teams of one to one hundred.',
    image: 'business.png',
    to: '/business',
    icon: Store,
  },
  {
    eyebrow: 'Freight',
    title: 'From a single pallet to a full truckload',
    copy: 'Book less-than-truckload and dedicated freight with live capacity and pickup windows.',
    image: 'freight.png',
    to: '/business',
    icon: Boxes,
  },
  {
    eyebrow: 'Sustainability',
    title: 'Cleaner miles, every delivery',
    copy: 'Electric vans, smarter routes and carbon reporting built into every account.',
    image: 'sustainability.png',
    to: '/',
    icon: Leaf,
  },
] as const

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img
          src={cdnImage('hero.png', 1800)}
          srcSet={`${cdnImage('hero.png', 900)} 900w, ${cdnImage('hero.png', 1800)} 1800w`}
          sizes="100vw"
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover object-right"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary/85 to-primary/10" />
        <div className="mx-auto max-w-content px-4 py-20 sm:px-6 md:py-28">
          <p className="mb-4 text-xs font-bold tracking-[0.2em] text-accent uppercase">
            Track · Ship · Deliver
          </p>
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
            Where is it now? Know in one tap.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/80">
            Live status, delivery windows and changes on the go — for every
            parcel, pallet and passport-bound package.
          </p>
          <TrackForm className="mt-8 max-w-2xl" />
        </div>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="relative z-10 -mt-8">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <ul className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card shadow-lg sm:grid-cols-3 lg:grid-cols-5">
            {quickActions.map(({ label, icon: Icon, to }) => (
              <li key={label} className="border-b border-r last:border-r-0">
                <Link
                  to={to}
                  className="group flex h-full flex-col items-center gap-3 px-4 py-6 text-center transition-colors hover:bg-secondary motion-reduce:transition-none"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-bold">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-content px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
              Solutions
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Built for how you ship
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/business">
              All business solutions <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-xl motion-reduce:transition-none"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={cdnImage(f.image, 720)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
              <div className="p-6">
                <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase">
                  <f.icon className="size-4" aria-hidden /> {f.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.copy}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                  Learn more
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Global network band */}
      <section className="bg-secondary">
        <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
              src={cdnImage('air.png', 1000)}
              alt="Cargo jet being loaded with freight containers at dusk"
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-accent uppercase">
              <Plane className="size-4" aria-hidden /> Global network
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Overnight is a promise, not a guess.
            </h2>
            <p className="mt-4 text-muted-foreground">
              An integrated air-and-ground network connects hubs on every
              continent, so time-definite delivery holds up — across town or
              across an ocean.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="border-l-2 border-accent pl-4">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-3xl font-extrabold text-primary">
                    {s.value}
                  </dd>
                  <dd className="text-sm text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/network">
                  <Globe2 /> Explore the live network map
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-content px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-foreground p-10 text-background md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">
              Ready to send something?
            </h2>
            <p className="mt-2 text-background/70">
              Get a rate in seconds and print your label at home or in store.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
              asChild
            >
              <Link to="/shipping">Get a quote</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link to="/locations">Find a location</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
