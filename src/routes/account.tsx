import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bell,
  Calculator,
  CalendarClock,
  CheckCircle2,
  Home,
  Info,
  MapPin,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Truck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DemoGate } from '@/components/site/demo-gate'
import { useShipments } from '@/lib/shipment-store'
import { demoCustomer, trackingStatusLabels, type TrackingStatus } from '@/lib/site-data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/account')({
  head: () => ({ meta: [{ title: 'My dashboard — FedEx' }] }),
  component: () => (
    <DemoGate require="customer">
      <AccountDashboard />
    </DemoGate>
  ),
})

const statusTone: Record<TrackingStatus, string> = {
  'label-created': 'bg-secondary text-secondary-foreground',
  'in-transit': 'bg-primary text-primary-foreground',
  'out-for-delivery': 'bg-accent text-accent-foreground',
  delivered: 'bg-emerald-600 text-white',
  exception: 'bg-destructive text-white',
}

function AccountDashboard() {
  const shipments = useShipments()
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'attention'>('all')
  const [query, setQuery] = useState('')
  const [prefs, setPrefs] = useState({ email: true, sms: false, weekly: true })

  const list = shipments.filter((s) => {
    const q = query.trim()
    const match =
      filter === 'all' ||
      (filter === 'active' && ['in-transit', 'out-for-delivery', 'label-created'].includes(s.status)) ||
      (filter === 'delivered' && s.status === 'delivered') ||
      (filter === 'attention' && s.status === 'exception')
    return match && (!q || [s.trackingNumber, s.origin, s.destination].join(' ').toLowerCase().includes(q.toLowerCase()))
  })

  const active = shipments.filter((s) => s.status !== 'delivered').length
  const spend = demoCustomer.monthlySpend
  const maxSpend = Math.max(...spend.map((m) => m.amount))

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">Customer dashboard · Demo</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Welcome back, {demoCustomer.name.split(' ')[0]}
            </h1>
            <p className="mt-2 text-primary-foreground/75">
              {demoCustomer.company} · Account {demoCustomer.accountNumber} · {demoCustomer.tier}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
              <Link to="/shipping">
                <PackagePlus /> New shipment
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/shipping">
                <CalendarClock /> Schedule pickup
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-content space-y-8 px-4 py-10 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Truck, label: 'Active shipments', value: String(active) },
            { icon: AlertTriangle, label: 'Need attention', value: String(shipments.filter((s) => s.status === 'exception').length) },
            { icon: CheckCircle2, label: 'Delivered this month', value: '27' },
            { icon: Wallet, label: 'Spend this month', value: `$${spend[spend.length - 1].amount.toLocaleString('en-US')}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4 text-accent" aria-hidden /> {label}
              </dt>
              <dd className="mt-2 font-display text-3xl font-extrabold text-primary">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="ship-h" className="rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
              <h2 id="ship-h" className="text-lg font-bold">My shipments</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Label htmlFor="ship-search" className="sr-only">Search shipments</Label>
                <Input id="ship-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tracking number or city" className="pl-9" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 px-5 pt-4" role="group" aria-label="Filter shipments">
              {(
                [
                  ['all', 'All'],
                  ['active', 'In progress'],
                  ['attention', 'Needs attention'],
                  ['delivered', 'Delivered'],
                ] as const
              ).map(([k, l]) => (
                <Button key={k} size="xs" variant={filter === k ? 'default' : 'outline'} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                  {l}
                </Button>
              ))}
            </div>
            <ul className="divide-y p-2">
              {list.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">No shipments match.</li>
              )}
              {list.map((s) => (
                <li key={s.trackingNumber}>
                  <Link
                    to="/tracking"
                    search={{ id: s.trackingNumber }}
                    className="flex flex-wrap items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary motion-reduce:transition-none"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                      <Package className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-sm font-bold">{s.trackingNumber}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {s.origin} → {s.destination}
                      </span>
                    </span>
                    <span className="text-right">
                      <Badge className={statusTone[s.status]}>{trackingStatusLabels[s.status]}</Badge>
                      <span className="mt-1 block text-xs text-muted-foreground">{s.service}</span>
                    </span>
                    <span className="w-full text-xs text-muted-foreground sm:w-auto">
                      <span className="mr-2 inline-block w-0 sm:hidden" />
                      {s.estimatedDelivery}
                    </span>
                    <span className="relative hidden h-1.5 w-full overflow-hidden rounded-full bg-muted sm:block">
                      <span
                        className={cn('absolute inset-y-0 left-0 rounded-full bg-primary', s.status === 'exception' && 'bg-destructive')}
                        style={{ width: `${Math.round(s.progress * 100)}%` }}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-6">
            <section aria-labelledby="notif-h" className="rounded-xl border bg-card p-5">
              <h2 id="notif-h" className="flex items-center gap-2 font-bold">
                <Bell className="size-4 text-accent" aria-hidden /> Notifications
              </h2>
              <ul className="mt-4 space-y-3">
                {demoCustomer.notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 text-sm">
                    {n.level === 'action' ? (
                      <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
                    ) : n.level === 'success' ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                    ) : (
                      <Info className="size-4 shrink-0 text-primary" aria-hidden />
                    )}
                    <span className="flex-1">
                      {n.text}
                      <span className="block text-xs text-muted-foreground">{n.time}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="quick-h" className="rounded-xl border bg-card p-5">
              <h2 id="quick-h" className="font-bold">Quick actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  [
                    [Calculator, 'Get a rate', '/shipping'],
                    [MapPin, 'Find location', '/locations'],
                    [Search, 'Track', '/tracking'],
                    [Truck, 'Live network', '/network'],
                  ] as const
                ).map(([Icon, label, to]) => (
                  <Button key={label} variant="outline" asChild className="h-auto flex-col py-3">
                    <Link to={to}>
                      <Icon /> {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section aria-labelledby="spend-h" className="rounded-xl border bg-card p-5 lg:col-span-1">
            <h2 id="spend-h" className="font-bold">Shipping spend</h2>
            <p className="text-sm text-muted-foreground">Last six months (sample)</p>
            <ul className="mt-5 flex h-40 items-end gap-3" aria-label="Monthly shipping spend">
              {spend.map((m, i) => (
                <li key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">${(m.amount / 1000).toFixed(1)}k</span>
                  <span
                    className={cn('w-full rounded-t-md bg-primary/70', i === spend.length - 1 && 'bg-accent')}
                    style={{ height: `${(m.amount / maxSpend) * 100}px` }}
                    title={`${m.month}: $${m.amount}`}
                  />
                  <span className="text-xs">{m.month}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="addr-h" className="rounded-xl border bg-card p-5">
            <h2 id="addr-h" className="font-bold">Saved addresses</h2>
            <ul className="mt-4 space-y-3">
              {demoCustomer.savedAddresses.map((a) => (
                <li key={a.label} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <Home className="mt-0.5 size-4 text-accent" aria-hidden />
                  <span className="flex-1">
                    <span className="block font-semibold">{a.label}</span>
                    <span className="text-muted-foreground">{a.line}</span>
                  </span>
                  <Button size="icon-xs" variant="ghost" aria-label={`Edit ${a.label} address`} onClick={() => toast('Address editing is simulated in this demo.')}>
                    <Pencil />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pref-h" className="rounded-xl border bg-card p-5">
            <h2 id="pref-h" className="font-bold">Notification preferences</h2>
            <div className="mt-4 space-y-4">
              {(
                [
                  ['email', 'Email updates for every scan'],
                  ['sms', 'Text me on delivery day'],
                  ['weekly', 'Weekly shipping summary'],
                ] as const
              ).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <Label htmlFor={`pref-${k}`} className="font-medium">{l}</Label>
                  <Switch
                    id={`pref-${k}`}
                    checked={prefs[k]}
                    onCheckedChange={(v) => {
                      setPrefs((p) => ({ ...p, [k]: v }))
                      toast.success('Preference updated (demo)')
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
