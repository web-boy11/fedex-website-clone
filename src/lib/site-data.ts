// Stubbed content for the concept site. Every page reads from here, so a
// later milestone can swap these fixtures for live APIs without touching UI.

export type SitePath =
  | '/'
  | '/tracking'
  | '/shipping'
  | '/locations'
  | '/support'
  | '/business'
  | '/network'
  | '/proposal'
  | '/account'
  | '/admin'

export type NavLink = { label: string; to: SitePath; description?: string }
export type NavGroup = { label: string; to: SitePath; links: Array<NavLink> }

export const mainNav: Array<NavGroup> = [
  {
    label: 'Shipping',
    to: '/shipping',
    links: [
      { label: 'Create a shipment', to: '/shipping', description: 'Guided, four-step label creation' },
      { label: 'Rates & transit times', to: '/shipping', description: 'Compare services side by side' },
      { label: 'Schedule a pickup', to: '/shipping', description: 'We come to your door or dock' },
      { label: 'Packing & supplies', to: '/support', description: 'Boxes, tubes and packing guidance' },
    ],
  },
  {
    label: 'Tracking',
    to: '/tracking',
    links: [
      { label: 'Track a package', to: '/tracking', description: 'Live status for up to 30 numbers' },
      { label: 'Delivery Manager', to: '/tracking', description: 'Redirect, hold or reschedule' },
      { label: 'Claims & returns', to: '/support', description: 'Start a claim or return label' },
    ],
  },
  {
    label: 'Network',
    to: '/network',
    links: [
      { label: 'Live network map', to: '/network', description: 'Hubs, lanes and flights in real time' },
      { label: 'Find a location', to: '/locations', description: 'Interactive map of drop-off points' },
    ],
  },
  {
    label: 'Business',
    to: '/business',
    links: [
      { label: 'Small business hub', to: '/business', description: 'Tools that grow with you' },
      { label: 'Freight & LTL', to: '/business', description: 'Pallets to full truckload' },
      { label: 'International trade', to: '/business', description: 'Customs, duties and docs' },
    ],
  },
  {
    label: 'Support',
    to: '/support',
    links: [
      { label: 'Help centre', to: '/support', description: 'Answers to common questions' },
      { label: 'Find a location', to: '/locations', description: 'Drop-off points near you' },
      { label: 'Contact us', to: '/support', description: 'Chat, call or write to us' },
    ],
  },
]

