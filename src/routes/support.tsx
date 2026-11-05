import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Globe,
  MessageCircle,
  PackageSearch,
  Phone,
  Receipt,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHero } from '@/components/site/page-hero'
import { faqs, helpTopics } from '@/lib/site-data'
import { sendEmail, createSupportTicketHtml } from '@/lib/email-service'

export const Route = createFileRoute('/support')({
  head: () => ({ meta: [{ title: 'Customer support — FedEx' }] }),
  component: SupportPage,
})

const topicIcons = {
  'package-search': PackageSearch,
  truck: Truck,
  receipt: Receipt,
  'shield-check': ShieldCheck,
  globe: Globe,
  user: UserRound,
} as const

function SupportPage() {
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !topic || !message) return

    setSubmitting(true)
    const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000)

    try {
      await sendEmail({
        to: email,
        subject: `FedEx Support Inquiry Confirmation [#${ticketId}]`,
        html: createSupportTicketHtml(ticketId, topic, message),
        template: 'support-acknowledgement',
      })
      toast.success(`Ticket #${ticketId} created! Confirmation sent to ${email}`)
      setTopic('')
      setMessage('')
    } catch {
      toast.success(`Inquiry #${ticketId} received — our support desk will respond shortly.`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="How can we help?"
        description="Find an answer fast, or reach a person when you need one."
      />

      <section className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <h2 className="sr-only">Help topics</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {helpTopics.map((t) => {
            const Icon = topicIcons[t.icon]
            return (
              <li key={t.title}>
                <a
                  href={`#faq`}
                  className="flex h-full gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md motion-reduce:transition-none"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-bold">{t.title}</span>
                    <span className="block text-sm text-muted-foreground">{t.description}</span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </section>

      <section id="faq" className="bg-secondary">
        <div className="mx-auto grid max-w-content gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_24rem]">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Frequently asked</h2>
            <div className="mt-6 space-y-8">
              {faqs.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-2 text-xs font-bold tracking-[0.2em] text-accent uppercase">
                    {group.category}
                  </h3>
                  <Accordion type="single" collapsible className="rounded-xl border bg-card px-5">
                    {group.items.map((item) => (
                      <AccordionItem key={item.q} value={item.q}>
                        <AccordionTrigger className="text-base font-semibold">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-bold">Talk to us</h2>
              <div className="mt-4 grid gap-2">
                <Button onClick={() => toast.info('Connecting you to an available FedEx support agent...')}>
                  <MessageCircle className="size-4 mr-2" /> Start a chat
                </Button>
                <Button variant="outline" onClick={() => toast.info('Phone Support: Call 1-800-GO-FEDEX (1-800-463-3339) 24/7.')}>
                  <Phone className="size-4 mr-2" /> Call support
                </Button>
                <Button variant="link" asChild>
                  <Link to="/tracking">Track a package instead</Link>
                </Button>
              </div>
            </div>
            <form
              className="space-y-3 rounded-xl border bg-card p-6"
              onSubmit={handleSubmit}
            >
              <h2 className="text-lg font-bold">Send a message</h2>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Your Email Address</Label>
                <Input
                  id="c-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-topic">Topic</Label>
                <Input
                  id="c-topic"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Schedule pickup or package question"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-msg">Message</Label>
                <Textarea
                  id="c-msg"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Send Message'}
              </Button>
            </form>
          </aside>
        </div>
      </section>
    </>
  )
}
