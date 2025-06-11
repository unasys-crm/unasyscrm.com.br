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
      setLoading(false)
      return
    }

    try {
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
        throw profilesError
      }

      const userProfiles = profilesData || []
      const userCompanies = userProfiles
        .map(profile => profile.company)
        .filter(Boolean) as Company[]

      setProfiles(userProfiles)
      setCompanies(userCompanies)

      // Set current company from localStorage or first available
      const savedCompanyId = localStorage.getItem('currentCompanyId')
      let selectedCompany = null

      if (savedCompanyId) {
        selectedCompany = userCompanies.find(c => c.id === savedCompanyId)
      }

      if (!selectedCompany && userCompanies.length > 0) {
        selectedCompany = userCompanies[0]
      }

      setCurrentCompany(selectedCompany || null)

      if (selectedCompany) {
        localStorage.setItem('currentCompanyId', selectedCompany.id)
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error)
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