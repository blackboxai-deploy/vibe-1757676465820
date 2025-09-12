'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, handleSupabaseError } from '@/lib/supabase'
import { User, AuthContextType, UserStatus } from '@/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const setUser = useCallback((user: User | null) => {
    setCurrentUser(user)
    setIsAuthenticated(!!user)
  }, [])

  const fetchUserProfile = useCallback(async (supabaseUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      // Check if user is approved
      if (data.status !== UserStatus.APPROVED) {
        console.log('User not approved, logging out')
        await supabase.auth.signOut()
        return null
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        status: data.status,
        mesaId: data.mesa_id,
        created_at: new Date(data.created_at),
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined
      } as User

    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }, [])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const user = await fetchUserProfile(session.user)
          setUser(user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state changed:', event)
        
        if (session?.user) {
          const user = await fetchUserProfile(session.user)
          setUser(user)
        } else {
          setUser(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, setUser])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const user = await fetchUserProfile(data.user)
        if (!user) {
          throw new Error('User not approved or account disabled')
        }
        setUser(user)
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(handleSupabaseError(error))
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserProfile, setUser])

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create profile with pending status
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: email,
              name: name,
              role: 'user',
              status: UserStatus.PENDING
            }
          ])

        if (profileError) throw profileError

        return true
      }

      return false
    } catch (error) {
      console.error('Registration error:', error)
      throw new Error(handleSupabaseError(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw new Error(handleSupabaseError(error))
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  const updateProfile = useCallback(async (userId: string, data: Partial<User>): Promise<boolean> => {
    try {
      const updateData: any = {}
      
      if (data.name) updateData.name = data.name
      if (data.email) updateData.email = data.email
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Refresh user profile
      if (currentUser && currentUser.id === userId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const updatedUser = await fetchUserProfile(user)
          setUser(updatedUser)
        }
      }

      return true
    } catch (error) {
      console.error('Update profile error:', error)
      throw new Error(handleSupabaseError(error))
    }
  }, [currentUser, fetchUserProfile, setUser])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // First verify current password by attempting to sign in
      if (currentUser?.email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: currentPassword
        })
        
        if (verifyError) {
          throw new Error('Current password is incorrect')
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Change password error:', error)
      throw new Error(handleSupabaseError(error))
    }
  }, [currentUser])

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Reset password error:', error)
      throw new Error(handleSupabaseError(error))
    }
  }, [])

  const changeEmail = useCallback(async (newEmail: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Change email error:', error)
      throw new Error(handleSupabaseError(error))
    }
  }, [])

  const verifyEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Verify email error:', error)
      throw new Error(handleSupabaseError(error))
    }
  }, [])

  const value: AuthContextType = {
    currentUser,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    resetPassword,
    changeEmail,
    verifyEmail,
    setUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}