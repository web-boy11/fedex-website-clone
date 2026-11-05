import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Mail,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHero } from '@/components/site/page-hero'
import { ShippingLabel } from '@/components/site/shipping-label'
import { createShipment } from '@/lib/shipment-store'
import { sendEmail, createShipmentConfirmationHtml } from '@/lib/email-service'
import { packageTypes, quoteRate, rateOptions, type Shipment } from '@/lib/site-data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/shipping')({
  head: () => ({ meta: [{ title: 'Ship & rates — FedEx' }] }),
  component: ShippingPage,
})

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

// Zone calculation from ZIP codes
function zoneFor(from: string, to: string) {
  const a = Number(from[0])
  const b = Number(to[0])
  if (Number.isNaN(a) || Number.isNaN(b)) return 4
  return Math.min(8, 2 + Math.abs(a - b))
}

function ShippingPage() {
  return (
    <>
      <PageHero
        eyebrow="Shipping"
        title="Rate, ship and schedule in one place"
        description="Compare services, create a label in four short steps, or book a pickup — without leaving this page."
      />
      <section className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <Tabs defaultValue="rates">
          <TabsList className="mb-8">
            <TabsTrigger value="rates">Rates & transit</TabsTrigger>
            <TabsTrigger value="create">Create a shipment</TabsTrigger>
            <TabsTrigger value="pickup">Schedule a pickup</TabsTrigger>
          </TabsList>
          <TabsContent value="rates">
            <RateQuote />
          </TabsContent>
          <TabsContent value="create">
            <CreateShipment />
          </TabsContent>
          <TabsContent value="pickup">
            <SchedulePickup />
          </TabsContent>
        </Tabs>
      </section>
    </>
  )
}

