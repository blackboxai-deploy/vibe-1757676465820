'use client'

import React from 'react'
import { AuthProvider } from './AuthContext'
import { NotificationProvider } from './NotificationContext'
import { MesaProvider } from './MesaContext'
import { Toaster } from 'sonner'

interface CombinedProviderProps {
  children: React.ReactNode
}

export const CombinedProvider: React.FC<CombinedProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MesaProvider>
          {children}
          <Toaster 
            richColors 
            position="top-right" 
            expand={true}
            visibleToasts={5}
            duration={4000}
            closeButton
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </MesaProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}