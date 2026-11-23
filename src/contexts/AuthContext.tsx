import React, { createContext, useContext, useState, useEffect } from 'react'
import { Profile, UserRole } from '../types/database'
import { dataService } from '../services/dataService'
import { supabase, isSupabaseConfigured } from '../integrations/supabase/client'

interface RegisterPayload {
  email: string
  password: string
  fullName: string
  bengaliName: string
  phone: string
  role: UserRole
  department: string
}

interface UpdateProfilePayload {
  fullName?: string
  bengaliName?: string
  phone?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: Profile | null
  currentRole: UserRole
  availableRoles: UserRole[]
  isLoading: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>
  updateUserProfile: (updates: UpdateProfilePayload) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const CURRENT_USER_KEY = 'hitune_active_user_id_v2'
const CURRENT_ROLE_KEY = 'hitune_active_role_v2'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole>('AUDIO_DESIGNER')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true)
      try {
        // 1. Check Supabase session if configured
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profile) {
              const activeProfile = profile as Profile
              setUser(activeProfile)
              setCurrentRole(activeProfile.role)
              localStorage.setItem(CURRENT_USER_KEY, activeProfile.id)
              localStorage.setItem(CURRENT_ROLE_KEY, activeProfile.role)
              setIsLoading(false)
              return
            }
          }
        }

        // 2. Check local saved user
        const staffList = await dataService.getStaff()
        const savedUserId = localStorage.getItem(CURRENT_USER_KEY)
        const savedRole = localStorage.getItem(CURRENT_ROLE_KEY) as UserRole | null

        const activeUser = staffList.find((s) => s.id === savedUserId)
        if (activeUser) {
          setUser(activeUser)
          const validRole = savedRole && (activeUser.roles.includes(savedRole) || activeUser.role === 'SUPER_ADMIN')
            ? savedRole
            : activeUser.role
          setCurrentRole(validRole)
        }
      } catch (err) {
        console.error('Failed to init auth:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Supabase auth state listener
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser(profile as Profile)
            setCurrentRole((profile as Profile).role)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem(CURRENT_USER_KEY)
          localStorage.removeItem(CURRENT_ROLE_KEY)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false
    if (user.role === 'SUPER_ADMIN' || user.roles.includes('SUPER_ADMIN')) return true
    const targets = Array.isArray(role) ? role : [role]
    return targets.some((r) => user.roles.includes(r) || currentRole === r)
  }

  const switchRole = (newRole: UserRole) => {
    if (!user) return
    if (user.roles.includes(newRole) || user.role === 'SUPER_ADMIN') {
      setCurrentRole(newRole)
      localStorage.setItem(CURRENT_ROLE_KEY, newRole)
    }
  }

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      let createdId = `usr-${Date.now()}`

      // Attempt Supabase live signup
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              full_name: payload.fullName,
              bengali_name: payload.bengaliName,
              phone: payload.phone,
              role: payload.role,
              department: payload.department,
            },
          },
        })

        if (error) {
          // If Supabase throws error, return error
          console.warn('Supabase signup error:', error)
          return { success: false, error: error.message }
        }

        if (data.user) {
          createdId = data.user.id
        }
      }

      // Create profile record
      const newProfile: Profile = {
        id: createdId,
        email: payload.email,
        full_name: payload.fullName,
        bengali_name: payload.bengaliName,
        phone: payload.phone,
        avatar_url: '',
        role: payload.role,
        roles: [payload.role],
        department: payload.department,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await dataService.createStaff(newProfile)

      setUser(newProfile)
      setCurrentRole(newProfile.role)
      localStorage.setItem(CURRENT_USER_KEY, newProfile.id)
      localStorage.setItem(CURRENT_ROLE_KEY, newProfile.role)

      return { success: true }
    } catch (err: any) {
      console.error('Registration failed:', err)
      return { success: false, error: err.message || 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে' }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          return { success: false, error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। দয়া করে পুনরায় চেষ্টা করুন।' }
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profile) {
            const activeProfile = profile as Profile
            setUser(activeProfile)
            setCurrentRole(activeProfile.role)
            localStorage.setItem(CURRENT_USER_KEY, activeProfile.id)
            localStorage.setItem(CURRENT_ROLE_KEY, activeProfile.role)
            return { success: true }
          }
        }
      }

      // Local fallback check
      const staffList = await dataService.getStaff()
      const matched = staffList.find((s) => s.email.toLowerCase() === email.toLowerCase().trim())
      if (matched) {
        setUser(matched)
        setCurrentRole(matched.role)
        localStorage.setItem(CURRENT_USER_KEY, matched.id)
        localStorage.setItem(CURRENT_ROLE_KEY, matched.role)
        return { success: true }
      }

      return { success: false, error: 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নিবন্ধন করুন।' }
    } catch (err: any) {
      console.error('Login error:', err)
      return { success: false, error: err.message || 'লগইন করতে সমস্যা হয়েছে' }
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserProfile = async (updates: UpdateProfilePayload): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'ইউজার লগইন করা নেই' }
    try {
      const updatedUser = await dataService.updateStaffProfile(user.id, {
        full_name: updates.fullName !== undefined ? updates.fullName : user.full_name,
        bengali_name: updates.bengaliName !== undefined ? updates.bengaliName : user.bengali_name,
        phone: updates.phone !== undefined ? updates.phone : user.phone,
        avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatar_url,
      })

      setUser({ ...updatedUser })
      return { success: true }
    } catch (err: any) {
      console.error('Profile update failed:', err)
      return { success: false, error: err.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে' }
    }
  }

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch {}
    }
    setUser(null)
    localStorage.removeItem(CURRENT_USER_KEY)
    localStorage.removeItem(CURRENT_ROLE_KEY)
  }

  const availableRoles: UserRole[] = user ? (user.role === 'SUPER_ADMIN' ? [
    'SUPER_ADMIN',
    'ORDER_MANAGER',
    'AUDIO_DESIGNER',
    'VIDEO_EDITOR',
    'QUALITY_CONTROLLER',
    'DELIVERY_MANAGER',
    'ACCOUNTANT'
  ] : user.roles) : []

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        availableRoles,
        isLoading,
        hasRole,
        login,
        register,
        updateUserProfile,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