function RateQuote() {
  const [from, setFrom] = useState('38118')
  const [to, setTo] = useState('11201')
  const [weight, setWeight] = useState('3')
  const [pkg, setPkg] = useState('own')

  const weightLb = Math.max(0.1, Number(weight) || 0)
  const zone = zoneFor(from, to)
  const quotes = useMemo(
    () => rateOptions.map((o) => ({ ...o, price: quoteRate(o, weightLb, zone) })),
    [weightLb, zone],
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form
        className="space-y-4 rounded-xl border bg-card p-6"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Rate quote"
      >
        <h2 className="text-lg font-bold">Your package</h2>
        <Field id="from" label="From ZIP">
          <Input id="from" value={from} inputMode="numeric" maxLength={5} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field id="to" label="To ZIP">
          <Input id="to" value={to} inputMode="numeric" maxLength={5} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field id="weight" label="Weight (lb)">
          <Input id="weight" type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <Field id="pkg" label="Packaging">
          <Select value={pkg} onValueChange={setPkg}>
            <SelectTrigger id="pkg" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {packageTypes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <p className="text-xs text-muted-foreground">
          Calculated for Zone {zone}. Final rates include fuel surcharge and destination handling.
        </p>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Available services</h2>
        {quotes.map((q) => (
          <div
            key={q.id}
            className="flex flex-col gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center motion-reduce:transition-none"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{q.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{q.transit}</p>
            </div>
            <p className="font-display text-2xl font-extrabold text-primary">
              {money(q.price)}
            </p>
            <Button
              className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
              onClick={() => toast.success(`${q.name} selected — proceed to “Create a shipment”.`)}
            >
              Select Service
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

const steps = ['From', 'To', 'Package', 'Review'] as const

type Address = { name: string; street: string; city: string; zip: string }
const emptyAddress: Address = { name: '', street: '', city: '', zip: '' }

function CreateShipment() {
  const [step, setStep] = useState(0)
  const [sender, setSender] = useState<Address>({
    name: 'Office Dispatch',
    street: '120 W 42nd St',
    city: 'New York, NY',
    zip: '10036',
  })
  const [recipient, setRecipient] = useState<Address>(emptyAddress)
  const [weight, setWeight] = useState('2.4')
  const [service, setService] = useState('priority-overnight')
  const [signature, setSignature] = useState(false)
  
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null)
  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const chosen = rateOptions.find((o) => o.id === service) ?? rateOptions[0]
  const price = quoteRate(
    chosen,
    Math.max(0.1, Number(weight) || 0),
    zoneFor(sender.zip, recipient.zip),
  ) + (signature ? 6.5 : 0)

  const stepValid = [
    isComplete(sender),
    isComplete(recipient),
    Number(weight) > 0,
    true,
  ][step]

  const handleCreateLabel = () => {
    const newShipment = createShipment({
      senderName: sender.name,
      senderStreet: sender.street,
      senderCity: sender.city,
      senderZip: sender.zip,
      recipientName: recipient.name,
      recipientStreet: recipient.street,
      recipientCity: recipient.city,
      recipientZip: recipient.zip,
      weight: weight || '2.0',
      service: chosen.name,
      signatureRequired: signature,
    })

    setCreatedShipment(newShipment)
    setDone(true)
    toast.success(`Shipment created with tracking #${newShipment.trackingNumber}`)
    void sendEmail({
      to: 'dispatch@office-model.internal',
      subject: 'Shipment Confirmation #' + newShipment.trackingNumber,
      html: createShipmentConfirmationHtml(newShipment),
      template: 'shipment-confirmation',
      trackingNumber: newShipment.trackingNumber,
    })
  }

  if (done && createdShipment) {
    return (
      <div className="mx-auto max-w-reading rounded-xl border bg-card p-10 text-center shadow-lg space-y-6">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-600 text-white shadow-md">
          <Check className="size-8" />
        </span>
        
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Shipping Label Ready</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your package has been booked and registered with the FedEx logistics network.
          </p>
        </div>

        <div className="rounded-lg bg-secondary/60 p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tracking Number</span>
            <div className="font-mono text-xl font-bold text-primary">
              {createdShipment.trackingNumber}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Service: <span className="font-medium text-foreground">{createdShipment.service}</span> · {createdShipment.weight}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(createdShipment.trackingNumber)
                toast.success('Tracking number copied!')
              }}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
            <Button
              size="sm"
              asChild
            >
              <Link to="/tracking" search={{ id: createdShipment.trackingNumber }}>
                Track Now <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 text-left">
          <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-foreground">
            <Mail className="size-4 text-primary" /> Email Confirmation & Tracking Link
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="e.g. client@company.com"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              className="text-sm"
            />
            <Button
              variant="secondary"
              disabled={!emailRecipient || isSendingEmail}
              onClick={async () => {
                if (!emailRecipient) return
                setIsSendingEmail(true)
                try {
                  await sendEmail({
                    to: emailRecipient,
                    subject: `FedEx Shipment Confirmation #${createdShipment.trackingNumber}`,
                    html: createShipmentConfirmationHtml(createdShipment),
                    template: 'shipment-confirmation',
                    trackingNumber: createdShipment.trackingNumber,
                  })
                  toast.success(`Shipment confirmation sent to ${emailRecipient}`)
                } catch {
                  toast.error('Unable to dispatch email')
                } finally {
                  setIsSendingEmail(false)
                }
              }}
            >
              {isSendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground font-bold"
            onClick={() => setLabelModalOpen(true)}
          >
            <Printer className="size-4" /> Print 4×6 Shipping Label
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setDone(false)
              setStep(0)
              setRecipient(emptyAddress)
              setCreatedShipment(null)
              setEmailRecipient('')
            }}
          >
            Ship Another Package
          </Button>
        </div>

        <ShippingLabel
          shipment={createdShipment}
          open={labelModalOpen}
          onOpenChange={setLabelModalOpen}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-xl border bg-card p-6">
        <ol className="mb-8 flex items-center gap-2" aria-label="Steps">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold',
                  i < step && 'border-primary bg-primary text-primary-foreground',
                  i === step && 'border-accent bg-accent text-accent-foreground',
                )}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn('hidden text-sm font-semibold sm:inline', i !== step && 'text-muted-foreground')}>
                {label}
              </span>
              {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {step === 0 && <AddressFields title="Sender Information" value={sender} onChange={setSender} prefix="s" />}
        {step === 1 && <AddressFields title="Recipient Information" value={recipient} onChange={setRecipient} prefix="r" />}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Package & Service Selection</h2>
            <Field id="c-weight" label="Weight (lb)">
              <Input id="c-weight" type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="max-w-40" />
            </Field>
            <RadioGroup value={service} onValueChange={setService} className="gap-2">
              {rateOptions.map((o) => (
                <Label
                  key={o.id}
                  htmlFor={`svc-${o.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                >
                  <RadioGroupItem id={`svc-${o.id}`} value={o.id} />
                  <span className="flex-1">
                    <span className="block font-semibold">{o.name}</span>
                    <span className="block text-xs text-muted-foreground">{o.transit}</span>
                  </span>
                  <span className="font-bold">
                    {money(quoteRate(o, Number(weight) || 0, zoneFor(sender.zip, recipient.zip)))}
                  </span>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="sig" className="font-semibold">Direct signature required</Label>
                <p className="text-xs text-muted-foreground">Recipient must sign in person (+ $6.50)</p>
              </div>
              <Switch id="sig" checked={signature} onCheckedChange={setSignature} />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Review shipment details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <AddressSummary title="From (Sender)" a={sender} />
              <AddressSummary title="To (Recipient)" a={recipient} />
            </div>
            <p className="text-sm">
              {chosen.name} · {weight} lb{signature ? ' · Signature required' : ''}
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <ChevronLeft /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button disabled={!stepValid} onClick={() => setStep(step + 1)}>
              Continue <ChevronRight />
            </Button>
          ) : (
            <Button
              className="bg-accent font-bold text-accent-foreground hover:bg-accent/90"
              onClick={handleCreateLabel}
            >
              Generate & Book Label
            </Button>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-xl border bg-secondary p-6">
        <h2 className="font-bold">Shipment Cost</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Service</dt><dd className="font-semibold">{chosen.name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Weight</dt><dd className="font-semibold">{weight || '—'} lb</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Signature</dt><dd className="font-semibold">{signature ? 'Yes' : 'No'}</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t pt-4">
          <span className="font-semibold">Estimated total</span>
          <span className="font-display text-2xl font-extrabold text-primary">{money(price)}</span>
        </div>
      </aside>
    </div>
  )
}

function isComplete(a: Address) {
  return a.name.trim() && a.street.trim() && a.city.trim() && /^\d{5}$/.test(a.zip)
}

function AddressFields({
  title,
  value,
  onChange,
  prefix,
}: {
  title: string
  value: Address
  onChange: (a: Address) => void
  prefix: string
}) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value })
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${prefix}-name`} label="Full name / Company">
          <Input id={`${prefix}-name`} value={value.name} onChange={set('name')} placeholder="e.g. Acme Logistics" autoComplete="off" />
        </Field>
        <Field id={`${prefix}-street`} label="Street address">
          <Input id={`${prefix}-street`} value={value.street} onChange={set('street')} placeholder="e.g. 500 Market St" autoComplete="off" />
        </Field>
        <Field id={`${prefix}-city`} label="City, State">
          <Input id={`${prefix}-city`} value={value.city} onChange={set('city')} placeholder="e.g. Chicago, IL" autoComplete="off" />
        </Field>
        <Field id={`${prefix}-zip`} label="ZIP code (5 digits)">
          <Input id={`${prefix}-zip`} value={value.zip} inputMode="numeric" maxLength={5} placeholder="e.g. 60601" onChange={set('zip')} autoComplete="off" />
        </Field>
      </div>
    </div>
  )
}

function AddressSummary({ title, a }: { title: string; a: Address }) {
  return (
    <div className="rounded-lg border p-4 text-sm bg-card">
      <p className="mb-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">{title}</p>
      <p className="font-semibold">{a.name}</p>
      <p>{a.street}</p>
      <p>{a.city} {a.zip}</p>
    </div>
  )
}

function SchedulePickup() {
  const [date, setDate] = useState('')
  const [pickupWindow, setPickupWindow] = useState('afternoon')
  const [count, setCount] = useState('1')

  return (
    <form
      className="mx-auto max-w-2xl space-y-6 rounded-xl border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!date) {
          toast.error('Choose a pickup date.')
          return
        }
        toast.success(`Pickup scheduled for ${date} (${pickupWindow}) for ${count} package(s). Dispatch notified.`)
      }}
    >
      <h2 className="text-lg font-bold">When should our courier come by?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-date" label="Pickup date">
          <Input id="p-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field id="p-count" label="Number of packages">
          <Input id="p-count" type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} />
        </Field>
      </div>
      <RadioGroup value={pickupWindow} onValueChange={setPickupWindow} className="grid gap-2 sm:grid-cols-3">
        {[
          ['morning', 'Morning', '9 AM – 12 PM'],
          ['afternoon', 'Afternoon', '12 – 4 PM'],
          ['evening', 'Evening', '4 – 7 PM'],
        ].map(([v, label, hint]) => (
          <Label
            key={v}
            htmlFor={`win-${v}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
          >
            <RadioGroupItem id={`win-${v}`} value={v} />
            <span>
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
      <Button type="submit" className="w-full sm:w-auto font-bold">
        Confirm Pickup Window
      </Button>
    </form>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
