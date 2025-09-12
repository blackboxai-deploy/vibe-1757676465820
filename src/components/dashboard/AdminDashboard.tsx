'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { EventoEleitoral, Mesa } from '@/types'
import { supabase, TABLES } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AdminDashboardProps {
  eventoAtivo: EventoEleitoral | null
  isEventoProximo: boolean
  mesasUsuario: Mesa[]
}

interface AdminStats {
  totalUsers: number
  pendingUsers: number
  totalMesas: number
  activeMesas: number
  totalEleitores: number
  votosRegistrados: number
  participationRate: number
}

export function AdminDashboard({ eventoAtivo }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true)
      
      // Fetch user statistics
      const { data: users, error: usersError } = await supabase
        .from(TABLES.PROFILES)
        .select('status')

      if (usersError) throw usersError

      const totalUsers = users?.length || 0
      const pendingUsers = users?.filter((u: any) => u.status === 'pending').length || 0

      // Fetch mesa statistics
      const { data: mesas, error: mesasError } = await supabase
        .from(TABLES.MESAS)
        .select('status, totalEleitores')

      if (mesasError) throw mesasError

      const totalMesas = mesas?.length || 0
      const activeMesas = mesas?.filter((m: any) => m.status === 'ativa').length || 0
      const totalEleitores = mesas?.reduce((sum: number, m: any) => sum + (m.totalEleitores || 0), 0) || 0

      // Fetch recent vote updates (simplified - would need proper aggregation in real system)
      const { data: votes, error: votesError } = await supabase
        .from(TABLES.VOTOS_UPDATES)
        .select('votosRegistrados')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (votesError) throw votesError

      const votosRegistrados = votes?.reduce((sum: number, v: any) => sum + v.votosRegistrados, 0) || 0
      const participationRate = totalEleitores > 0 ? (votosRegistrados / totalEleitores) * 100 : 0

      setStats({
        totalUsers,
        pendingUsers,
        totalMesas,
        activeMesas,
        totalEleitores,
        votosRegistrados,
        participationRate
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventoStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800'
      case 'agendado':
        return 'bg-blue-100 text-blue-800'
      case 'concluído':
        return 'bg-gray-100 text-gray-800'
      case 'cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return time
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Painel de Administração
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie utilizadores, mesas e acompanhe as eleições em tempo real
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Utilizadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalUsers}
              </div>
              {stats.pendingUsers > 0 && (
                <p className="text-xs text-orange-600">
                  {stats.pendingUsers} pendentes
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Mesas de Voto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalMesas}
              </div>
              <p className="text-xs text-green-600">
                {stats.activeMesas} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Eleitores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalEleitores.toLocaleString('pt-PT')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Participação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.participationRate.toFixed(1)}%
              </div>
              <Progress value={stats.participationRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Event Status */}
      {eventoAtivo ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{eventoAtivo.nome}</CardTitle>
                <CardDescription>
                  {eventoAtivo.tipo_eleicao.charAt(0).toUpperCase() + eventoAtivo.tipo_eleicao.slice(1)}
                </CardDescription>
              </div>
              <Badge className={getEventoStatusColor(eventoAtivo.status)}>
                {eventoAtivo.status.charAt(0).toUpperCase() + eventoAtivo.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Data da Eleição</p>
                <p className="text-lg">{formatDate(eventoAtivo.data_eleicao)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Horário de Votação</p>
                <p className="text-lg">
                  {formatTime(eventoAtivo.hora_abertura)} - {formatTime(eventoAtivo.hora_encerramento)}
                </p>
              </div>
              <div className="flex items-end">
                <Button asChild>
                  <Link href={`/admin/eventos/${eventoAtivo.id}`}>
                    Gerir Evento
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTitle>Nenhum Evento Ativo</AlertTitle>
          <AlertDescription>
            Não há eventos eleitorais ativos no momento. 
            <Link href="/admin/eventos" className="underline ml-1">
              Criar novo evento
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Gerir Utilizadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Aprovar novos utilizadores e gerir permissões
            </p>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/admin">
                  Gerir
                </Link>
              </Button>
              {stats?.pendingUsers && stats.pendingUsers > 0 && (
                <Badge variant="secondary">
                  {stats.pendingUsers} pendentes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Gerir Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Criar, editar e atribuir mesas de voto
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/mesas">
                Gerir Mesas
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Eventos Eleitorais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Criar e configurar eventos eleitorais
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/eventos">
                Gerir Eventos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Visualize estatísticas e relatórios detalhados
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/relatorios">
                Ver Relatórios
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monitorização</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Acompanhe a atividade do sistema em tempo real
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/monitor">
                Monitorizar
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Definições gerais do sistema
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/configuracoes">
                Configurar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}