export const footerColumns: Array<{ title: string; links: Array<NavLink> }> = [
  {
    title: 'Our company',
    links: [
      { label: 'About FedEx', to: '/' },
      { label: 'Global network', to: '/network' },
      { label: 'Sustainability', to: '/' },
      { label: 'Newsroom', to: '/' },
      { label: 'Careers', to: '/' },
    ],
  },
  {
    title: 'Shipping',
    links: [
      { label: 'Create a shipment', to: '/shipping' },
      { label: 'Rates & transit times', to: '/shipping' },
      { label: 'Schedule a pickup', to: '/shipping' },
      { label: 'Freight', to: '/business' },
    ],
  },
  {
    title: 'Tracking',
    links: [
      { label: 'Track a package', to: '/tracking' },
      { label: 'Delivery Manager', to: '/tracking' },
      { label: 'Claims', to: '/support' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help centre', to: '/support' },
      { label: 'Locations', to: '/locations' },
      { label: 'Small business', to: '/business' },
      { label: 'Contact us', to: '/support' },
    ],
  },
]

export const serviceAlert =
  'High shipping volumes may affect some delivery windows this week. Track your shipment for the latest estimate.'

// ---------- Tracking ----------

export type TrackingStatus = 'label-created' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'exception'

export type TrackingEvent = {
  date: string
  time: string
  location: string
  description: string
}

export type Shipment = {
  trackingNumber: string
  status: TrackingStatus
  service: string
  estimatedDelivery: string
  origin: string
  destination: string
  weight: string
  pieces: number
  signatureRequired: boolean
  /** [lat, lng] used by the route map. */
  originCoords: [number, number]
  destinationCoords: [number, number]
  /** 0–1: how far along the route the latest scan puts the package. */
  progress: number
  events: Array<TrackingEvent>
}

export const trackingStatusLabels: Record<TrackingStatus, string> = {
  'label-created': 'Label created',
  'in-transit': 'In transit',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  exception: 'Delivery exception',
}

export const trackingSteps: Array<TrackingStatus> = [
  'label-created',
  'in-transit',
  'out-for-delivery',
  'delivered',
]

export const shipments: Array<Shipment> = [
  {
    trackingNumber: '778899001122',
    originCoords: [35.1495, -90.049],
    destinationCoords: [40.6782, -73.9442],
    progress: 0.82,
    status: 'in-transit',
    service: 'Priority Overnight',
    estimatedDelivery: 'Thursday, Oct 22 · by 10:30 AM',
    origin: 'Memphis, TN, US',
    destination: 'Brooklyn, NY, US',
    weight: '2.4 lb',
    pieces: 1,
    signatureRequired: true,
    events: [
      { date: 'Oct 21', time: '4:12 AM', location: 'Newark, NJ', description: 'Arrived at regional hub' },
      { date: 'Oct 21', time: '1:47 AM', location: 'Memphis, TN', description: 'Departed origin hub' },
      { date: 'Oct 20', time: '9:30 PM', location: 'Memphis, TN', description: 'Picked up' },
      { date: 'Oct 20', time: '3:05 PM', location: 'Memphis, TN', description: 'Shipping label created' },
    ],
  },
  {
    trackingNumber: '445566778899',
    originCoords: [30.2672, -97.7431],
    destinationCoords: [39.7392, -104.9903],
    progress: 1,
    status: 'delivered',
    service: 'Ground',
    estimatedDelivery: 'Delivered Tuesday, Oct 20 at 2:41 PM',
    origin: 'Austin, TX, US',
    destination: 'Denver, CO, US',
    weight: '11.0 lb',
    pieces: 2,
    signatureRequired: false,
    events: [
      { date: 'Oct 20', time: '2:41 PM', location: 'Denver, CO', description: 'Delivered — left at front door' },
      { date: 'Oct 20', time: '8:02 AM', location: 'Denver, CO', description: 'Out for delivery' },
      { date: 'Oct 19', time: '6:15 PM', location: 'Denver, CO', description: 'Arrived at local facility' },
      { date: 'Oct 17', time: '11:20 AM', location: 'Austin, TX', description: 'Picked up' },
    ],
  },
  {
    trackingNumber: '123412341234',
    originCoords: [47.6062, -122.3321],
    destinationCoords: [45.5152, -122.6784],
    progress: 0.94,
    status: 'out-for-delivery',
    service: 'Express Saver',
    estimatedDelivery: 'Today · by end of day',
    origin: 'Seattle, WA, US',
    destination: 'Portland, OR, US',
    weight: '5.2 lb',
    pieces: 1,
    signatureRequired: false,
    events: [
      { date: 'Oct 21', time: '7:48 AM', location: 'Portland, OR', description: 'On vehicle for delivery' },
      { date: 'Oct 21', time: '5:10 AM', location: 'Portland, OR', description: 'At local facility' },
      { date: 'Oct 19', time: '4:00 PM', location: 'Seattle, WA', description: 'Picked up' },
    ],
  },
  {
    trackingNumber: '998877665544',
    originCoords: [45.764, 4.8357],
    destinationCoords: [43.6532, -79.3832],
    progress: 0.9,
    status: 'exception',
    service: 'International Priority',
    estimatedDelivery: 'Pending — awaiting customs documents',
    origin: 'Lyon, FR',
    destination: 'Toronto, ON, CA',
    weight: '7.8 lb',
    pieces: 1,
    signatureRequired: true,
    events: [
      { date: 'Oct 21', time: '9:15 AM', location: 'Toronto, ON', description: 'Clearance delay — commercial invoice required' },
      { date: 'Oct 20', time: '10:40 PM', location: 'Paris, FR', description: 'Departed international gateway' },
      { date: 'Oct 19', time: '2:30 PM', location: 'Lyon, FR', description: 'Picked up' },
    ],
  },
]

export const sampleTrackingNumbers = shipments.map((s) => s.trackingNumber)

export function findShipment(trackingNumber: string) {
  const clean = trackingNumber.replace(/\s+/g, '')
  return shipments.find((s) => s.trackingNumber === clean)
}

// ---------- Shipping / rates ----------

export type RateOption = {
  id: string
  name: string
  transit: string
  baseRate: number
  perLb: number
  tag?: string
}

export const rateOptions: Array<RateOption> = [
  { id: 'first-overnight', name: 'First Overnight', transit: 'Next business day by 8:00 AM', baseRate: 84, perLb: 4.1 },
  { id: 'priority-overnight', name: 'Priority Overnight', transit: 'Next business day by 10:30 AM', baseRate: 62, perLb: 3.2, tag: 'Most popular' },
  { id: 'two-day', name: '2Day', transit: '2 business days by 5:00 PM', baseRate: 28, perLb: 1.6 },
  { id: 'express-saver', name: 'Express Saver', transit: '3 business days by 5:00 PM', baseRate: 21, perLb: 1.2 },
  { id: 'ground', name: 'Ground', transit: '1–5 business days', baseRate: 11, perLb: 0.55, tag: 'Best value' },
]

export function quoteRate(option: RateOption, weightLb: number, zone: number) {
  const zoneFactor = 1 + (zone - 2) * 0.12
  return Math.round((option.baseRate + option.perLb * weightLb) * zoneFactor * 100) / 100
}

export const packageTypes = [
  { id: 'own', label: 'Your packaging' },
  { id: 'envelope', label: 'Envelope' },
  { id: 'pak', label: 'Pak' },
  { id: 'box', label: 'Box' },
  { id: 'tube', label: 'Tube' },
]

// ---------- Locations ----------

export type Location = {
  id: string
  name: string
  type: 'Office' | 'Ship Center' | 'Drop Box' | 'Partner Retail'
  address: string
  city: string
  zip: string
  distance: string
  hours: string
  closesAt: string
  services: Array<string>
  lat: number
  lng: number
}

export const locations: Array<Location> = [
  { id: 'l1', lat: 40.7556, lng: -73.9857, name: 'Office Print & Ship Center', type: 'Office', address: '120 W 42nd St', city: 'New York, NY', zip: '10036', distance: '0.4 mi', hours: 'Mon–Fri 7 AM–10 PM · Sat–Sun 9 AM–6 PM', closesAt: '10:00 PM', services: ['Packing', 'Printing', 'Hold at location', 'Returns'] },
  { id: 'l2', lat: 40.7537, lng: -73.9921, name: 'Ship Center — Midtown', type: 'Ship Center', address: '550 8th Ave', city: 'New York, NY', zip: '10018', distance: '0.9 mi', hours: 'Mon–Fri 8 AM–8 PM · Sat 9 AM–5 PM', closesAt: '8:00 PM', services: ['Freight drop-off', 'International', 'Hold at location'] },
  { id: 'l3', lat: 40.7527, lng: -73.9843, name: 'Drop Box — Bryant Park', type: 'Drop Box', address: '1065 6th Ave (lobby)', city: 'New York, NY', zip: '10018', distance: '1.1 mi', hours: 'Last pickup Mon–Fri 6:30 PM', closesAt: '6:30 PM', services: ['Prepaid drop-off'] },
  { id: 'l4', lat: 40.7397, lng: -73.9866, name: 'Partner Retail — Corner Pharmacy', type: 'Partner Retail', address: '300 Park Ave S', city: 'New York, NY', zip: '10010', distance: '1.6 mi', hours: 'Daily 7 AM–11 PM', closesAt: '11:00 PM', services: ['Returns', 'Hold at location'] },
  { id: 'l5', lat: 40.7081, lng: -74.0063, name: 'Office Print & Ship Center', type: 'Office', address: '2 Gold St', city: 'New York, NY', zip: '10038', distance: '3.2 mi', hours: 'Mon–Fri 7 AM–9 PM · Sat 9 AM–5 PM', closesAt: '9:00 PM', services: ['Packing', 'Printing', 'Returns', 'International'] },
  { id: 'l6', lat: 40.7432, lng: -73.9426, name: 'Ship Center — Long Island City', type: 'Ship Center', address: '47-10 Austell Pl', city: 'Queens, NY', zip: '11101', distance: '4.0 mi', hours: 'Mon–Fri 8 AM–9 PM · Sat 9 AM–3 PM', closesAt: '9:00 PM', services: ['Freight drop-off', 'Hold at location', 'International'] },
]

// ---------- Support ----------

export const faqs: Array<{ category: string; items: Array<{ q: string; a: string }> }> = [
  {
    category: 'Tracking',
    items: [
      { q: 'Why hasn’t my tracking updated?', a: 'Scans happen at each facility. Between hubs, a package can travel for many hours without a new event. If nothing changes for 48 hours, contact us and we will open a trace.' },
      { q: 'Can I change where my package is delivered?', a: 'In most cases, yes. Open the shipment from Tracking and choose “Manage delivery” to redirect it to a nearby location, hold it, or pick a new date.' },
    ],
  },
  {
    category: 'Shipping',
    items: [
      { q: 'How is the price of a shipment calculated?', a: 'Rates combine the service speed, the distance between origin and destination (zone), and the greater of actual or dimensional weight. Surcharges may apply for residential delivery or oversized items.' },
      { q: 'What can’t I ship?', a: 'Hazardous materials, perishables and high-value items may be restricted or need special handling. Check the packing guide before you drop off.' },
    ],
  },
  {
    category: 'Claims & returns',
    items: [
      { q: 'My package arrived damaged. What do I do?', a: 'Keep the box and packing material, take photos, and start a claim within 60 days of delivery. Most claims are resolved within five business days.' },
      { q: 'How do I send a return?', a: 'Create a return label from your shipment or ask the sender for one, then drop it at any participating location — no box or printer needed at many retail partners.' },
    ],
  },
]

export const helpTopics = [
  { title: 'Track & manage', description: 'Status, delivery changes, missing packages', icon: 'package-search' },
  { title: 'Ship & pricing', description: 'Rates, labels, packaging and pickups', icon: 'truck' },
  { title: 'Billing & invoices', description: 'Pay a bill, disputes, duties and taxes', icon: 'receipt' },
  { title: 'Claims & returns', description: 'Damage, loss and return labels', icon: 'shield-check' },
  { title: 'International', description: 'Customs, documents and restrictions', icon: 'globe' },
  { title: 'Account', description: 'Profiles, addresses and preferences', icon: 'user' },
] as const

// ---------- Home ----------

export const stats = [
  { value: '220+', label: 'countries and territories served' },
  { value: '16M', label: 'packages moved on an average day' },
  { value: '700+', label: 'aircraft in the global fleet' },
  { value: '2040', label: 'target year for carbon-neutral operations' },
]

// ---------- Global network (live map) ----------
// Hub names are city-level only. Volumes, fleet and flight numbers are
// illustrative values for the concept, not operational data.

export type Region = 'Americas' | 'Europe' | 'Asia Pacific' | 'Middle East & Africa'
export type HubKind = 'World hub' | 'Regional hub' | 'Gateway'

export type Hub = {
  id: string
  code: string
  city: string
  country: string
  region: Region
  kind: HubKind
  lat: number
  lng: number
  /** Packages sorted per day, in thousands. */
  dailyVolume: number
  sortCapacity: number
  onTime: number
  gates: number
}

export const regions: Array<Region> = ['Americas', 'Europe', 'Asia Pacific', 'Middle East & Africa']

export const hubs: Array<Hub> = [
  { id: 'mem', code: 'MEM', city: 'Memphis', country: 'United States', region: 'Americas', kind: 'World hub', lat: 35.0424, lng: -89.9767, dailyVolume: 1450, sortCapacity: 92, onTime: 98.7, gates: 160 },
  { id: 'ind', code: 'IND', city: 'Indianapolis', country: 'United States', region: 'Americas', kind: 'Regional hub', lat: 39.7173, lng: -86.2944, dailyVolume: 980, sortCapacity: 84, onTime: 98.2, gates: 92 },
  { id: 'ewr', code: 'EWR', city: 'Newark', country: 'United States', region: 'Americas', kind: 'Regional hub', lat: 40.6895, lng: -74.1745, dailyVolume: 620, sortCapacity: 88, onTime: 97.1, gates: 48 },
  { id: 'oak', code: 'OAK', city: 'Oakland', country: 'United States', region: 'Americas', kind: 'Regional hub', lat: 37.7126, lng: -122.2197, dailyVolume: 540, sortCapacity: 79, onTime: 98.4, gates: 44 },
  { id: 'dfw', code: 'DFW', city: 'Fort Worth', country: 'United States', region: 'Americas', kind: 'Regional hub', lat: 32.9879, lng: -97.3186, dailyVolume: 610, sortCapacity: 81, onTime: 98.0, gates: 52 },
  { id: 'anc', code: 'ANC', city: 'Anchorage', country: 'United States', region: 'Americas', kind: 'Gateway', lat: 61.1743, lng: -149.9962, dailyVolume: 310, sortCapacity: 66, onTime: 99.1, gates: 30 },
  { id: 'yyz', code: 'YYZ', city: 'Toronto', country: 'Canada', region: 'Americas', kind: 'Gateway', lat: 43.6777, lng: -79.6248, dailyVolume: 240, sortCapacity: 72, onTime: 97.6, gates: 22 },
  { id: 'mia', code: 'MIA', city: 'Miami', country: 'United States', region: 'Americas', kind: 'Gateway', lat: 25.7959, lng: -80.287, dailyVolume: 280, sortCapacity: 75, onTime: 97.9, gates: 26 },
  { id: 'gru', code: 'GRU', city: 'São Paulo', country: 'Brazil', region: 'Americas', kind: 'Gateway', lat: -23.4356, lng: -46.4731, dailyVolume: 150, sortCapacity: 64, onTime: 96.4, gates: 14 },
  { id: 'cdg', code: 'CDG', city: 'Paris', country: 'France', region: 'Europe', kind: 'World hub', lat: 49.0097, lng: 2.5479, dailyVolume: 870, sortCapacity: 86, onTime: 97.8, gates: 72 },
  { id: 'lge', code: 'LGG', city: 'Liège', country: 'Belgium', region: 'Europe', kind: 'Regional hub', lat: 50.6374, lng: 5.4432, dailyVolume: 410, sortCapacity: 77, onTime: 98.3, gates: 34 },
  { id: 'cgn', code: 'CGN', city: 'Cologne', country: 'Germany', region: 'Europe', kind: 'Regional hub', lat: 50.8659, lng: 7.1427, dailyVolume: 390, sortCapacity: 80, onTime: 98.1, gates: 31 },
  { id: 'stn', code: 'STN', city: 'London', country: 'United Kingdom', region: 'Europe', kind: 'Gateway', lat: 51.886, lng: 0.2389, dailyVolume: 260, sortCapacity: 83, onTime: 97.2, gates: 20 },
  { id: 'dxb', code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', region: 'Middle East & Africa', kind: 'World hub', lat: 25.2532, lng: 55.3657, dailyVolume: 520, sortCapacity: 78, onTime: 98.5, gates: 40 },
  { id: 'jnb', code: 'JNB', city: 'Johannesburg', country: 'South Africa', region: 'Middle East & Africa', kind: 'Gateway', lat: -26.1367, lng: 28.2411, dailyVolume: 120, sortCapacity: 61, onTime: 96.8, gates: 12 },
  { id: 'los', code: 'LOS', city: 'Lagos', country: 'Nigeria', region: 'Middle East & Africa', kind: 'Gateway', lat: 6.5774, lng: 3.3212, dailyVolume: 90, sortCapacity: 58, onTime: 95.9, gates: 10 },
  { id: 'can', code: 'CAN', city: 'Guangzhou', country: 'China', region: 'Asia Pacific', kind: 'World hub', lat: 23.3924, lng: 113.2988, dailyVolume: 940, sortCapacity: 89, onTime: 98.0, gates: 80 },
  { id: 'nrt', code: 'NRT', city: 'Tokyo', country: 'Japan', region: 'Asia Pacific', kind: 'Regional hub', lat: 35.772, lng: 140.3929, dailyVolume: 430, sortCapacity: 82, onTime: 99.0, gates: 36 },
  { id: 'icn', code: 'ICN', city: 'Seoul', country: 'South Korea', region: 'Asia Pacific', kind: 'Gateway', lat: 37.4602, lng: 126.4407, dailyVolume: 300, sortCapacity: 76, onTime: 98.6, gates: 24 },
  { id: 'sin', code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia Pacific', kind: 'Regional hub', lat: 1.3644, lng: 103.9915, dailyVolume: 470, sortCapacity: 85, onTime: 98.8, gates: 38 },
  { id: 'bom', code: 'BOM', city: 'Mumbai', country: 'India', region: 'Asia Pacific', kind: 'Gateway', lat: 19.0896, lng: 72.8656, dailyVolume: 210, sortCapacity: 70, onTime: 96.9, gates: 18 },
  { id: 'syd', code: 'SYD', city: 'Sydney', country: 'Australia', region: 'Asia Pacific', kind: 'Gateway', lat: -33.9399, lng: 151.1753, dailyVolume: 180, sortCapacity: 68, onTime: 97.7, gates: 16 },
]

export type Lane = { from: string; to: string; flightsPerDay: number }

export const lanes: Array<Lane> = [
  { from: 'mem', to: 'ind', flightsPerDay: 14 },
  { from: 'mem', to: 'ewr', flightsPerDay: 12 },
  { from: 'mem', to: 'oak', flightsPerDay: 9 },
  { from: 'mem', to: 'dfw', flightsPerDay: 8 },
  { from: 'mem', to: 'mia', flightsPerDay: 6 },
  { from: 'mem', to: 'yyz', flightsPerDay: 4 },
  { from: 'mem', to: 'anc', flightsPerDay: 6 },
  { from: 'mem', to: 'cdg', flightsPerDay: 5 },
  { from: 'mem', to: 'gru', flightsPerDay: 2 },
  { from: 'ind', to: 'cdg', flightsPerDay: 3 },
  { from: 'ewr', to: 'stn', flightsPerDay: 4 },
  { from: 'ewr', to: 'cdg', flightsPerDay: 4 },
  { from: 'mia', to: 'gru', flightsPerDay: 3 },
  { from: 'oak', to: 'anc', flightsPerDay: 4 },
  { from: 'anc', to: 'nrt', flightsPerDay: 5 },
  { from: 'anc', to: 'icn', flightsPerDay: 4 },
  { from: 'anc', to: 'can', flightsPerDay: 6 },
  { from: 'oak', to: 'syd', flightsPerDay: 2 },
  { from: 'cdg', to: 'lge', flightsPerDay: 6 },
  { from: 'cdg', to: 'cgn', flightsPerDay: 6 },
  { from: 'cdg', to: 'stn', flightsPerDay: 5 },
  { from: 'cdg', to: 'dxb', flightsPerDay: 5 },
  { from: 'cdg', to: 'los', flightsPerDay: 2 },
  { from: 'cdg', to: 'jnb', flightsPerDay: 2 },
  { from: 'dxb', to: 'bom', flightsPerDay: 4 },
  { from: 'dxb', to: 'jnb', flightsPerDay: 2 },
  { from: 'dxb', to: 'sin', flightsPerDay: 3 },
  { from: 'can', to: 'sin', flightsPerDay: 5 },
  { from: 'can', to: 'nrt', flightsPerDay: 4 },
  { from: 'can', to: 'icn', flightsPerDay: 4 },
  { from: 'can', to: 'cdg', flightsPerDay: 3 },
  { from: 'can', to: 'bom', flightsPerDay: 2 },
  { from: 'sin', to: 'syd', flightsPerDay: 3 },
]

export function findHub(id: string) {
  return hubs.find((h) => h.id === id)
}

export const networkAlerts = [
  { id: 'a1', hub: 'ewr', level: 'watch' as const, text: 'Winter weather watch — de-icing may add 20–40 min to departures.' },
  { id: 'a2', hub: 'dxb', level: 'info' as const, text: 'Peak season sort running at 112% of plan; extra gates open.' },
  { id: 'a3', hub: 'gru', level: 'watch' as const, text: 'Customs system maintenance 02:00–04:00 local time.' },
]

// ---------- Concept presentation ----------
// Edit `presenter` before presenting; it appears on the title and closing slides.

export const presenter = {
  name: 'Your Name',
  role: 'Senior Front-End Engineer · Applicant',
  email: 'you@example.com',
}

export const proposalKpis = [
  { value: '−30%', label: '“Where is my package?” contacts', note: 'via proactive status and map view' },
  { value: '2×', label: 'faster quote-to-label time', note: 'single guided four-step flow' },
  { value: '100', label: 'Lighthouse accessibility target', note: 'keyboard-first, WCAG 2.2 AA' },
  { value: '<1s', label: 'first contentful paint goal', note: 'server rendering + image CDN' },
]

export const roadmap = [
  { phase: 'Phase 1', time: 'Weeks 1–4', title: 'Foundations', items: ['Design tokens and component library', 'Tracking + manage delivery', 'Accessibility baseline audit'] },
  { phase: 'Phase 2', time: 'Weeks 5–10', title: 'Core journeys', items: ['Rate, ship and pickup flows', 'Location finder on live maps', 'Help centre search'] },
  { phase: 'Phase 3', time: 'Weeks 11–16', title: 'Network intelligence', items: ['Live network map for customers', 'Proactive disruption alerts', 'Business dashboards'] },
  { phase: 'Phase 4', time: 'Ongoing', title: 'Measure & iterate', items: ['A/B tests on key funnels', 'Performance budgets in CI', 'Quarterly usability studies'] },
]

// ---------- Dashboards (demo sign-in, sample data only) ----------

export const demoCustomer = {
  name: 'Alex Morgan',
  company: 'Northwind Studio',
  accountNumber: 'DEMO-0042',
  tier: 'Business Plus',
  savedAddresses: [
    { label: 'Studio', line: '220 Kent Ave, Brooklyn, NY 11249' },
    { label: 'Warehouse', line: '47-10 Austell Pl, Queens, NY 11101' },
    { label: 'Home', line: '18 Orchard St, New York, NY 10002' },
  ],
  notifications: [
    { id: 'n1', text: 'Shipment 998877665544 needs a commercial invoice.', level: 'action' as const, time: '2h ago' },
    { id: 'n2', text: '123412341234 is out for delivery today.', level: 'info' as const, time: '5h ago' },
    { id: 'n3', text: '445566778899 was delivered — left at front door.', level: 'success' as const, time: 'Yesterday' },
  ],
  monthlySpend: [
    { month: 'May', amount: 1240 },
    { month: 'Jun', amount: 1385 },
    { month: 'Jul', amount: 1190 },
    { month: 'Aug', amount: 1610 },
    { month: 'Sep', amount: 1745 },
    { month: 'Oct', amount: 1920 },
  ],
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'Customer' | 'Business' | 'Support agent' | 'Admin'
  status: 'Active' | 'Suspended' | 'Invited'
  shipments30d: number
}

export const adminUsers: Array<AdminUser> = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@example.com', role: 'Business', status: 'Active', shipments30d: 128 },
  { id: 'u2', name: 'Priya Natarajan', email: 'priya@example.com', role: 'Customer', status: 'Active', shipments30d: 6 },
  { id: 'u3', name: 'Diego Alvarez', email: 'diego@example.com', role: 'Business', status: 'Active', shipments30d: 342 },
  { id: 'u4', name: 'Hannah Becker', email: 'hannah@example.com', role: 'Support agent', status: 'Active', shipments30d: 0 },
  { id: 'u5', name: 'Kenji Watanabe', email: 'kenji@example.com', role: 'Customer', status: 'Suspended', shipments30d: 1 },
  { id: 'u6', name: 'Amara Okafor', email: 'amara@example.com', role: 'Admin', status: 'Active', shipments30d: 0 },
  { id: 'u7', name: 'Louis Martin', email: 'louis@example.com', role: 'Business', status: 'Invited', shipments30d: 0 },
]

/** Shipments handled per day across the network, in thousands (last 14 days). */
export const dailyShipmentsK = [
  15.2, 15.8, 16.1, 14.9, 12.4, 11.8, 15.6, 16.4, 16.9, 17.2, 16.7, 13.1, 12.5, 17.4,
]

export const supportTickets = [
  { id: 'T-1042', subject: 'Package marked delivered but not received', priority: 'High' as const, status: 'Open' as const, age: '3h' },
  { id: 'T-1041', subject: 'Customs invoice upload failing', priority: 'High' as const, status: 'In progress' as const, age: '5h' },
  { id: 'T-1039', subject: 'Request to change pickup window', priority: 'Low' as const, status: 'Open' as const, age: '1d' },
  { id: 'T-1036', subject: 'Billing dispute — residential surcharge', priority: 'Medium' as const, status: 'In progress' as const, age: '2d' },
  { id: 'T-1031', subject: 'Damaged box, claim started', priority: 'Medium' as const, status: 'Resolved' as const, age: '4d' },
]
