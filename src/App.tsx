import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
import Debug from "./pages/Debug";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />}
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
          <ProtectedRoute>
            <GerenciarEspacos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <GerenciarUsuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/todos-agendamentos"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <MeusEspacos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprovar-agendamentos"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <AgendamentosFixos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debug"
        element={
          <ProtectedRoute>
            <Debug />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
      />
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
};

// Aplica o tema salvo/localStorage na inicialização
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("theme");
  if (
    saved === "dark" ||
    (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

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
