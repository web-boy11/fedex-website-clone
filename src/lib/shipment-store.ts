import { useEffect, useState } from 'react'
import { shipments as initialShipments, type Shipment, type TrackingStatus, type TrackingEvent } from '@/lib/site-data'

const STORAGE_KEY = 'fedex_shipments_store_v1'
const UPDATE_EVENT = 'fedex_shipments_updated'

export type CreateShipmentInput = {
  senderName: string
  senderCompany?: string
  senderStreet: string
  senderCity: string
  senderState?: string
  senderZip: string
  recipientName: string
  recipientCompany?: string
  recipientStreet: string
  recipientCity: string
  recipientState?: string
  recipientZip: string
  weight: string
  service: string
  signatureRequired: boolean
}

// Coordinate lookups for common US regions (fallback to Memphis hub -> destination)
const defaultOriginCoords: [number, number] = [35.1495, -90.049] // Memphis TN World Hub
const defaultDestCoords: [number, number] = [40.7128, -74.006] // New York NY

function loadShipmentsFromStorage(): Array<Shipment> {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      // First visit starts with a pristine clean slate
      return []
    }
    const parsed = JSON.parse(raw) as Array<Shipment>
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

function saveShipmentsToStorage(shipments: Array<Shipment>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments))
    window.dispatchEvent(new Event(UPDATE_EVENT))
  } catch (err) {
    console.error('Failed to save shipments to storage:', err)
  }
}

/** Generate realistic 12-digit FedEx tracking number */
export function generateTrackingNumber(): string {
  // Common FedEx formats start with 79, 77, 44, or 99
  const prefix = '79'
  let digits = ''
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10).toString()
  }
  return prefix + digits
}

export function getAllShipments(): Array<Shipment> {
  return loadShipmentsFromStorage()
}

export function findShipment(trackingNumber: string): Shipment | undefined {
  const clean = trackingNumber.replace(/[\s-]/g, '')
  const all = getAllShipments()
  return all.find((s) => s.trackingNumber.replace(/[\s-]/g, '') === clean)
}

export function createShipment(input: CreateShipmentInput): Shipment {
  const all = getAllShipments()
  const trackingNumber = generateTrackingNumber()
  const now = new Date()

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' })

  const origin = `${input.senderCity}${input.senderState ? `, ${input.senderState}` : ''}, US`
  const destination = `${input.recipientCity}${input.recipientState ? `, ${input.recipientState}` : ''}, US`

  // Format delivery estimate based on chosen speed
  let estimatedDelivery = 'Within 1–3 business days'
  if (input.service.includes('overnight') || input.service === 'priority-overnight' || input.service === 'first-overnight') {
    estimatedDelivery = 'Tomorrow · by 10:30 AM'
  } else if (input.service.includes('two-day') || input.service === '2day') {
    estimatedDelivery = 'In 2 business days · by 5:00 PM'
  } else if (input.service.includes('ground')) {
    estimatedDelivery = 'In 3 business days · by end of day'
  }

  const newShipment: Shipment = {
    trackingNumber,
    status: 'label-created',
    service: input.service.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    estimatedDelivery,
    origin,
    destination,
    weight: `${input.weight} lb`,
    pieces: 1,
    signatureRequired: input.signatureRequired,
    originCoords: defaultOriginCoords,
    destinationCoords: defaultDestCoords,
    progress: 0.15,
    events: [
      {
        date: dateStr,
        time: timeStr,
        location: input.senderCity || 'Origin facility',
        description: 'Shipping label created — package awaiting pickup',
      },
    ],
  }

  const updated = [newShipment, ...all]
  saveShipmentsToStorage(updated)
  return newShipment
}

export function updateShipmentStatus(
  trackingNumber: string,
  newStatus: TrackingStatus,
  customEvent?: Partial<TrackingEvent>,
): Shipment | undefined {
  const all = getAllShipments()
  const clean = trackingNumber.replace(/[\s-]/g, '')
  const index = all.findIndex((s) => s.trackingNumber.replace(/[\s-]/g, '') === clean)
  if (index === -1) return undefined

  const shipment = all[index]
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' })

  let progress = shipment.progress
  if (newStatus === 'label-created') progress = 0.15
  else if (newStatus === 'in-transit') progress = 0.55
  else if (newStatus === 'out-for-delivery') progress = 0.85
  else if (newStatus === 'delivered') progress = 1.0
  else if (newStatus === 'exception') progress = 0.6

  const defaultDescriptions: Record<TrackingStatus, string> = {
    'label-created': 'Shipping label created',
    'in-transit': 'In transit — package sorted at regional hub',
    'out-for-delivery': 'On FedEx vehicle for delivery',
    delivered: 'Delivered — signed and left at front desk / entrance',
    exception: 'Delivery exception — contact local station for details',
  }

  const newEvent: TrackingEvent = {
    date: customEvent?.date || dateStr,
    time: customEvent?.time || timeStr,
    location: customEvent?.location || shipment.destination,
    description: customEvent?.description || defaultDescriptions[newStatus],
  }

  const updatedShipment: Shipment = {
    ...shipment,
    status: newStatus,
    progress,
    estimatedDelivery:
      newStatus === 'delivered'
        ? `Delivered ${dateStr} at ${timeStr}`
        : shipment.estimatedDelivery,
    events: [newEvent, ...shipment.events],
  }

  all[index] = updatedShipment
  saveShipmentsToStorage(all)
  return updatedShipment
}

export function clearAllShipments() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function loadSampleShipments() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialShipments))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function resetShipmentsToDefaults() {
  loadSampleShipments()
}

/** React hook for subscribing to all shipments */
export function useShipments(): Array<Shipment> {
  const [data, setData] = useState<Array<Shipment>>(() => loadShipmentsFromStorage())

  useEffect(() => {
    setData(loadShipmentsFromStorage())

    const handleUpdate = () => {
      setData(loadShipmentsFromStorage())
    }

    window.addEventListener(UPDATE_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return data
}

/** React hook for subscribing to a single shipment */
export function useShipment(trackingNumber?: string): Shipment | undefined {
  const [shipment, setShipment] = useState<Shipment | undefined>(() =>
    trackingNumber ? findShipment(trackingNumber) : undefined,
  )

  useEffect(() => {
    if (!trackingNumber) {
      setShipment(undefined)
      return
    }

    setShipment(findShipment(trackingNumber))

    const handleUpdate = () => {
      setShipment(findShipment(trackingNumber))
    }

    window.addEventListener(UPDATE_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [trackingNumber])

  return shipment
}

