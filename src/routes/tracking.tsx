import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  PackageCheck,
  PenLine,
  Printer,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { PageHero } from '@/components/site/page-hero'
import { TrackForm } from '@/components/site/track-form'
import { RouteMap } from '@/components/map/route-map'
import { ShippingLabel } from '@/components/site/shipping-label'
import { useShipment } from '@/lib/shipment-store'
import {
  sampleTrackingNumbers,
  trackingStatusLabels,
  trackingSteps,
  type Shipment,
} from '@/lib/site-data'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  id: z.coerce.string().optional(),
})

export const Route = createFileRoute('/tracking')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: 'Track a package — FedEx' }] }),
  component: TrackingPage,
})

function TrackingPage() {
  const { id } = Route.useSearch()
  const shipment = useShipment(id)

  return (
    <>
      <PageHero
        eyebrow="Tracking"
        title="Track your shipment"
        description="Enter your 12-digit tracking number to see where it is, when it arrives, and view shipping documentation."
      >
        <TrackForm key={id} defaultValue={id ?? ''} />
      </PageHero>

      <section className="mx-auto max-w-content px-4 py-12 sm:px-6">
        {!id && <EmptyState />}
        {id && !shipment && <NotFound id={id} />}
        {shipment && <ShipmentDetail shipment={shipment} />}
      </section>
    </>
  )
}

function EmptyState() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[
        { icon: PackageCheck, title: 'Live status', copy: 'Every scan from pickup to doorstep, in plain language.' },
        { icon: PenLine, title: 'Manage delivery', copy: 'Redirect, hold at a location, or choose another day.' },
        { icon: MapPin, title: 'Live route map', copy: 'See where your package is on a real map, end to end.' },
      ].map(({ icon: Icon, title, copy }) => (
        <div key={title} className="rounded-xl border bg-card p-6">
          <Icon className="size-6 text-accent" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
        </div>
      ))}
    </div>
  )
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-reading rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="mx-auto size-8 text-destructive" aria-hidden />
      <h2 className="mt-3 text-xl font-bold">We couldn’t find shipment #{id}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Check the number or try one of these available tracking numbers:
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {sampleTrackingNumbers.map((n) => (
          <Button key={n} variant="outline" size="sm" asChild>
            <Link to="/tracking" search={{ id: n }} className="font-mono">
              {n}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

function ShipmentDetail({ shipment }: { shipment: Shipment }) {
  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const isException = shipment.status === 'exception'
  const currentStep = isException
    ? 1
    : trackingSteps.indexOf(shipment.status)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {/* Summary */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Tracking Number
              </p>
              <p className="font-mono text-xl font-bold text-primary">
                {shipment.trackingNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setLabelModalOpen(true)}>
                <Printer className="size-3.5" /> View Label
              </Button>
              <Badge
                className={cn(
                  'text-sm',
                  isException && 'bg-destructive text-white',
                  shipment.status === 'delivered' && 'bg-emerald-600 text-white',
                )}
              >
                {trackingStatusLabels[shipment.status]}
              </Badge>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {shipment.status === 'delivered' ? 'Delivery date' : 'Estimated delivery'}
          </p>
          <p className="font-display text-2xl font-extrabold text-primary md:text-3xl">
            {shipment.estimatedDelivery}
          </p>

          {/* Progress steps */}
          <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Shipment progress">
            {trackingSteps.map((step, i) => {
              const done = i <= currentStep
              const flagged = isException && i === currentStep
              return (
                <li key={step} className="space-y-2">
                  <div
                    className={cn(
                      'h-1.5 rounded-full bg-muted',
                      done && 'bg-primary',
                      flagged && 'bg-destructive',
                    )}
                  />
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      done ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {flagged ? 'Delayed' : trackingStatusLabels[step]}
                  </p>
                </li>
              )
            })}
          </ol>

          <div className="mt-6 flex flex-wrap gap-2 text-sm border-t pt-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-muted-foreground" /> {shipment.origin}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5 font-semibold">
              <MapPin className="size-4 text-accent" /> {shipment.destination}
            </span>
          </div>
        </div>

        <RouteMap
          origin={shipment.originCoords}
          destination={shipment.destinationCoords}
          progress={shipment.progress}
          originLabel={shipment.origin}
          destinationLabel={shipment.destination}
          flagged={isException}
        />

        {isException && (
          <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-bold">Action needed</p>
              <p className="text-sm text-muted-foreground">
                Customs requires a commercial invoice before this shipment can proceed to the destination.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => toast.success('Commercial invoice uploaded. Processing clearance.')}
              >
                Upload documents
              </Button>
            </div>
          </div>
        )}

        {/* Travel history */}
        <div>
          <h2 className="text-xl font-bold">Travel history</h2>
          <ol className="mt-4 space-y-0">
            {shipment.events.map((event, i) => (
              <li key={`${event.date}-${event.time}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                {i < shipment.events.length - 1 && (
                  <span aria-hidden className="absolute top-5 left-[9px] h-full w-px bg-border" />
                )}
                {i === 0 ? (
                  <CheckCircle2 className="relative size-5 shrink-0 fill-background text-primary" />
                ) : (
                  <Circle className="relative size-5 shrink-0 fill-background text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className={cn('font-semibold', i === 0 && 'text-primary')}>
                    {event.description}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{event.date}</p>
                  <p className="text-muted-foreground">{event.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-bold">Manage this delivery</h2>
          <div className="mt-4 grid gap-2">
            <ManageDeliveryDialog shipment={shipment} />
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href)
                toast.success('Tracking link copied')
              }}
            >
              <Share2 /> Share tracking link
            </Button>
            <Button
              variant="outline"
              onClick={() => setLabelModalOpen(true)}
            >
              <Printer /> Print 4×6 Shipping Label
            </Button>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-bold">Shipment facts</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Service', shipment.service],
              ['Weight', shipment.weight],
              ['Pieces', String(shipment.pieces)],
              ['Signature', shipment.signatureRequired ? 'Required' : 'Not required'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <ShippingLabel
        shipment={shipment}
        open={labelModalOpen}
        onOpenChange={setLabelModalOpen}
      />
    </div>
  )
}

function ManageDeliveryDialog({ shipment }: { shipment: Shipment }) {
  const disabled = shipment.status === 'delivered'
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Clock /> {disabled ? 'Already delivered' : 'Change delivery'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change delivery</DialogTitle>
          <DialogDescription>
            Choose what should happen to {shipment.trackingNumber}.
          </DialogDescription>
        </DialogHeader>
        <form
          id="manage-delivery"
          onSubmit={(e) => {
            e.preventDefault()
            toast.success('Delivery instructions updated with dispatch.')
          }}
        >
          <RadioGroup defaultValue="hold" className="gap-3">
            {[
              ['hold', 'Hold at a nearby location', 'Pick it up when it suits you'],
              ['reschedule', 'Deliver on another day', 'Choose a date within 5 days'],
              ['redirect', 'Redirect to another address', 'Fees may apply'],
              ['instructions', 'Add delivery instructions', 'e.g. leave with the concierge'],
            ].map(([value, label, hint]) => (
              <Label
                key={value}
                htmlFor={`opt-${value}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
              >
                <RadioGroupItem id={`opt-${value}`} value={value} className="mt-0.5" />
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" form="manage-delivery">
              Confirm
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
