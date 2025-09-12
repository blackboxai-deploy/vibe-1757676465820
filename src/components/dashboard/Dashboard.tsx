'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useEventoEleitoral } from '@/hooks/useEventoEleitoral'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AppLayout } from '@/components/layout/AppLayout'
import { UserDashboard } from './UserDashboard'
import { AdminDashboard } from './AdminDashboard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function Dashboard() {
  const { currentUser } = useAuth()
  const { eventoAtivo, isEventoProximo, mesasUsuario, isLoading } = useEventoEleitoral()
  const { } = useIsMobile()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const dashboardContent = currentUser?.role === 'admin' ? (
    <AdminDashboard 
      eventoAtivo={eventoAtivo}
      isEventoProximo={isEventoProximo}
      mesasUsuario={mesasUsuario}
    />
  ) : (
    <UserDashboard 
      eventoAtivo={eventoAtivo}
      isEventoProximo={isEventoProximo}
      mesasUsuario={mesasUsuario}
    />
  )

  return (
    <AppLayout>
      {dashboardContent}
    </AppLayout>
  )
}