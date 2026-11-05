import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useShipments,
  updateShipmentStatus,
  clearAllShipments,
  loadSampleShipments,
} from '@/lib/shipment-store'
import { ShippingLabel } from '@/components/site/shipping-label'
import {
  sendEmail,
  createStatusUpdateHtml,
  getEmailOutbox,
  clearEmailOutbox,
  type DispatchedEmail,
} from '@/lib/email-service'
import { cn } from '@/lib/utils'
import { adminUsers, dailyShipmentsK, supportTickets, type AdminUser, type Shipment, type TrackingStatus } from '@/lib/site-data'

const STAFF_PIN = 'fedex2026'
const AUTH_KEY = 'fedex_staff_auth_session'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Operations Console — Staff Gateway' }] }),
  component: AdminPage,
})

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [pinInput, setPinInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true'
    setIsAuthenticated(isAuth)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput.trim() === STAFF_PIN) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      setErrorMsg('')
      toast.success('Staff Console Unlocked')
    } else {
      setErrorMsg('Invalid staff passkey. Please check with your supervisor.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(false)
    setPinInput('')
    toast('Staff Console Locked')
  }

  if (!isAuthenticated) {

  return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardHeader className="text-center space-y-2">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Lock className="size-6" />
            </span>
            <CardTitle className="text-2xl font-extrabold tracking-tight">Staff Operations Gateway</CardTitle>
            <CardDescription className="text-xs">
              Restricted pathway for office personnel and logistics dispatchers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-pin">Staff Authorization PIN</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="staff-pin"
                    type="password"
                    placeholder="Enter Staff Passkey"
                    className="pl-9 font-mono"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value)
                      setErrorMsg('')
                    }}
                    autoFocus
                  />
                </div>
                {errorMsg && <p className="text-xs font-semibold text-destructive">{errorMsg}</p>}
                <p className="text-[11px] text-muted-foreground">
                  Default office access PIN: <code className="rounded bg-muted px-1 py-0.5 font-bold font-mono">fedex2026</code>
                </p>
              </div>

              <Button type="submit" className="w-full font-bold">
                Authorize & Access Console
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AdminDashboard onLock={handleLogout} />
}

type SupportTicket = {
  id: string
  subject: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In progress' | 'Resolved'
  age: string
}

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const shipments = useShipments()
  const [users, setUsers] = useState<Array<AdminUser>>(adminUsers)
  const [userQuery, setUserQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')

  const [tickets, setTickets] = useState<Array<SupportTicket>>(supportTickets)
  const [ticketFilter, setTicketFilter] = useState<'all' | 'Open' | 'In progress' | 'Resolved'>('all')

  // Selected shipment for printing label or changing status
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null)
  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  // Status update modal state
  const [newStatus, setNewStatus] = useState<TrackingStatus>('in-transit')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  // Email outbox state
  const [outbox, setOutbox] = useState<Array<DispatchedEmail>>([])
  const [previewEmail, setPreviewEmail] = useState<DispatchedEmail | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [testEmailOpen, setTestEmailOpen] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState('')
  const [testEmailSending, setTestEmailSending] = useState(false)

  useEffect(() => {
    setOutbox(getEmailOutbox())
    const handleUpdate = () => setOutbox(getEmailOutbox())
    window.addEventListener('fedex_email_outbox_updated', handleUpdate)
    return () => window.removeEventListener('fedex_email_outbox_updated', handleUpdate)
  }, [])

  // Metrics
  const totalVolumeK = dailyShipmentsK.reduce((acc, curr) => acc + curr, 0)
  const averageVolumeK = (totalVolumeK / dailyShipmentsK.length).toFixed(1)
  const openTicketsCount = tickets.filter((t) => t.status === 'Open').length

  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase())
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchesQuery && matchesRole
  })

  const filteredTickets = tickets.filter((t) => {
    return ticketFilter === 'all' || t.status === ticketFilter
  })

  const openStatusEditor = (shipment: Shipment) => {
    setActiveShipment(shipment)
    setNewStatus(shipment.status)
    setEventLocation(shipment.destination.split(',')[0] + ' Station')
    setEventDescription('')
    setStatusModalOpen(true)
  }

  const handleSaveStatus = () => {
    if (!activeShipment) return
    updateShipmentStatus(activeShipment.trackingNumber, newStatus, {
      location: eventLocation || undefined,
      description: eventDescription || undefined,
    })

    // Dispatch status update email notification
    void sendEmail({
      to: 'customer@office-model.internal',
      subject: `Tracking Update #${activeShipment.trackingNumber} — ${newStatus.replace('-', ' ').toUpperCase()}`,
      html: createStatusUpdateHtml(activeShipment, newStatus, eventDescription || eventLocation),
      template: 'status-update',
      trackingNumber: activeShipment.trackingNumber,
    })

    toast.success(`Shipment ${activeShipment.trackingNumber} updated to ${newStatus}. Notification dispatched.`)
    setStatusModalOpen(false)
  }

  const openLabelPrinter = (shipment: Shipment) => {
    setActiveShipment(shipment)
    setLabelModalOpen(true)
  }

