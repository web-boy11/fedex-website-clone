import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Globe, Menu, Search, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandMark } from '@/components/site/brand-mark'
import { AccountMenu } from '@/components/site/account-menu'
import { mainNav, serviceAlert } from '@/lib/site-data'

export function SiteHeader() {
  const [alertOpen, setAlertOpen] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-6">
          <BrandMark />

          <nav
            aria-label="Main"
            className="hidden h-full items-stretch lg:flex"
            onMouseLeave={() => setOpenMenu(null)}
          >
            {mainNav.map((group) => (
              <div
                key={group.label}
                className="relative flex items-stretch"
                onMouseEnter={() => setOpenMenu(group.label)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 px-4 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary data-[open=true]:text-primary motion-reduce:transition-none"
                  aria-expanded={openMenu === group.label}
                  data-open={openMenu === group.label}
                  onClick={() =>
                    setOpenMenu(openMenu === group.label ? null : group.label)
                  }
                >
                  {group.label}
                  <ChevronDown className="size-3.5" aria-hidden />
                </button>
                {openMenu === group.label && (
                  <div className="absolute top-full left-0 w-80 rounded-b-lg border border-t-2 border-t-accent bg-popover p-2 shadow-xl animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none">
                    {group.links.map((link) => (
                      <Link
                        key={link.label}
                        to={link.to}
                        onClick={() => setOpenMenu(null)}
                        className="block rounded-md px-3 py-2.5 transition-colors hover:bg-secondary"
                      >
                        <span className="block text-sm font-semibold">
                          {link.label}
                        </span>
                        {link.description && (
                          <span className="block text-xs text-muted-foreground">
                            {link.description}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/support" aria-label="Search help">
                <Search />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => toast('Region: United States · English')}
            >
              <Globe /> US
            </Button>
            <AccountMenu className="hidden sm:inline-flex" />

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Browse every section</SheetDescription>
                </SheetHeader>
                <nav aria-label="Mobile" className="space-y-6 px-4 pb-8">
                  {mainNav.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
                        {group.label}
                      </p>
                      <ul className="space-y-1">
                        {group.links.map((link) => (
                          <li key={link.label}>
                            <Link
                              to={link.to}
                              className="block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-secondary"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <AccountMenu fullWidth />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {alertOpen && (
        <div className="border-b bg-secondary">
          <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2 text-sm sm:px-6">
            <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-accent-foreground uppercase">
              Service alert
            </span>
            <p className="flex-1 text-secondary-foreground">
              {serviceAlert}{' '}
              <Link to="/tracking" className="font-semibold underline">
                Track now
              </Link>
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss alert"
              onClick={() => setAlertOpen(false)}
            >
              <X />
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
