import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useRouteHistory } from "@/hooks/useRouteHistory";
import { TipoUsuario } from "@/types";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import GerenciarEspacos from "./pages/GerenciarEspacos";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import TodosAgendamentos from "./pages/TodosAgendamentos";
import NovoAgendamento from "./pages/NovoAgendamento";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import MeusEspacos from "./pages/MeusEspacos";
import AprovarAgendamentos from "./pages/AprovarAgendamentos";
import EspacosDisponiveis from "./pages/EspacosDisponiveis";
import AgendamentosFixos from "./pages/AgendamentosFixos";

// Páginas de debug/teste - importação condicional
const isDevelopment = import.meta.env.DEV;

// Componentes condicionais para debug
const DebugComponent = isDevelopment ? React.lazy(() => import("./pages/Debug")) : null;
const TesteNotificacaoComponent = isDevelopment ? React.lazy(() => import("./pages/TesteNotificacaoCompleto")) : null;

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedTypes }: { children: React.ReactNode, allowedTypes?: TipoUsuario[] }) => {
  const { isLoggedIn, isLoading, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (allowedTypes && usuario && !allowedTypes.includes(usuario.tipo)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Componente para redirecionamento após login
const LoginRedirect = () => {
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div>Carregando sistema...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <LoginRedirect /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/espacos"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <GerenciarEspacos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <GerenciarUsuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/todos-agendamentos"
        element={
          <ProtectedRoute allowedTypes={['admin']}>
            <TodosAgendamentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/novo-agendamento"
        element={
          <ProtectedRoute>
            <NovoAgendamento />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meus-agendamentos"
        element={
          <ProtectedRoute>
            <MeusAgendamentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meus-espacos"
        element={
          <ProtectedRoute allowedTypes={['gestor', 'admin']}>
            <MeusEspacos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprovar-agendamentos"
        element={
          <ProtectedRoute allowedTypes={['gestor', 'admin']}>
            <AprovarAgendamentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/espacos-disponiveis"
        element={
          <ProtectedRoute>
            <EspacosDisponiveis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agendamentos-fixos"
        element={
          <ProtectedRoute allowedTypes={['admin', 'gestor']}>
            <AgendamentosFixos />
          </ProtectedRoute>
        }
      />
      {/* Rotas de debug (apenas em desenvolvimento) */}
      {isDevelopment && DebugComponent && (
        <Route
          path="/debug"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <DebugComponent />
              </React.Suspense>
            </ProtectedRoute>
          }
        />
      )}
      {isDevelopment && TesteNotificacaoComponent && (
        <Route
          path="/teste-notificacao"
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<div>Carregando...</div>}>
                <TesteNotificacaoComponent />
              </React.Suspense>
            </ProtectedRoute>
          }
        />
      )}
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />
      <Route
        path="*"
        element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
