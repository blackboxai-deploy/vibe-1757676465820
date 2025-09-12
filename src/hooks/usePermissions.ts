'use client'

import { useMemo } from 'react'
import { Mesa, EventoEleitoral, StatusMesa, StatusEventoEleitoral } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export const usePermissions = (mesa?: Mesa, evento?: EventoEleitoral) => {
  const { currentUser } = useAuth()

  const isMesaEditavel = useMemo(() => {
    if (!mesa || !currentUser) return false
    
    // Admin can edit any non-locked table
    if (currentUser.role === 'admin') {
      return mesa.status !== StatusMesa.TRANCADA
    }
    
    // Regular user can only edit active table assigned to them
    return mesa.status === StatusMesa.ATIVA && mesa.userId === currentUser.id
  }, [mesa, currentUser])

  const isEventoEditavel = useMemo(() => {
    if (!evento || !currentUser) return false
    
    // Admin can edit any non-concluded event
    if (currentUser.role === 'admin') {
      return evento.status !== StatusEventoEleitoral.CONCLUIDO
    }
    
    // Regular user can only participate during active event
    return evento.status === StatusEventoEleitoral.ATIVO
  }, [evento, currentUser])

  const canAssignMesa = useMemo(() => {
    if (!currentUser) return false
    
    // Only admins can assign tables
    return currentUser.role === 'admin'
  }, [currentUser])

  const canCloseMesa = useMemo(() => {
    if (!mesa || !currentUser) return false
    
    // Admin can close any active table
    if (currentUser.role === 'admin') {
      return mesa.status === StatusMesa.ATIVA
    }
    
    // Regular user can close their own active table
    return mesa.status === StatusMesa.ATIVA && mesa.userId === currentUser.id
  }, [mesa, currentUser])

  const canViewStatistics = useMemo(() => {
    if (!currentUser) return false
    
    // Admins can view all statistics
    if (currentUser.role === 'admin') return true
    
    // Regular users can view statistics for their assigned tables
    return true // All users can view basic statistics
  }, [currentUser])

  const canManageUsers = useMemo(() => {
    if (!currentUser) return false
    
    // Only admins can manage users
    return currentUser.role === 'admin'
  }, [currentUser])

  const canManageEvents = useMemo(() => {
    if (!currentUser) return false
    
    // Only admins can manage events
    return currentUser.role === 'admin'
  }, [currentUser])

  const canDeleteMesa = useMemo(() => {
    if (!currentUser) return false
    
    // Only admins can delete tables
    return currentUser.role === 'admin'
  }, [currentUser])

  const canImportMesas = useMemo(() => {
    if (!currentUser) return false
    
    // Only admins can import tables
    return currentUser.role === 'admin'
  }, [currentUser])

  const canRegisterVotes = useMemo(() => {
    if (!mesa || !currentUser) return false
    
    // Must have table editing permissions
    if (!isMesaEditavel) return false
    
    // Must have total eleitores set
    if (!mesa.totalEleitores || mesa.totalEleitores <= 0) return false
    
    return true
  }, [mesa, currentUser, isMesaEditavel])

  const canSetTotalEleitores = useMemo(() => {
    if (!mesa || !currentUser) return false
    
    // Must have table editing permissions
    return isMesaEditavel
  }, [mesa, isMesaEditavel])

  const isWithinVotingHours = useMemo(() => {
    if (!evento) return false

    const now = new Date()
    const eventDate = new Date(evento.data_eleicao)
    const startTime = new Date(`${eventDate.toDateString()} ${evento.hora_abertura}`)
    const endTime = new Date(`${eventDate.toDateString()} ${evento.hora_encerramento}`)

    return now >= startTime && now <= endTime
  }, [evento])

  const isPastClosingTime = useMemo(() => {
    if (!evento) return false

    const now = new Date()
    const eventDate = new Date(evento.data_eleicao)
    const endTime = new Date(`${eventDate.toDateString()} ${evento.hora_encerramento}`)

    return now > endTime
  }, [evento])

  const canRegisterFinalResults = useMemo(() => {
    if (!mesa || !currentUser || !evento) return false
    
    // Must have table editing permissions
    if (!isMesaEditavel) return false
    
    // Must be past closing time for final results
    return isPastClosingTime
  }, [mesa, currentUser, evento, isMesaEditavel, isPastClosingTime])

  return {
    isMesaEditavel,
    isEventoEditavel,
    canAssignMesa,
    canCloseMesa,
    canViewStatistics,
    canManageUsers,
    canManageEvents,
    canDeleteMesa,
    canImportMesas,
    canRegisterVotes,
    canSetTotalEleitores,
    canRegisterFinalResults,
    isWithinVotingHours,
    isPastClosingTime
  }
}