import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem('token'));
  const hasUser = Boolean(localStorage.getItem('user'));

  if (!hasToken && !hasUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
