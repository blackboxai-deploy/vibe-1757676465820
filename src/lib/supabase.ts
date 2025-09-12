import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client for development/build when env vars are not set
const createSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Return a mock client for build/development
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      resend: () => Promise.resolve({ error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
          limit: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
        }),
        in: () => ({ 
          lte: () => ({ 
            order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
          })
        })
      }),
      insert: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      update: () => ({ 
        eq: () => Promise.resolve({ error: new Error('Supabase not configured') })
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        neq: () => Promise.resolve({ error: new Error('Supabase not configured') })
      })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    })
  }
}

export const supabase = createSupabaseClient() as any

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  EVENTOS_ELEITORAIS: 'eventos_eleitorais',
  MESAS: 'mesas',
  EVENTO_MESAS: 'evento_mesas',
  EVENTO_MESAS_USUARIOS: 'evento_mesas_usuarios',
  VOTOS_UPDATES: 'votos_updates',
  HISTORICO_VOTOS: 'historico_votos',
  AUDIT_LOG: 'audit_log'
} as const

// Real-time channel names
export const CHANNELS = {
  MESAS: 'mesas-channel',
  USERS: 'users-channel',
  VOTOS: 'votos-channel',
  EVENTOS: 'eventos-channel'
} as const

// Helper functions for common database operations
export const dbHelpers = {
  // Get current user profile
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  },

  // Check if user is admin
  async isAdmin(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    
    if (!targetUserId) return false

    const { data } = await supabase
      .from(TABLES.PROFILES)
      .select('role')
      .eq('id', targetUserId)
      .single()

    return data?.role === 'admin'
  },

  // Get active electoral event
  async getActiveEvent() {
    const { data, error } = await supabase
      .from(TABLES.EVENTOS_ELEITORAIS)
      .select('*')
      .eq('status', 'ativo')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Get upcoming events (within 7 days)
  async getUpcomingEvents() {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data, error } = await supabase
      .from(TABLES.EVENTOS_ELEITORAIS)
      .select('*')
      .in('status', ['agendado', 'ativo'])
      .lte('data_eleicao', sevenDaysFromNow.toISOString())
      .order('data_eleicao', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get user's assigned tables for an event
  async getUserAssignedTables(userId: string, eventoId?: string) {
    let query = supabase
      .from(TABLES.EVENTO_MESAS_USUARIOS)
      .select(`
        *,
        evento_mesa:evento_mesas!inner(
          *,
          mesa:mesas!inner(*),
          evento:eventos_eleitorais!inner(*)
        )
      `)
      .eq('user_id', userId)
      .is('data_fim', null) // Only active assignments

    if (eventoId) {
      query = query.eq('evento_mesa.evento_eleitoral_id', eventoId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Check if table can be edited by user
  canEditMesa(mesa: any, user: any): boolean {
    if (!mesa || !user) return false
    
    // Admin can edit any non-locked table
    if (user.role === 'admin') {
      return mesa.status !== 'trancada'
    }
    
    // Regular user can only edit active tables assigned to them
    return mesa.status === 'ativa' && mesa.userId === user.id
  },

  // Check if event is within voting hours
  isWithinVotingHours(evento: any): boolean {
    if (!evento) return false

    const now = new Date()
    const eventDate = new Date(evento.data_eleicao)
    const startTime = new Date(`${eventDate.toDateString()} ${evento.hora_abertura}`)
    const endTime = new Date(`${eventDate.toDateString()} ${evento.hora_encerramento}`)

    return now >= startTime && now <= endTime
  },

  // Check if event is past closing time
  isPastClosingTime(evento: any): boolean {
    if (!evento) return false

    const now = new Date()
    const eventDate = new Date(evento.data_eleicao)
    const endTime = new Date(`${eventDate.toDateString()} ${evento.hora_encerramento}`)

    return now > endTime
  }
}

// Error handling utility
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    // Common Supabase error messages
    if (error.message.includes('JWT expired')) {
      return 'Your session has expired. Please log in again.'
    }
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password.'
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please check your email and confirm your account.'
    }
    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists.'
    }
    if (error.message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.'
    }
    
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}

// Rate limiting utility for real-time subscriptions
export class SubscriptionRateLimiter {
  private static instances = new Map<string, SubscriptionRateLimiter>()
  private lastExecution = 0
  private timeoutId: NodeJS.Timeout | null = null

  constructor(
    private name: string,
    private minInterval: number = 2000,
    private debounceTime: number = 500
  ) {}

  static getInstance(name: string, minInterval?: number, debounceTime?: number): SubscriptionRateLimiter {
    if (!this.instances.has(name)) {
      this.instances.set(name, new SubscriptionRateLimiter(name, minInterval, debounceTime))
    }
    return this.instances.get(name)!
  }

  debounce(callback: () => void | Promise<void>): void {
    const now = Date.now()
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    
    this.timeoutId = setTimeout(() => {
      if (now - this.lastExecution >= this.minInterval) {
        this.lastExecution = now
        callback()
      }
    }, this.debounceTime)
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

// Utility for creating debounced subscription handlers
export function createDebouncedSubscriptionHandler<T>(
  callback: () => void | Promise<void>,
  options: {
    name: string
    minInterval?: number
    debounceTime?: number
  }
): (payload: T) => void {
  const limiter = SubscriptionRateLimiter.getInstance(
    options.name,
    options.minInterval,
    options.debounceTime
  )
  
  return (payload: T) => {
    limiter.debounce(callback)
  }
}