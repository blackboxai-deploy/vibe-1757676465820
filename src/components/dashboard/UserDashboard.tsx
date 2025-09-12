'use client'

import React from 'react'
import Link from 'next/link'
import { EventoEleitoral, Mesa } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface UserDashboardProps {
  eventoAtivo: EventoEleitoral | null
  isEventoProximo: boolean
  mesasUsuario: Mesa[]
}

export function UserDashboard({ eventoAtivo, isEventoProximo, mesasUsuario }: UserDashboardProps) {
  const { currentUser } = useAuth()

  const getMesaStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-green-100 text-green-800'
      case 'fechada':
        return 'bg-yellow-100 text-yellow-800'
      case 'trancada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando informações do utilizador...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {currentUser.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie a sua mesa de voto e acompanhe as eleições em tempo real
        </p>
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>
      ) : isEventoProximo ? (
        <Alert>
          <AlertTitle>Evento Próximo</AlertTitle>
          <AlertDescription>
            Há um evento eleitoral agendado para os próximos dias. 
            Verifique se tem uma mesa atribuída.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>Nenhum Evento Ativo</AlertTitle>
          <AlertDescription>
            Não há eventos eleitorais ativos ou agendados no momento.
          </AlertDescription>
        </Alert>
      )}

      {/* User's Assigned Tables */}
      {mesasUsuario && mesasUsuario.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">As Suas Mesas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mesasUsuario.map((mesa) => (
              <Card key={mesa.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{mesa.nome}</CardTitle>
                      <CardDescription>{mesa.local}</CardDescription>
                    </div>
                    <Badge className={getMesaStatusColor(mesa.status)}>
                      {mesa.status.charAt(0).toUpperCase() + mesa.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mesa.totalEleitores > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Total de Eleitores</span>
                        <span>{mesa.totalEleitores}</span>
                      </div>
                      <Progress value={0} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        Aguardando registo de votos
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button asChild className="flex-1">
                      <Link href={`/mesa/${mesa.id}`}>
                        Gerir Mesa
                      </Link>
                    </Button>
                    {mesa.status === 'ativa' && (
                      <Button asChild variant="outline">
                        <Link href={`/mesa/${mesa.id}/votos`}>
                          Registar Votos
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : eventoAtivo ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Mesa Atribuída</CardTitle>
            <CardDescription>
              Ainda não tem uma mesa atribuída para o evento ativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Para participar na gestão eleitoral, precisa de ter uma mesa atribuída por um administrador
              ou pode seleccionar uma mesa disponível.
            </p>
            <Button asChild>
              <Link href="/seleccionar-mesa">
                Seleccionar Mesa
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Seleccionar Mesa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Escolha uma mesa disponível para os próximos eventos
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/seleccionar-mesa">
                Seleccionar
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Veja o histórico das suas atividades eleitorais
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/historico">
                Ver Histórico
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Atualize as suas informações pessoais
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/perfil">
                Editar Perfil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}