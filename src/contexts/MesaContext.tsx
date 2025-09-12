'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, handleSupabaseError, createDebouncedSubscriptionHandler, TABLES, CHANNELS } from '@/lib/supabase'
import { Mesa, MesaContextType, EventoEleitoral, User, StatusMesa } from '@/types'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'

const MesaContext = createContext<MesaContextType | undefined>(undefined)

export function useMesa() {
  const context = useContext(MesaContext)
  if (context === undefined) {
    throw new Error('useMesa must be used within a MesaProvider')
  }
  return context
}

export function MesaProvider({ children }: { children: React.ReactNode }) {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser } = useAuth()
  const { error: notifyError, success: notifySuccess } = useNotifications()

  const fetchMesas = useCallback(async () => {
    if (!currentUser) {
      setMesas([])
      setIsLoading(false)
      return
    }

    try {
      let query = supabase.from(TABLES.MESAS).select('*')
      
      // If user is not admin, only show their assigned tables
      if (currentUser.role !== 'admin') {
        query = query.eq('userId', currentUser.id)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      
      const mesasData = data?.map((mesa: any) => ({
        ...mesa,
        created_at: new Date(mesa.created_at),
        updated_at: mesa.updated_at ? new Date(mesa.updated_at) : undefined,
        fechada_at: mesa.fechada_at ? new Date(mesa.fechada_at) : undefined,
        locked_at: mesa.locked_at ? new Date(mesa.locked_at) : undefined
      })) || []
      
      setMesas(mesasData)
    } catch (error) {
      console.error('Error fetching mesas:', error)
      notifyError('Erro ao carregar mesas', handleSupabaseError(error))
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, notifyError])

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return

    const handleMesasChange = createDebouncedSubscriptionHandler(() => {
      fetchMesas()
    }, {
      name: 'mesas-changes',
      minInterval: 2000,
      debounceTime: 500
    })

    const subscription = supabase
      .channel(CHANNELS.MESAS)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: TABLES.MESAS 
      } as any, handleMesasChange)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentUser, fetchMesas])

  // Initial load
  useEffect(() => {
    if (currentUser) {
      fetchMesas()
    }
  }, [currentUser, fetchMesas])

  const assignarMesa = useCallback(async (userId: string, mesaId: string): Promise<boolean> => {
    if (!currentUser) return false

    try {
      // Check if user is admin or assigning to themselves
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
        throw new Error('Não tem permissão para atribuir esta mesa')
      }

      const { error } = await supabase
        .from(TABLES.MESAS)
        .update({ userId: userId })
        .eq('id', mesaId)

      if (error) throw error

      notifySuccess('Mesa atribuída', 'Mesa atribuída com sucesso')
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error assigning mesa:', error)
      notifyError('Erro ao atribuir mesa', handleSupabaseError(error))
      return false
    }
  }, [currentUser, notifyError, notifySuccess, fetchMesas])

  const removerMesa = useCallback(async (userId: string, mesaId: string): Promise<boolean> => {
    if (!currentUser) return false

    try {
      // Check if user is admin or removing from themselves
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
        throw new Error('Não tem permissão para remover esta mesa')
      }

      const { error } = await supabase
        .from(TABLES.MESAS)
        .update({ userId: null })
        .eq('id', mesaId)

      if (error) throw error

      notifySuccess('Mesa removida', 'Atribuição removida com sucesso')
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error removing mesa assignment:', error)
      notifyError('Erro ao remover mesa', handleSupabaseError(error))
      return false
    }
  }, [currentUser, notifyError, notifySuccess, fetchMesas])

  const registrarVotos = useCallback(async (mesaId: string, votos: number): Promise<boolean> => {
    if (!currentUser) return false

    try {
      const mesa = mesas.find(m => m.id === mesaId)
      if (!mesa) {
        throw new Error('Mesa não encontrada')
      }

      // Check permissions
      if (!isMesaEditavel(mesa, currentUser)) {
        throw new Error('Não tem permissão para editar esta mesa')
      }

      // Validate vote count
      if (votos > mesa.totalEleitores) {
        throw new Error('O número de votos não pode ser superior ao total de eleitores')
      }

      if (votos < 0) {
        throw new Error('O número de votos não pode ser negativo')
      }

      // Insert vote update record
      const { error: voteError } = await supabase
        .from(TABLES.VOTOS_UPDATES)
        .insert([{
          mesaId: mesaId,
          votosRegistrados: votos,
          userId: currentUser.id,
          timestamp: new Date().toISOString(),
          tipo: 'parcial'
        }])

      if (voteError) throw voteError

      // Update historical record
      const { error: historyError } = await supabase
        .from(TABLES.HISTORICO_VOTOS)
        .insert([{
          mesaId: mesaId,
          votosRegistrados: votos,
          totalEleitores: mesa.totalEleitores,
          percentagem: (votos / mesa.totalEleitores) * 100,
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: new Date().toISOString(),
          tipo: 'parcial'
        }])

      if (historyError) throw historyError

      notifySuccess('Votos registrados', `${votos} votos registrados com sucesso`)
      return true
    } catch (error) {
      console.error('Error registering votes:', error)
      notifyError('Erro ao registrar votos', handleSupabaseError(error))
      return false
    }
  }, [currentUser, mesas, notifyError, notifySuccess])

  const registrarTotalEleitores = useCallback(async (mesaId: string, total: number): Promise<boolean> => {
    if (!currentUser) return false

    try {
      const mesa = mesas.find(m => m.id === mesaId)
      if (!mesa) {
        throw new Error('Mesa não encontrada')
      }

      // Check permissions
      if (!isMesaEditavel(mesa, currentUser)) {
        throw new Error('Não tem permissão para editar esta mesa')
      }

      if (total < 0) {
        throw new Error('O total de eleitores não pode ser negativo')
      }

      const { error } = await supabase
        .from(TABLES.MESAS)
        .update({ totalEleitores: total })
        .eq('id', mesaId)

      if (error) throw error

      notifySuccess('Total de eleitores atualizado', `Total definido para ${total} eleitores`)
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error updating total eleitores:', error)
      notifyError('Erro ao atualizar total', handleSupabaseError(error))
      return false
    }
  }, [currentUser, mesas, notifyError, notifySuccess, fetchMesas])

  const adicionarMesa = useCallback(async (nome: string, local: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      notifyError('Acesso negado', 'Apenas administradores podem adicionar mesas')
      return false
    }

    try {
      const { error } = await supabase
        .from(TABLES.MESAS)
        .insert([{
          nome,
          local,
          totalEleitores: 0,
          userId: null,
          status: StatusMesa.INATIVA
        }])

      if (error) throw error

      notifySuccess('Mesa criada', 'Mesa criada com sucesso')
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error adding mesa:', error)
      notifyError('Erro ao criar mesa', handleSupabaseError(error))
      return false
    }
  }, [currentUser, notifyError, notifySuccess, fetchMesas])

  const atualizarMesa = useCallback(async (mesaId: string, nome: string, local: string): Promise<boolean> => {
    if (!currentUser) return false

    try {
      const mesa = mesas.find(m => m.id === mesaId)
      if (!mesa) {
        throw new Error('Mesa não encontrada')
      }

      // Check permissions
      if (currentUser.role !== 'admin' && mesa.userId !== currentUser.id) {
        throw new Error('Não tem permissão para editar esta mesa')
      }

      const { error } = await supabase
        .from(TABLES.MESAS)
        .update({ nome, local })
        .eq('id', mesaId)

      if (error) throw error

      notifySuccess('Mesa atualizada', 'Mesa atualizada com sucesso')
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error updating mesa:', error)
      notifyError('Erro ao atualizar mesa', handleSupabaseError(error))
      return false
    }
  }, [currentUser, mesas, notifyError, notifySuccess, fetchMesas])

  const eliminarMesa = useCallback(async (mesaId: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      notifyError('Acesso negado', 'Apenas administradores podem eliminar mesas')
      return false
    }

    try {
      const { error } = await supabase
        .from(TABLES.MESAS)
        .delete()
        .eq('id', mesaId)

      if (error) throw error

      notifySuccess('Mesa eliminada', 'Mesa eliminada com sucesso')
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error deleting mesa:', error)
      notifyError('Erro ao eliminar mesa', handleSupabaseError(error))
      return false
    }
  }, [currentUser, notifyError, notifySuccess, fetchMesas])

  const eliminarTodasMesas = useCallback(async (): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      notifyError('Acesso negado', 'Apenas administradores podem eliminar todas as mesas')
      return false
    }

    try {
      const { error } = await supabase
        .from(TABLES.MESAS)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (error) throw error

      notifySuccess('Mesas eliminadas', 'Todas as mesas foram eliminadas')
      await fetchMesas()
      return true
    } catch (error) {
      console.error('Error deleting all mesas:', error)
      notifyError('Erro ao eliminar mesas', handleSupabaseError(error))
      return false
    }
  }, [currentUser, notifyError, notifySuccess, fetchMesas])

  const isMesaEditavel = useCallback((mesa: Mesa, user: User): boolean => {
    if (!mesa || !user) return false
    
    // Admin can edit any non-locked table
    if (user.role === 'admin') {
      return mesa.status !== StatusMesa.TRANCADA
    }
    
    // Regular user can only edit active tables assigned to them
    return mesa.status === StatusMesa.ATIVA && mesa.userId === user.id
  }, [])

  const isEventoFechado = useCallback((evento: EventoEleitoral): boolean => {
    if (!evento) return true
    return evento.status === 'concluído' || evento.status === 'cancelado'
  }, [])

  const recarregarMesas = useCallback(async () => {
    await fetchMesas()
  }, [fetchMesas])

  const value: MesaContextType = {
    mesas,
    isLoading,
    assignarMesa,
    removerMesa,
    registrarVotos,
    registrarTotalEleitores,
    adicionarMesa,
    atualizarMesa,
    eliminarMesa,
    eliminarTodasMesas,
    isMesaEditavel,
    isEventoFechado,
    recarregarMesas
  }

  return (
    <MesaContext.Provider value={value}>
      {children}
    </MesaContext.Provider>
  )
}