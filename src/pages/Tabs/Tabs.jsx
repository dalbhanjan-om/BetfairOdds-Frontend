import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, TrendingUp, BookOpen } from 'lucide-react'

const Tabs = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { id: 'events', label: 'Events', path: '/listEvents', icon: Calendar },
    { id: 'profit', label: 'Profit', path: '/profit', icon: TrendingUp },
    { id: 'rules', label: 'Rules', path: '/rules', icon: BookOpen },
  ]

  const isActiveTab = (path) => location.pathname === path

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:top-0 lg:bottom-auto border-t lg:border-t-0 lg:border-b border-white/10 bg-slate-900 shadow-lg z-50">
      <div className="flex justify-around max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = isActiveTab(tab.path)
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-amber-400 border-b-2 lg:border-b-0 lg:border-t-2 border-amber-400'
                  : 'text-slate-300 hover:text-slate-100'
              }`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Tabs