const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmailTo) return
    setTestEmailSending(true)
    try {
      const res = await sendEmail({
        to: testEmailTo,
        subject: 'FedEx System Notification — Resend Gateway Test',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff;">
            <div style="background-color: #4D148C; padding: 16px 20px; border-radius: 6px; margin: -24px -24px 20px -24px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900;">Fed<span style="color: #FF6200;">Ex</span></span>
            </div>
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Transactional Email Gateway Test</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
              This notification confirms that your Resend email integration is configured and active in your FedEx platform modeling environment.
            </p>
            <div style="background-color: #f3f4f6; border-left: 4px solid #4D148C; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin: 20px 0; color: #1f2937;">
              <div><strong>Recipient:</strong> ${testEmailTo}</div>
              <div style="margin-top: 4px;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
              <div style="margin-top: 4px;"><strong>Gateway:</strong> Resend REST API (Server Function)</div>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0; text-align: center;">
              Internal office logistics modeling platform · Staff Operations Gateway
            </p>
          </div>
        `,
        template: 'status-update',
      })
      if (res.mode === 'live') {
        toast.success(`Live email dispatched to ${testEmailTo} via Resend!`)
      } else {
        toast.info(`Email recorded to local Outbox (${res.notes || 'sandbox mode'})`)
      }
      setTestEmailOpen(false)
      setTestEmailTo('')
    } catch {
      toast.error('Failed to dispatch test email')
    } finally {
      setTestEmailSending(false)
    }
  }



  return (
    <div className="mx-auto max-w-content space-y-8 px-4 py-8 sm:px-6">
      {/* Top Console Bar */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Operations Management Console</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Private office portal for dispatch, real-time shipment updates, and ticket resolution.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">
            Email System: Resend Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Wipe all shipments to a clean slate?')) {
                clearAllShipments()
                toast.success('Database wiped to a clean slate')
              }
            }}
          >
            <Trash2 className="size-3.5" /> Wipe to Clean Slate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadSampleShipments()
              toast.success('Sample office fixtures loaded')
            }}
          >
            <RefreshCw className="size-3.5" /> Load Sample Data
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/shipping">
              <Plus className="size-3.5" /> Book Shipment
            </Link>
          </Button>
          <Button variant="secondary" size="sm" onClick={onLock}>
            <LogOut className="size-3.5" /> Lock Console
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
            <Package className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length} parcels</div>
            <p className="mt-1 text-xs text-muted-foreground">Tracked in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emails Dispatched</CardTitle>
            <Mail className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outbox.length} messages</div>
            <p className="mt-1 text-xs text-emerald-600 font-medium">Recorded in Outbox</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Daily Avg Volume</CardTitle>
            <TrendingUp className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageVolumeK}k parcels</div>
            <p className="mt-1 text-xs text-emerald-600 font-medium">+4.2% week-over-week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Network Reliability</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4%</div>
            <p className="mt-1 text-xs text-muted-foreground">On-time departure rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="shipments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 sm:w-auto">
          <TabsTrigger value="shipments">Shipments ({shipments.length})</TabsTrigger>
          <TabsTrigger value="emails">Email Outbox ({outbox.length})</TabsTrigger>
          <TabsTrigger value="tickets">Support Queue ({openTicketsCount})</TabsTrigger>
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="volume">Network Volume</TabsTrigger>
        </TabsList>

        {/* Tab 1: Live Shipments */}
        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Shipment Inventory & Control</CardTitle>
                <CardDescription>
                  Modify status, log scan events, and generate printable shipping labels for any package.
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/shipping">
                  <Plus className="size-4" /> Book New Shipment
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-muted/20">
                  <Package className="mx-auto size-8 text-muted-foreground" />
                  <h3 className="mt-2 text-base font-bold">No active shipments in system</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Your platform is running on a pristine clean slate. You can book a real package on the shipping page or populate sample fixtures for presentation.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button asChild size="sm">
                      <Link to="/shipping">
                        <Plus className="size-4" /> Book New Shipment
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loadSampleShipments()
                        toast.success('Sample fixtures loaded')
                      }}
                    >
                      <RefreshCw className="size-4" /> Load Sample Data
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead className="text-right">Operations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s) => (
                      <TableRow key={s.trackingNumber}>
                        <TableCell className="font-mono font-bold">
                          <Link
                            to="/tracking"
                            search={{ id: s.trackingNumber }}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {s.trackingNumber}
                            <ExternalLink className="size-3 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-xs">{s.service}</TableCell>
                        <TableCell className="text-xs">
                          <div><span className="text-muted-foreground">From:</span> {s.origin}</div>
                          <div><span className="text-muted-foreground">To:</span> {s.destination}</div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              s.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'out-for-delivery'
                                  ? 'bg-amber-100 text-amber-800'
                                  : s.status === 'exception'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-primary/15 text-primary'
                            }`}
                          >
                            {s.status.replace('-', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.weight}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.estimatedDelivery}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => openStatusEditor(s)}>
                            Update Status
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openLabelPrinter(s)}>
                            <Printer className="size-3.5" /> Label
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Email Outbox */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Email Notification Outbox</CardTitle>
                <CardDescription>
                  Review all transactional notifications dispatched by the system. Click any row to preview the responsive HTML template.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setTestEmailOpen(true)}
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  <Send className="size-3.5" /> Dispatch Test Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearEmailOutbox()
                    setOutbox([])
                    toast.success('Outbox cleared')
                  }}
                  disabled={outbox.length === 0}
                >
                  <Trash2 className="size-3.5" /> Clear Outbox
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {outbox.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-muted/20">
                  <Mail className="mx-auto size-8 text-muted-foreground" />
                  <h3 className="mt-2 text-base font-bold">No emails dispatched yet</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a shipment or update a tracking status to see emails appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Delivery Mode</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outbox.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {msg.timestamp}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            {msg.subject}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {msg.to}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {msg.template}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold w-fit',
                                  msg.mode === 'live'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                )}
                              >
                                {msg.mode === 'live' ? 'Live (Resend)' : 'Sandbox / Safe'}
                              </span>
                              {msg.notes && (
                                <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]" title={msg.notes}>
                                  {msg.notes}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewEmail(msg)
                                setPreviewOpen(true)
                              }}
                            >
                              <Eye className="size-3.5" /> Preview HTML
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Support Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Customer Support Queue</CardTitle>
                <CardDescription>Resolve customer questions, claims, and delivery hold requests.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={ticketFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setTicketFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={ticketFilter === 'Open' ? 'default' : 'outline'}
                  onClick={() => setTicketFilter('Open')}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant={ticketFilter === 'In progress' ? 'default' : 'outline'}
                  onClick={() => setTicketFilter('In progress')}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={ticketFilter === 'Resolved' ? 'default' : 'outline'}
                  onClick={() => setTicketFilter('Resolved')}
                >
                  Resolved
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono font-medium">{t.id}</TableCell>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              t.priority === 'High'
                                ? 'destructive'
                                : t.priority === 'Medium'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              t.status === 'Open'
                                ? 'bg-amber-100 text-amber-800'
                                : t.status === 'In progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3.5" /> {t.age}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.status !== 'Resolved' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTickets((prev) =>
                                  prev.map((item) => (item.id === t.id ? { ...item, status: 'Resolved' } : item)),
                                )
                                toast.success(`Ticket ${t.id} marked as Resolved`)
                              }}
                            >
                              Resolve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTickets((prev) =>
                                  prev.map((item) => (item.id === t.id ? { ...item, status: 'In progress' } : item)),
                                )
                                toast.success(`Ticket ${t.id} reopened`)
                              }}
                            >
                              Reopen
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>User & Client Accounts</CardTitle>
                  <CardDescription>Manage user roles and active shipping account status.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={userRoleFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setUserRoleFilter('all')}
                  >
                    All Roles
                  </Button>
                  <Button
                    size="sm"
                    variant={userRoleFilter === 'Business' ? 'default' : 'outline'}
                    onClick={() => setUserRoleFilter('Business')}
                  >
                    Business
                  </Button>
                  <Button
                    size="sm"
                    variant={userRoleFilter === 'Admin' ? 'default' : 'outline'}
                    onClick={() => setUserRoleFilter('Admin')}
                  >
                    Admin
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>30d Shipments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              u.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.status === 'Suspended'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">{u.shipments30d}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {u.status === 'Active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setUsers((prev) =>
                                  prev.map((item) => (item.id === u.id ? { ...item, status: 'Suspended' } : item)),
                                )
                                toast.success(`User ${u.name} suspended`)
                              }}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setUsers((prev) =>
                                  prev.map((item) => (item.id === u.id ? { ...item, status: 'Active' } : item)),
                                )
                                toast.success(`User ${u.name} activated`)
                              }}
                            >
                              Activate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Volume Analytics */}
        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Network Shipments (Past 14 Days)</CardTitle>
              <CardDescription>
                Throughput in thousands of packages per day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
                  {dailyShipmentsK.map((vol, i) => {
                    const heightPercent = Math.round((vol / 20) * 100)
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                          {vol}k
                        </span>
                        <div className="h-40 w-full rounded bg-secondary flex items-end p-1">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full rounded bg-primary transition-all hover:bg-accent"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">D{i + 1}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/50 p-4 text-sm">
                  <div>
                    <span className="font-semibold text-foreground">14-Day Total Throughput: </span>
                    <span className="font-mono font-bold text-primary">{totalVolumeK.toFixed(1)}k packages</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Peak Day: </span>
                    <span className="font-mono font-bold text-accent">{Math.max(...dailyShipmentsK)}k packages</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Editor Dialog */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
            <DialogDescription>
              Changes are immediately broadcast to public tracking for #{activeShipment?.trackingNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="shipment-status">New Tracking Status</Label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as TrackingStatus)}>
                <SelectTrigger id="shipment-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="label-created">Label Created</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="exception">Exception / Delay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-location">Scan Location (City / Station)</Label>
              <Input
                id="event-location"
                placeholder="e.g. Memphis Regional Sort Center"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-desc">Event Scan Notes (Optional)</Label>
              <Input
                id="event-desc"
                placeholder="e.g. Sorted and transferred to delivery vehicle"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus}>
              Save & Broadcast Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Label Modal */}
      {activeShipment && (
        <ShippingLabel
          shipment={activeShipment}
          open={labelModalOpen}
          onOpenChange={setLabelModalOpen}
        />
      )}

      
      {/* Test Email Dispatch Dialog */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-4 text-primary" /> Dispatch Test Email
            </DialogTitle>
            <DialogDescription>
              Send an authenticated notification through the Resend gateway to verify live delivery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="test-email-input">Recipient Email Address</Label>
              <Input
                id="test-email-input"
                type="email"
                required
                placeholder="your-email@example.com"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Note: In Resend sandbox/onboarding mode, emails are delivered to the registered Resend account owner. Once custom domain DNS is verified, delivery opens to all recipients.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTestEmailOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={testEmailSending || !testEmailTo}>
                {testEmailSending ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Email HTML Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-muted/40">
            <DialogTitle className="text-base font-bold">Email Notification Preview</DialogTitle>
            <DialogDescription className="text-xs">
              Subject: <strong className="text-foreground">{previewEmail?.subject}</strong> · To: {previewEmail?.to}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-100 flex justify-center">
            {previewEmail && (
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.html}
                className="w-full max-w-[600px] h-[480px] bg-white rounded border shadow-sm"
              />
            )}
          </div>
          <DialogFooter className="p-3 border-t bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
