'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Button } from '@/components/ui/button'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentUser } = useAuth()
  const { isMobile } = useIsMobile()

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          user={currentUser}
        />
      )}

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-64 bg-white shadow-sm border-r border-gray-200">
            <Sidebar user={currentUser} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header>
            <div className="flex items-center">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentUser.role === 'admin' ? 'Administração' : 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  Bem-vindo, {currentUser.name}
                </p>
              </div>
            </div>
          </Header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}