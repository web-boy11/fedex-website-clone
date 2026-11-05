# FedEx Website Redesign Concept

An **unofficial portfolio piece** that reimagines a global shipping carrier's website, built to show design and front-end engineering skill. It is not affiliated with or endorsed by FedEx. All page copy and imagery are original, the official logo isn't used (the name appears as plain type), and every tracking number, rate and location is sample data.

## What's inside

| Route | Screen |
| --- | --- |
| `/` | Home: tracking hero, quick actions, solution cards, global-network band, call to action |
| `/tracking?id=…` | Tracking: status summary, progress steps, travel history, exceptions, manage-delivery dialog |
| `/shipping` | Ship: live rate quotes, four-step shipment wizard, pickup scheduling |
| `/locations` | Location finder: search, type filters, results list, illustrated map |
| `/support` | Help centre: topics, FAQ accordions, chat/call options, contact form |
| `/business` | Business solutions: feature pillars, small-business and freight sections |

Sample tracking numbers: `778899001122` (in transit), `445566778899` (delivered), `123412341234` (out for delivery), `998877665544` (customs exception).

The site also has a mega-menu header, a mobile slide-out menu, a dismissible service alert, a skip link and a full footer.

## Tech

TanStack Start (React 19, file-based routing), Tailwind CSS 4, shadcn/ui on Radix, lucide icons, sonner toasts. Images are served through the Netlify Image CDN. The site deploys on Netlify.

## Run locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
# or, with Netlify emulation:
netlify dev
```

## Possible next steps

- Connect tracking and rates to real carrier APIs (in this concept they come from `src/lib/site-data.ts`)
- Replace the illustrated map with a real map provider
- Add account sign-in, saved addresses and shipment history
- Add localisation (language and region switcher)
