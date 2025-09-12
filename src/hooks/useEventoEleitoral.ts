'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, TABLES } from '@/lib/supabase'
import { EventoEleitoral, Mesa, StatusEventoEleitoral } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export const useEventoEleitoral = () => {
  const [eventoAtivo, setEventoAtivo] = useState<EventoEleitoral | null>(null)
  const [isEventoProximo, setIsEventoProximo] = useState(false)
  const [mesasUsuario, setMesasUsuario] = useState<Mesa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser } = useAuth()

  const getEventoEleitoralAtivoOuProximo = useCallback(async () => {
    try {
      // First, try to get active event
      const { data: activeEvent } = await supabase
        .from(TABLES.EVENTOS_ELEITORAIS)
        .select('*')
        .eq('status', StatusEventoEleitoral.ATIVO)
        .single()

      if (activeEvent) {
        return {
          ...activeEvent,
          data_eleicao: new Date(activeEvent.data_eleicao),
          created_at: new Date(activeEvent.created_at),
          updated_at: activeEvent.updated_at ? new Date(activeEvent.updated_at) : undefined,
          locked_at: activeEvent.locked_at ? new Date(activeEvent.locked_at) : undefined
        } as EventoEleitoral
      }

      // If no active event, look for upcoming events within 7 days
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      const { data: upcomingEvents } = await supabase
        .from(TABLES.EVENTOS_ELEITORAIS)
        .select('*')
        .eq('status', StatusEventoEleitoral.AGENDADO)
        .lte('data_eleicao', sevenDaysFromNow.toISOString())
        .order('data_eleicao', { ascending: true })
        .limit(1)

      if (upcomingEvents && upcomingEvents.length > 0) {
        return {
          ...upcomingEvents[0],
          data_eleicao: new Date(upcomingEvents[0].data_eleicao),
          created_at: new Date(upcomingEvents[0].created_at),
          updated_at: upcomingEvents[0].updated_at ? new Date(upcomingEvents[0].updated_at) : undefined,
          locked_at: upcomingEvents[0].locked_at ? new Date(upcomingEvents[0].locked_at) : undefined
        } as EventoEleitoral
      }

      return null
    } catch (error) {
      console.error('Error fetching evento eleitoral:', error)
      return null
    }
  }, [])

  const getMesasEventoUsuario = useCallback(async (userId: string) => {
    if (!eventoAtivo) return []

    try {
      // Get user's assigned tables for the active event
      const { data } = await supabase
        .from(TABLES.EVENTO_MESAS_USUARIOS)
        .select(`
          *,
          evento_mesa:evento_mesas!inner(
            *,
            mesa:mesas!inner(*)
          )
        `)
        .eq('user_id', userId)
        .eq('evento_mesa.evento_eleitoral_id', eventoAtivo.id)
        .is('data_fim', null) // Only active assignments

      if (!data) return []

      return data.map((assignment: any) => ({
        ...assignment.evento_mesa.mesa,
        created_at: new Date(assignment.evento_mesa.mesa.created_at),
        updated_at: assignment.evento_mesa.mesa.updated_at ? new Date(assignment.evento_mesa.mesa.updated_at) : undefined,
        fechada_at: assignment.evento_mesa.mesa.fechada_at ? new Date(assignment.evento_mesa.mesa.fechada_at) : undefined,
        locked_at: assignment.evento_mesa.mesa.locked_at ? new Date(assignment.evento_mesa.mesa.locked_at) : undefined,
        data_fim: assignment.data_fim // Include assignment end date
      })) as Mesa[]
    } catch (error) {
      console.error('Error fetching user tables:', error)
      return []
    }
  }, [eventoAtivo])

  const isEventoProximoFn = useCallback((evento: EventoEleitoral): boolean => {
    if (!evento) return false

    const now = new Date()
    const eventDate = new Date(evento.data_eleicao)
    const diffInDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return diffInDays <= 7 && diffInDays >= 0 && evento.status === StatusEventoEleitoral.AGENDADO
  }, [])

  const buscarEventoAtivo = useCallback(async () => {
    if (!currentUser) {
      setEventoAtivo(null)
      setIsEventoProximo(false)
      setMesasUsuario([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const evento = await getEventoEleitoralAtivoOuProximo()
      
      if (evento) {
        setEventoAtivo(evento)
        setIsEventoProximo(isEventoProximoFn(evento))
        
        // Get user's tables if event is active
        if (evento.status === StatusEventoEleitoral.ATIVO) {
          const mesas = await getMesasEventoUsuario(currentUser.id)
          setMesasUsuario(mesas)
        } else {
          setMesasUsuario([])
        }
      } else {
        setEventoAtivo(null)
        setIsEventoProximo(false)
        setMesasUsuario([])
      }
    } catch (error) {
      console.error('Error in buscarEventoAtivo:', error)
      setEventoAtivo(null)
      setIsEventoProximo(false)
      setMesasUsuario([])
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, getEventoEleitoralAtivoOuProximo, getMesasEventoUsuario, isEventoProximoFn])

  useEffect(() => {
    buscarEventoAtivo()
  }, [buscarEventoAtivo])

  // Real-time subscription for events
  useEffect(() => {
    if (!currentUser) return

    const subscription = supabase
      .channel('eventos-eleitoral-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public',
          table: TABLES.EVENTOS_ELEITORAIS 
        } as any, 
        () => {
          // Debounce the refresh
          setTimeout(() => {
            buscarEventoAtivo()
          }, 1000)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentUser, buscarEventoAtivo])

  return { 
    eventoAtivo, 
    isEventoProximo, 
    mesasUsuario, 
    isLoading,
    recarregar: buscarEventoAtivo 
  }
}