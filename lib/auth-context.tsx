"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { mockUser, type User } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock authentication - in production this would connect to Supabase
  const [user, setUser] = useState<User | null>(mockUser)

  const signIn = async (email: string, password: string) => {
    // Mock sign in - would call Supabase auth
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setUser(mockUser)
  }

  const signUp = async (name: string, email: string, password: string) => {
    // Mock sign up - would call Supabase auth
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setUser({ ...mockUser, name, email })
  }

  const signOut = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
