import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LAST_ROUTE_KEY = 'mavic_last_route';

// Rotas que não devem ser persistidas (login, rotas de erro, etc.)
const EXCLUDED_ROUTES = [
  '/login',
  '/404',
  '/',
  ''
];

// Rotas protegidas que precisam de autenticação
const PROTECTED_ROUTES = [
  '/dashboard',
  '/espacos',
  '/usuarios',
  '/todos-agendamentos',
  '/novo-agendamento',
  '/meus-agendamentos',
  '/meus-espacos',
  '/aprovar-agendamentos',
  '/espacos-disponiveis',
  '/agendamentos-fixos',
  '/debug',
  '/teste-notificacao'
];

export const useRouteHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salvar rota atual sempre que mudar (exceto rotas excluídas)
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Só salvar rotas que são páginas reais (não login, não raiz)
    if (PROTECTED_ROUTES.includes(currentPath)) {
      localStorage.setItem(LAST_ROUTE_KEY, currentPath);
    }
  }, [location.pathname]);

  // Função para obter a última rota salva
  const getLastRoute = (): string | null => {
    return localStorage.getItem(LAST_ROUTE_KEY);
  };

  // Função para navegar para a última rota salva
  const navigateToLastRoute = (fallbackRoute: string = '/dashboard') => {
    const lastRoute = getLastRoute();
    
    // Se há uma rota salva e ela é uma rota protegida válida
    if (lastRoute && PROTECTED_ROUTES.includes(lastRoute)) {
      navigate(lastRoute);
    } else {
      navigate(fallbackRoute);
    }
  };

  // Função para limpar o histórico
  const clearRouteHistory = () => {
    localStorage.removeItem(LAST_ROUTE_KEY);
  };

  // Verificar se uma rota é protegida
  const isProtectedRoute = (path: string): boolean => {
    return PROTECTED_ROUTES.includes(path);
  };

  return {
    getLastRoute,
    navigateToLastRoute,
    clearRouteHistory,
    isProtectedRoute,
    currentPath: location.pathname
  };
}; 