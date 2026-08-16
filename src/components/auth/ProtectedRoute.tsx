import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { LetterLoader } from '../ui/LetterLoader';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useUser();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <LetterLoader text="Loading" size="md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
