'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Usuario, PerfilUsuario } from '@/types'
import { usuariosMock } from '@/mocks/usuarios'

interface AuthContextType {
  usuario: Usuario | null
  isLoading: boolean
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  podeVisualizarValores: () => boolean
  podeAlterarStatus: () => boolean
  podeCriarCotacao: () => boolean
  podeEditarCadastrosBase: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'sig-lbcc-usuario'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se há sessão salva
    const usuarioSalvo = localStorage.getItem(STORAGE_KEY)
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 500))

    const usuarioEncontrado = usuariosMock.find(
      u => u.email === email && u.senha === senha && u.ativo
    )

    if (usuarioEncontrado) {
      setUsuario(usuarioEncontrado)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarioEncontrado))
      return true
    }

    return false
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Funções de permissão baseadas no perfil
  const podeVisualizarValores = () => {
    return usuario?.perfil === PerfilUsuario.OPERADOR || usuario?.perfil === PerfilUsuario.GESTOR
  }

  const podeAlterarStatus = () => {
    return usuario?.perfil === PerfilUsuario.OPERADOR || usuario?.perfil === PerfilUsuario.GESTOR
  }

  const podeCriarCotacao = () => {
    return usuario?.perfil === PerfilUsuario.OPERADOR || usuario?.perfil === PerfilUsuario.GESTOR
  }

  const podeEditarCadastrosBase = () => {
    return usuario?.perfil === PerfilUsuario.OPERADOR || usuario?.perfil === PerfilUsuario.GESTOR
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isLoading,
        login,
        logout,
        podeVisualizarValores,
        podeAlterarStatus,
        podeCriarCotacao,
        podeEditarCadastrosBase
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
