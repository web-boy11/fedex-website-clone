import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, Boxes, FileText, Globe2, Percent, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/site/page-hero'
import { cdnImage } from '@/lib/img'

export const Route = createFileRoute('/business')({
  head: () => ({ meta: [{ title: 'Business solutions — FedEx' }] }),
  component: BusinessPage,
})

const pillars = [
  { icon: Percent, title: 'Volume-based savings', copy: 'Rates that improve automatically as your monthly volume grows.' },
  { icon: Users, title: 'Team accounts', copy: 'Shared address books, roles and per-department billing.' },
  { icon: BarChart3, title: 'Shipping insights', copy: 'Spend, on-time rate and carbon footprint on one dashboard.' },
  { icon: Globe2, title: 'Cross-border made simple', copy: 'Duty estimates and digital customs documents at checkout.' },
  { icon: Boxes, title: 'Freight on demand', copy: 'Quote and book pallets alongside parcels in the same flow.' },
  { icon: FileText, title: 'API & integrations', copy: 'Connect your store, ERP or warehouse system in an afternoon.' },
]

function BusinessPage() {
  return (
    <>
      <PageHero
        eyebrow="Business"
        title="Logistics that keeps up with your growth"
        description="Whether you ship ten orders a week or ten thousand a day, the same tools scale with you."
      />

      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="rounded-xl border bg-card p-6">
              <Icon className="size-6 text-accent" aria-hidden />
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </li>
          ))}
        </ul>
      </section>

      {[
        { img: 'business.png', eyebrow: 'Small business hub', title: 'Your first thousand shipments, sorted', copy: 'Guided onboarding, printable packing slips and a returns portal your customers will actually enjoy using.', flip: false },
        { img: 'freight.png', eyebrow: 'Freight & LTL', title: 'Pallets without the paperwork', copy: 'Instant freight quotes, dock appointment booking and live trailer tracking from the same account you use for parcels.', flip: true },
      ].map((b) => (
        <section key={b.title} className="border-t">
          <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
            <img
              src={cdnImage(b.img, 1000)}
              alt=""
              loading="lazy"
              className={`aspect-[4/3] w-full rounded-2xl object-cover shadow-lg ${b.flip ? 'lg:order-2' : ''}`}
            />
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">{b.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">{b.title}</h2>
              <p className="mt-4 text-muted-foreground">{b.copy}</p>
              <Button className="mt-6" asChild>
                <Link to="/shipping">
                  Get a quote <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
