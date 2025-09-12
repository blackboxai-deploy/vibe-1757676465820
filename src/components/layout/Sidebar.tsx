'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@/types'
import { cn } from '@/lib/utils'

interface SidebarProps {
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user.role === 'admin'
  )

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">VH</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Voto na Hora</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
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
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
            <span className="text-gray-700 font-medium text-sm">
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
    </div>
  )
}