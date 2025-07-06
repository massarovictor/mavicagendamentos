import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { LoadingSpinner } from '@/components/ui/loading-state';
import BrandLogo from '@/components/ui/brand-logo';
import Footer from '@/components/ui/footer';
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
        .single();

      if (error || !usuarioData) {
        notifications.error("Erro de Login", "Usuário não encontrado");
        setLoading(false);
        return;
      }

      // O login é permitido se o usuário for encontrado, sem verificar a senha.
      const usuario: Usuario = usuarioData;

      login(usuario);
      notifications.success("Login realizado", `Bem-vindo, ${usuario.nome}!`);

    } catch (error: any) {
      console.error('Erro no login:', error);
      notifications.error("Erro de Login", error.message || "Falha no servidor");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Verificando credenciais..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo do Sistema */}
        <div className="mb-8 animate-fade-in">
          <BrandLogo size="xl" className="text-center" showSubtitle />
        </div>
        <Card className="w-full max-w-md shadow-xl animate-fade-in bg-card text-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-muted-foreground">
              Entre com suas credenciais
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
      {/* Footer com direitos autorais */}
      <Footer variant="minimal" className="mb-4" />
    </div>
  );
};

export default Login;
