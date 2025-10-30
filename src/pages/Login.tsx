import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AUTH_CONFIG } from '../utils/config';
import ThemeToggle from '../components/ThemeToggle';
import LoginForm from '../components/LoginForm';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated } = useAuth();

  const from = (location.state as any)?.from?.pathname || AUTH_CONFIG.ROUTES.DASHBOARD;

  React.useEffect(() => {
    if (authenticated) {
      navigate(from, { replace: true });
    }
  }, [authenticated, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-6 sm:p-4 transition-colors duration-200">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full">
        
        <div className="flex justify-center">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

export default Login;