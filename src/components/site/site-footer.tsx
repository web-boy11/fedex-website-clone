import { Link } from '@tanstack/react-router'

import { BrandMark } from '@/components/site/brand-mark'
import { footerColumns } from '@/lib/site-data'

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground print:hidden">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <BrandMark inverted />
          <p className="max-w-xs text-sm text-primary-foreground/70">
            Fast, reliable shipping solutions for individuals and businesses —
            track packages, get rate quotes, and manage deliveries worldwide.
          </p>
        </div>
        {footerColumns.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-bold">{col.title}</h2>
            <ul className="space-y-2 text-sm text-primary-foreground/75">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-accent motion-reduce:transition-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} FedEx. All rights reserved. FedEx is a
            registered trademark of FedEx Corporation.
          </p>
          <p className="shrink-0">Privacy Policy · Terms of Use</p>
        </div>
      </div>
    </footer>
  )
}
