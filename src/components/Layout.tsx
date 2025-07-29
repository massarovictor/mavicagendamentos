import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Footer from '@/components/ui/footer';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteHistory } from '@/hooks/useRouteHistory';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { usuario, logout } = useAuth();
  
  // Hook para registrar histórico de rotas automaticamente
  useRouteHistory();

  const getUserTypeColor = () => {
    switch (usuario?.tipo) {
      case 'admin': return 'text-admin';
      case 'gestor': return 'text-gestor';
      case 'usuario': return 'text-usuario';
      default: return 'text-gray-600';
    }
  };

  const getUserTypeBg = () => {
    switch (usuario?.tipo) {
      case 'admin': return 'bg-admin-light';
      case 'gestor': return 'bg-gestor-light';
      case 'usuario': return 'bg-usuario-light';
      default: return 'bg-gray-100';
    }
  };


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-background border-b border-border shadow-sm">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <SidebarTrigger />
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                <span className="hidden sm:inline">Sistema de Agendamento de Espaços</span>
                <span className="sm:hidden">Agendamento de Espaços</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className={`px-2 md:px-3 py-1 rounded-full bg-accent`}>
                <span className={`text-xs md:text-sm font-medium text-accent-foreground`}>
                  <span className="hidden md:inline">{usuario?.nome} - </span>
                  <span className="md:hidden">{usuario?.nome?.split(' ')[0]} - </span>
                  {usuario?.tipo.charAt(0).toUpperCase() + usuario?.tipo.slice(1)}
                </span>
              </div>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-foreground text-xs md:text-sm"
              >
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 bg-background text-foreground">
            {children}
          </main>
          {/* Footer com direitos autorais */}
          <Footer className="bg-background border-t border-border" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
