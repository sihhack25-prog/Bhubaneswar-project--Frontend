import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, user, allowedRoles }) => {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute