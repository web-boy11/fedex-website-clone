import { useState } from 'react'
import { Check, Copy, Printer } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Shipment } from '@/lib/site-data'

export function BarcodeSVG({ value }: { value: string }) {
  // Simple deterministic Code 128 style visual representation of the tracking number
  const clean = value.replace(/\s+/g, '')
  const bars: Array<{ width: number; isBar: boolean }> = []
  
  // Guard pattern
  bars.push({ width: 2, isBar: true }, { width: 1, isBar: false }, { width: 2, isBar: true })
  
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i)
    const w1 = ((code * 3) % 4) + 1
    const w2 = ((code * 7) % 3) + 1
    const w3 = ((code * 5) % 4) + 1
    const w4 = ((code * 2) % 3) + 1
    bars.push(
      { width: w1, isBar: true },
      { width: w2, isBar: false },
      { width: w3, isBar: true },
      { width: w4, isBar: false },
    )
  }
  // End guard
  bars.push({ width: 2, isBar: true }, { width: 1, isBar: false }, { width: 3, isBar: true })

  let currentX = 10
  const barElements = bars.map((b, idx) => {
    const x = currentX
    currentX += b.width * 2
    if (!b.isBar) return null
    return (
      <rect
        key={idx}
        x={x}
        y={0}
        width={b.width * 2}
        height={70}
        fill="#000000"
      />
    )
  })

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${currentX + 20} 70`}
        className="h-16 w-full max-w-[280px]"
        preserveAspectRatio="none"
      >
        {barElements}
      </svg>
      <span className="mt-1 font-mono text-xs font-bold tracking-widest text-black">
        {value.match(/.{1,4}/g)?.join(' ') ?? value}
      </span>
    </div>
  )
}

export function ShippingLabel({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: Shipment
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(shipment.trackingNumber)
    setCopied(true)
    toast.success('Tracking number copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0 print:max-w-none">
        <DialogHeader className="p-4 border-b bg-muted/40 print:hidden flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold">Official Shipping Label</DialogTitle>
            <DialogDescription className="text-xs">
              Ready for 4×6 standard thermal printer or letter-sized paper
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy TRK'}
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground font-bold">
              <Printer className="size-3.5" /> Print Label
            </Button>
          </div>
        </DialogHeader>

        {/* Printable 4x6 Label Canvas */}
        <div className="p-6 bg-white text-black font-sans select-none flex justify-center">
          <div
            id="shipping-label-sheet"
            className="w-[380px] min-h-[560px] border-2 border-black p-4 flex flex-col justify-between text-xs bg-white text-black print:border-none print:w-full print:h-full"
          >
            {/* Top row: Shipper info + carrier marks */}
            <div className="border-b-2 border-black pb-2 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Origin / Shipper</div>
                <div className="font-bold text-sm">OFFICE DISPATCH</div>
                <div className="text-[11px] leading-tight">
                  <div>120 W 42ND ST</div>
                  <div>NEW YORK, NY 10036</div>
                  <div>UNITED STATES</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-xl tracking-tighter">
                  Fed<span className="text-black">Ex</span>
                </div>
                <div className="text-[10px] font-mono font-bold mt-0.5">
                  WT: {shipment.weight}
                </div>
                <div className="text-[9px] font-mono text-neutral-700">
                  DATE: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Recipient Box */}
            <div className="py-3 border-b-2 border-black">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Ship To:</div>
              <div className="font-extrabold text-base uppercase leading-tight mt-0.5">
                {shipment.destination.split(',')[0]} RECEPTION
              </div>
              <div className="text-xs font-semibold uppercase leading-snug mt-1">
                <div>DELIVERY ADDRESS SUITE 400</div>
                <div>{shipment.destination.toUpperCase()}</div>
              </div>
              {shipment.signatureRequired && (
                <div className="mt-2 inline-block border border-black px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest uppercase">
                  DIRECT SIGNATURE REQUIRED
                </div>
              )}
            </div>

            {/* Routing / Service Section */}
            <div className="py-2 border-b-2 border-black flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-600">Service Level</div>
                <div className="font-extrabold text-lg uppercase tracking-tight">
                  {shipment.service}
                </div>
                <div className="text-[10px] font-mono text-neutral-700">
                  EST: {shipment.estimatedDelivery}
                </div>
              </div>
              <div className="border-2 border-black px-3 py-1 font-extrabold text-2xl tracking-widest">
                R4
              </div>
            </div>

            {/* Main Barcode & Tracking Number */}
            <div className="py-4 flex flex-col items-center justify-center">
              <div className="text-[9px] font-mono font-bold tracking-widest mb-1 uppercase">
                FEDEX TRACKING NUMBER
              </div>
              <BarcodeSVG value={shipment.trackingNumber} />
            </div>

            {/* Footer Form Code */}
            <div className="pt-2 border-t-2 border-black flex justify-between text-[8px] font-mono text-neutral-600">
              <span>FORM 0201 · REV 2026</span>
              <span>PART #50294-01</span>
              <span>STANDARD 4X6</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

