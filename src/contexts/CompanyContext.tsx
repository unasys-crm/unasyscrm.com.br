import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { Company, Profile } from '../types'
import toast from 'react-hot-toast'

interface CompanyContextType {
  currentCompany: Company | null
  companies: Company[]
  profiles: Profile[]
  loading: boolean
  switchCompany: (companyId: string) => void
  refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

interface CompanyProviderProps {
  children: React.ReactNode
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompanies = async () => {
    if (!user) {
      console.log('CompanyContext: No user, skipping company fetch')
      setCurrentCompany(null)
      setCompanies([])
      setProfiles([])
      setLoading(false)
      return
    }

    try {
      console.log('CompanyContext: Fetching companies for user:', {
        email: user.email,
        id: user.id
      })
      
      // Fetch user profiles with company data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (profilesError) {
        console.error('CompanyContext: Error fetching profiles:', profilesError)
        
        // Se não conseguiu buscar perfis, tentar criar um automaticamente
        console.log('CompanyContext: Attempting to create profile for user')
        
        // Buscar empresa demo
        const { data: demoCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('email', 'demo@unasyscrm.com.br')
          .single()
        
        if (demoCompany) {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              company_id: demoCompany.id,
              role: 'admin',
              permissions: {
                clients: { create: true, read: true, update: true, delete: true },
                proposals: { create: true, read: true, update: true, delete: true },
                tasks: { create: true, read: true, update: true, delete: true },
                reports: { create: true, read: true, update: true, delete: false }
              },
              is_active: true
            })
          
          if (!createError) {
            console.log('CompanyContext: Profile created, retrying fetch')
            // Tentar buscar novamente
            const { data: retryData } = await supabase
              .from('profiles')
              .select(`
                *,
                company:companies(*)
              `)
              .eq('user_id', user.id)
              .eq('is_active', true)
            
            if (retryData) {
              profilesData = retryData
            }
          }
        }
        
        if (!profilesData) {
          throw profilesError
        }
      }

      console.log('CompanyContext: Profiles data:', profilesData)
      const userProfiles = profilesData || []
      const userCompanies = userProfiles
        .map(profile => profile.company)
        .filter(Boolean) as Company[]

      console.log('CompanyContext: User companies:', userCompanies)
      setProfiles(userProfiles)
      setCompanies(userCompanies)

      // Set current company from localStorage or first available
      const savedCompanyId = localStorage.getItem('currentCompanyId')
      let selectedCompany = null

      if (savedCompanyId) {
        selectedCompany = userCompanies.find(c => c.id === savedCompanyId)
        console.log('CompanyContext: Found saved company:', selectedCompany?.name)
      }

      if (!selectedCompany && userCompanies.length > 0) {
        selectedCompany = userCompanies[0]
        console.log('CompanyContext: Using first available company:', selectedCompany?.name)
      }

      console.log('CompanyContext: Final selected company:', selectedCompany)
      setCurrentCompany(selectedCompany || null)

      if (selectedCompany) {
        localStorage.setItem('currentCompanyId', selectedCompany.id)
      }
    } catch (error: any) {
      console.error('CompanyContext: Error fetching companies:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  const switchCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setCurrentCompany(company)
      localStorage.setItem('currentCompanyId', companyId)
      toast.success(`Empresa alterada para ${company.name}`)
    }
  }

  const refreshCompanies = async () => {
    setLoading(true)
    await fetchCompanies()
  }

  useEffect(() => {
    fetchCompanies()
  }, [user])

  const value = {
    currentCompany,
    companies,
    profiles,
    loading,
    switchCompany,
    refreshCompanies,
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}