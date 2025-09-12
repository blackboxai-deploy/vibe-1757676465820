'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

interface NavItem {
  name: string
  href: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
  },
  {
    name: 'A Minha Mesa',
    href: '/mesa',
  },
  {
    name: 'Seleccionar Mesa',
    href: '/seleccionar-mesa',
  },
  {
    name: 'Administração',
    href: '/admin',
    adminOnly: true,
  },
  {
    name: 'Gerir Mesas',
    href: '/admin/mesas',
    adminOnly: true,
  },
  {
    name: 'Eventos Eleitorais',
    href: '/admin/eventos',
    adminOnly: true,
  },
]

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user.role === 'admin'
  )

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">VH</span>
              </div>
              <span>Voto na Hora</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex flex-col space-y-2 mt-6">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <span className="text-gray-700 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role === 'admin' ? 'Administrador' : 'Utilizador'}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}