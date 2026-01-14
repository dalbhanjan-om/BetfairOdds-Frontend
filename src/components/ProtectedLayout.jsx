import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Tabs from '../pages/Tabs/Tabs'

const ProtectedLayout = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Tabs />
      <div className="pb-24 lg:pb-0 lg:pt-24">
        {children}
      </div>
    </div>
  )
}

export default ProtectedLayout
