import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  User,
  Building2,
  Settings
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useCompany } from '../../contexts/CompanyContext'
import Button from '../ui/Button'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme, isDark } = useTheme()
  const { currentCompany, companies, switchCompany } = useCompany()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCompanyMenu, setShowCompanyMenu] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {/* Company Selector */}
        {companies.length > 1 && (
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className="flex items-center space-x-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="max-w-32 truncate">{currentCompany?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showCompanyMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        switchCompany(company.id)
                        setShowCompanyMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        currentCompany?.id === company.id
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-medium truncate">{company.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          Plano {company.plan}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/notifications')}
          className="p-2 relative"
        >
          <Bell className="h-4 w-4" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-error-500 rounded-full"></span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2"
          >
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.email}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/profile')
                    setShowUserMenu(false)
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="mr-3 h-4 w-4" />
                  Perfil
                </button>
                <button
                  onClick={() => {
                    navigate('/settings')
                    setShowUserMenu(false)
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Configurações
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header