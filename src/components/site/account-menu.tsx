import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDemoSession } from '@/lib/demo-session'

export function AccountMenu({ className, fullWidth = false }: { className?: string; fullWidth?: boolean }) {
  const { role, signIn, signOut } = useDemoSession()
  const navigate = useNavigate()

  const handleSignIn = () => {
    signIn('customer')
    toast.success('Signed in to Customer Account')
    void navigate({ to: '/account' })
  }

  const handleSignOut = () => {
    signOut()
    toast('Signed out successfully')
    void navigate({ to: '/' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className={fullWidth ? 'w-full' : className}>
          <UserRound className="size-4" />
          {role === 'customer' ? 'My Account' : 'Sign In'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {role === 'customer' ? (
          <>
            <DropdownMenuLabel>
              Alex Morgan
              <span className="block text-xs font-normal text-muted-foreground">DEMO-0042 · Business Plus</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account">
                <LayoutDashboard className="size-4" /> Account Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/shipping">
                Ship a Package
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="size-4" /> Sign Out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
              Access your saved addresses and active shipments
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={handleSignIn}>
              <UserRound className="size-4" /> Sign In to Account
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
