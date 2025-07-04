import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { usuario, logout } = useAuth();

  const getUserTypeColor = () => {
    switch (usuario?.tipo) {
      case "admin":
        return "text-admin";
      case "gestor":
        return "text-gestor";
      case "usuario":
        return "text-usuario";
      default:
        return "text-gray-600";
    }
  };

  const getUserTypeBg = () => {
    switch (usuario?.tipo) {
      case "admin":
        return "bg-admin-light";
      case "gestor":
        return "bg-gestor-light";
      case "usuario":
        return "bg-usuario-light";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-background border-b shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-800">
                Sistema de Agendamento
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className={`px-3 py-1 rounded-full ${getUserTypeBg()}`}>
                <span className={`text-sm font-medium ${getUserTypeColor()}`}>
                  {usuario?.nome} -{" "}
                  {usuario?.tipo.charAt(0).toUpperCase() +
                    usuario?.tipo.slice(1)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-gray-800"
              >
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50 dark:bg-background transition-colors">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
