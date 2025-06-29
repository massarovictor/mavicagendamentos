
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'gestor' | 'usuario'>('usuario');
  const { login } = useAuth();
  const { usuarios } = useLocalStorage();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario || !senha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    // Buscar usuário pelo nome e tipo
    const usuarioEncontrado = usuarios.find(u => 
      u.nome.toLowerCase().includes(usuario.toLowerCase()) && u.tipo === tipoUsuario
    );

    if (usuarioEncontrado) {
      login(usuarioEncontrado);
      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${usuarioEncontrado.nome}!`
      });
    } else {
      toast({
        title: "Erro",
        description: "Usuário não encontrado ou tipo incorreto",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">Sistema de Agendamento</CardTitle>
          <CardDescription className="text-gray-600">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome de usuário</label>
              <Input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu nome"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de usuário</label>
              <Select value={tipoUsuario} onValueChange={(value: any) => setTipoUsuario(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Usuários de teste:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Admin:</strong> Administrador</div>
              <div><strong>Gestor:</strong> Gestor Principal</div>
              <div><strong>Usuário:</strong> João Silva ou Maria Santos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
