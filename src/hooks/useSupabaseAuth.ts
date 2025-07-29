import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Usuario } from '@/types';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  usuario: Usuario | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    usuario: null,
    isLoggedIn: false,
    loading: true,
    error: null,
  });

  // Converter usuário Supabase para Usuario da aplicação
  const convertSupabaseUserToUsuario = useCallback(async (user: User): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        id: parseInt(data.id.replace(/-/g, '').substring(0, 8), 16),
        nome: data.nome,
        email: data.email,
        tipo: data.tipo,
        ativo: data.ativo,
        espacos: data.espacos || undefined,
        telefone: data.telefone || undefined,
      };
    } catch (error) {
      return null;
    }
  }, []);

  // Verificar sessão atual
  const checkSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        const usuario = await convertSupabaseUserToUsuario(session.user);
        setAuthState({
          user: session.user,
          usuario,
          isLoggedIn: !!usuario?.ativo, // Só considera logado se o usuário estiver ativo
          loading: false,
          error: usuario?.ativo ? null : 'Usuário desativado',
        });
      } else {
        setAuthState({
          user: null,
          usuario: null,
          isLoggedIn: false,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar sessão',
      }));
    }
  }, [convertSupabaseUserToUsuario]);

  // Login com email e senha (para compatibilidade com sistema atual)
  const loginWithEmailPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const usuario = await convertSupabaseUserToUsuario(data.user);
        if (usuario && usuario.ativo) {
          setAuthState({
            user: data.user,
            usuario,
            isLoggedIn: true,
            loading: false,
            error: null,
          });
          return true;
        } else {
          await supabase.auth.signOut();
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: 'Usuário não encontrado ou desativado',
          }));
          return false;
        }
      }
      return false;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof AuthError ? error.message : 'Erro no login',
      }));
      return false;
    }
  }, [convertSupabaseUserToUsuario]);

  // Login simplificado (para compatibilidade com o sistema atual)
  const loginSimple = useCallback(async (nome: string, tipo: 'admin' | 'gestor' | 'usuario'): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Buscar usuário pelo nome e tipo
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('nome', `%${nome}%`)
        .eq('tipo', tipo)
        .eq('ativo', true);

      if (error) throw error;

      if (usuarios && usuarios.length > 0) {
        const usuarioData = usuarios[0];
        
        // Para compatibilidade, vamos criar uma sessão "fake" sem autenticação real
        // Em produção, você deve implementar autenticação real
        const usuario: Usuario = {
          id: parseInt(usuarioData.id.replace(/-/g, '').substring(0, 8), 16),
          nome: usuarioData.nome,
          email: usuarioData.email,
          tipo: usuarioData.tipo,
          ativo: usuarioData.ativo,
          espacos: usuarioData.espacos || undefined,
          telefone: usuarioData.telefone || undefined,
        };

        setAuthState({
          user: null, // Sem user do Supabase Auth em modo simplificado
          usuario,
          isLoggedIn: true,
          loading: false,
          error: null,
        });

        // Salvar no localStorage para persistência
        localStorage.setItem('simple_auth_user', JSON.stringify(usuario));
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Usuário não encontrado',
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro no login',
      }));
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      // Logout do Supabase Auth (se estiver usando)
      await supabase.auth.signOut();
      
      // Limpar auth simples
      localStorage.removeItem('simple_auth_user');
      
      setAuthState({
        user: null,
        usuario: null,
        isLoggedIn: false,
        loading: false,
        error: null,
      });
    } catch (error) {
      }
  }, []);

  // Registrar novo usuário
  const register = useCallback(async (usuario: Omit<Usuario, 'id'>, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Criar usuário no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: usuario.email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Criar registro na tabela usuarios
        const { error: dbError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo,
            ativo: usuario.ativo,
            espacos: usuario.espacos || null,
            telefone: usuario.telefone || null,
          });

        if (dbError) throw dbError;

        return true;
      }
      return false;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro no registro',
      }));
      return false;
    }
  }, []);

  // Verificar localStorage para auth simples na inicialização
  useEffect(() => {
    const checkSimpleAuth = () => {
      const savedUser = localStorage.getItem('simple_auth_user');
      if (savedUser) {
        try {
          const usuario = JSON.parse(savedUser);
          setAuthState({
            user: null,
            usuario,
            isLoggedIn: true,
            loading: false,
            error: null,
          });
          return true;
        } catch (error) {
          localStorage.removeItem('simple_auth_user');
        }
      }
      return false;
    };

    // Verificar auth simples primeiro
    if (!checkSimpleAuth()) {
      // Se não tem auth simples, verificar Supabase Auth
      checkSession();
    }
  }, [checkSession]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const usuario = await convertSupabaseUserToUsuario(session.user);
          setAuthState({
            user: session.user,
            usuario,
            isLoggedIn: !!usuario?.ativo,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          // Manter auth simples se existir
          const savedUser = localStorage.getItem('simple_auth_user');
          if (!savedUser) {
            setAuthState({
              user: null,
              usuario: null,
              isLoggedIn: false,
              loading: false,
              error: null,
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [convertSupabaseUserToUsuario]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    loginWithEmailPassword,
    loginSimple,
    logout,
    register,
    checkSession,
    clearError,
  };
}; 