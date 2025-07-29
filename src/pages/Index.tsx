
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-state';

const Index = () => {
  const { isLoggedIn, isLoading } = useAuth();

  // Aguardar carregamento da sessão
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner message="Carregando sistema..." size="lg" />
      </div>
    );
  }

  // Redirecionamento após carregamento
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default Index;
