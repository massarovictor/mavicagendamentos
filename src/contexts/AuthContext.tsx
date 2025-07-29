import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (usuario: Usuario) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    usuario: null,
    isLoggedIn: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const usuario = JSON.parse(savedUser);
      if (typeof usuario.id === 'string' && usuario.id.includes('-')) {
        usuario.id = parseInt(usuario.id.replace(/-/g, '').substring(0, 8), 16);
      }
      setAuthState({ usuario, isLoggedIn: true });
    }
    setIsLoading(false);
  }, []);

  const login = (usuario: Usuario) => {
    if (typeof usuario.id === 'string' && usuario.id.includes('-')) {
      usuario.id = parseInt(usuario.id.replace(/-/g, '').substring(0, 8), 16);
    }
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    setAuthState({ usuario, isLoggedIn: true });
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('mavic_last_route'); // Limpar histórico de rotas no logout
    setAuthState({ usuario: null, isLoggedIn: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
