import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { isSuperAdmin } from '../config/roleAccess'
import AccessDenied from '../pages/AccessDenied'

interface SuperAdminRouteProps {
  children: React.ReactNode
}

const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth)
  if (!isSuperAdmin(user?.role)) {
    return <AccessDenied />
  }
  return <>{children}</>
}

export default SuperAdminRoute
