import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Usuario } from '@/types';

interface AuthContextType {
  user: User | null;
  usuario: Usuario | null;
  session: Session | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  login: (usuario: Usuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// HELPER: Promessa com Timeout (Sintaxe compatível com .tsx)
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutValue: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), ms))
  ]);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const forceLogout = useCallback(() => {
    console.warn('[Auth] Forcing local logout state');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('mavic_last_route');

    setUser(null);
    setUsuario(null);
    setSession(null);
    setIsLoading(false);

    // Tenta avisar o servidor, mas não espera nem trava se falhar
    supabase.auth.signOut().catch(() => { });
  }, []);

  const fetchUsuario = useCallback(async (userId: string, userEmail?: string): Promise<Usuario | null> => {
    const queryPromise = (async () => {
      try {
        // 1. Tentar buscar por ID
        let { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).maybeSingle();

        // 2. Fallback por Email (Útil se o usuário foi pré-criado e o merge ainda não encerrou)
        if (!data && userEmail) {
          const result = await supabase.from('usuarios').select('*').eq('email', userEmail).maybeSingle();
          if (result.data) {
            console.info('[Auth] User found by email but with different ID. Merge should happen automatically.');
            data = result.data;
            error = result.error;
          }
        }

        // 3. Auto-Criação Otimista
        if (!data && !error) {
          console.info('[Auth] User not found in public.usuarios, attempting auto-create');
          const { data: newData, error: insertError } = await supabase
            .from('usuarios')
            .insert({
              id: userId,
              email: userEmail ?? `${userId}@local`,
              nome: userEmail ? userEmail.split('@')[0] : 'Usuário',
              tipo: 'usuario',
              ativo: true,
            })
            .select('*')
            .maybeSingle();
          data = newData;
          error = insertError;
        }

        if (error) {
          console.error('[Auth] Database fetch error:', error.message);
          return null;
        }

        if (!data) return null;

        const mapped: Usuario = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          tipo: data.tipo,
          ativo: data.ativo,
          espacos: data.espacos || undefined,
          telefone: data.telefone || undefined,
          papel: data.papel || undefined,
        };

        localStorage.setItem(`mavic_user_cache_${userId}`, JSON.stringify(mapped));
        return mapped;
      } catch (err) {
        console.error('[Auth] fetchUsuario unexpected error:', err);
        return null;
      }
    })();

    // Timeout Agressivo de 2.5s
    return withTimeout(queryPromise, 2500, null);
  }, []);

  const syncAuthMetadata = useCallback(async (authUser: User, usuarioData: Usuario | null) => {
    if (!usuarioData) return;
    try {
      const { tipo, nome, papel } = authUser.user_metadata || {};
      if (tipo !== usuarioData.tipo || nome !== usuarioData.nome) {
        console.info('[Auth] Syncing JWT metadata...');
        await supabase.auth.updateUser({
          data: {
            tipo: usuarioData.tipo,
            nome: usuarioData.nome,
            papel: usuarioData.papel || papel || 'professor',
          },
        });
      }
    } catch (e) {
      console.warn('[Auth] Metadata sync failed:', e);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    // Failsafe absoluto de 4 segundos
    const globalTimeout = setTimeout(() => {
      if (!isCancelled && isLoading) {
        console.error('[Auth] Global initialization timeout - forced unlock');
        setIsLoading(false);
      }
    }, 4000);

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (isCancelled) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);

          const cacheKey = `mavic_user_cache_${initialSession.user.id}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              setUsuario(JSON.parse(cached));
              setIsLoading(false);
            } catch (e) {
              localStorage.removeItem(cacheKey);
            }
          }

          const fresh = await fetchUsuario(initialSession.user.id, initialSession.user.email);
          if (!isCancelled && fresh) {
            setUsuario(fresh);
            void syncAuthMetadata(initialSession.user, fresh);
          }
        }
      } catch (err) {
        console.error('[Auth] Init failure:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
        clearTimeout(globalTimeout);
      }
    };

    void initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isCancelled) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const cacheKey = `mavic_user_cache_${newSession.user.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try { setUsuario(JSON.parse(cached)); } catch (e) { }
        }

        const freshData = await fetchUsuario(newSession.user.id, newSession.user.email);
        if (!isCancelled && freshData) {
          setUsuario(freshData);
          void syncAuthMetadata(newSession.user, freshData);
        }
      } else {
        setUsuario(null);
      }
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
      clearTimeout(globalTimeout);
    };
  }, [fetchUsuario, syncAuthMetadata]); // REMOVED isLoading dependency

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: true }
    });
    return { error };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token,
      type: 'email'
    });
    return { error };
  }, []);

  const login = useCallback((usuarioData: Usuario) => {
    setUsuario(usuarioData);
    localStorage.setItem(`mavic_user_cache_${usuarioData.id}`, JSON.stringify(usuarioData));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => { });
    forceLogout();
  }, [forceLogout]);

  const isLoggedIn = useMemo(() => !!session && !!usuario?.ativo, [session, usuario]);

  return (
    <AuthContext.Provider
      value={{
        user,
        usuario,
        session,
        isLoggedIn,
        isLoading,
        sendOtp,
        verifyOtp,
        signOut,
        login,
        logout: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
