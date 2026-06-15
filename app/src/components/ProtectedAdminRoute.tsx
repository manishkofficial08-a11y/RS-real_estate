import { Navigate, Outlet } from 'react-router-dom';
import { isFounderLoggedIn } from '@/lib/adminApi';

export default function ProtectedAdminRoute() {
  if (!isFounderLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}