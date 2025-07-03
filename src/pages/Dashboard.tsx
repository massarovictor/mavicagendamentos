import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-state';
import AdminDashboard from './AdminDashboard';
import GestorDashboard from './GestorDashboard';
import UsuarioDashboard from './UsuarioDashboard';

const Dashboard = () => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <LoadingSpinner message="Carregando usuário..." />;
  }

  switch (usuario.tipo) {
    case 'admin':
      return <AdminDashboard />;
    case 'gestor':
      return <GestorDashboard />;
    case 'usuario':
      return <UsuarioDashboard />;
    default:
      return <div>Tipo de usuário não reconhecido</div>;
  }
};

export default Dashboard;
