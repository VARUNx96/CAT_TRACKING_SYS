import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const result = await isAuthenticated();

      setAuthenticated(result);
      setChecking(false);
    };

    checkAuthentication();
  }, []);

  if (checking) {
    return null;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;