
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import GestorDashboard from './GestorDashboard';
import UsuarioDashboard from './UsuarioDashboard';

const Dashboard = () => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <div>Carregando...</div>;
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
