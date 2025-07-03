import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { Usuario } from '@/types';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const notifications = useNotifications();

  const convertUsuario = (row: any): Usuario => ({
    id: parseInt(row.id.replace(/-/g, '').substring(0, 8), 16),
    nome: row.nome,
    email: row.email,
    tipo: row.tipo,
    ativo: row.ativo,
    espacos: row.espacos || undefined,
    telefone: row.telefone || undefined,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      notifications.error("Erro", "Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      // Buscar usuário pelo email no Supabase
      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (error || !usuarioData) {
        notifications.error("Erro de Login", "Usuário não encontrado ou inativo");
        setLoading(false);
        return;
      }

      // Converter dados do Supabase para o formato da aplicação
      const usuario = convertUsuario(usuarioData);

      // Fazer login
      login(usuario);
      notifications.success("Login realizado", `Bem-vindo, ${usuario.nome}!`);

    } catch (error) {
      console.error('Erro no login:', error);
      notifications.error("Erro", "Falha ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner message="Verificando credenciais..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">Login</CardTitle>
          <CardDescription className="text-gray-600">
            Acesse sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <FormField
              name="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              validation={{
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              }}
              placeholder="Digite seu email"
              required
            />
            <FormField
              name="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={setSenha}
              validation={{
                required: true,
                minLength: 1
              }}
              placeholder="Digite sua senha"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
