import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useNotifications } from '@/hooks/useNotifications';

const Debug = () => {
  const { usuarios, espacos, loading, actions } = useSupabaseData();
  const notifications = useNotifications();

  const testAddUsuario = () => {
    console.log('🧪 Testando adicionar usuário...');
    const newId = Math.max(...usuarios.map(u => u.id), 0) + 1;
    const testUser = {
      id: newId,
      nome: 'Usuário Teste ' + newId,
      email: `teste${newId}@email.com`,
      tipo: 'usuario' as const,
      senha: 'teste123',
      ativo: true
    };
    
    console.log('👤 Usuário a ser criado:', testUser);
    actions.addUsuario(testUser);
    notifications.usuario.created();
  };

  const testAddEspaco = () => {
    console.log('🧪 Testando adicionar espaço...');
    const newId = Math.max(...espacos.map(e => e.id), 0) + 1;
    const testSpace = {
      id: newId,
      nome: 'Espaço Teste ' + newId,
      capacidade: 10,
      descricao: 'Espaço criado para teste',
      equipamentos: ['Teste'],
      ativo: true
    };
    
    console.log('🏢 Espaço a ser criado:', testSpace);
    actions.addEspaco(testSpace);
    notifications.espaco.created();
  };

  const clearStorage = () => {
    console.log('🧹 Limpando localStorage...');
    localStorage.clear();
    window.location.reload();
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Debug Page</h1>
        <p className="text-gray-600 mt-2">Teste direto das actions do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👤 Usuários ({usuarios.length})
            </CardTitle>
            <CardDescription>
              Teste de criação de usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAddUsuario} className="w-full">
              Adicionar Usuário Teste
            </Button>
            <div className="text-sm space-y-1">
              {usuarios.slice(-3).map(u => (
                <div key={u.id} className="p-2 bg-gray-50 rounded">
                  <strong>{u.nome}</strong> - {u.email} - {u.tipo}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏢 Espaços ({espacos.length})
            </CardTitle>
            <CardDescription>
              Teste de criação de espaços
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAddEspaco} className="w-full">
              Adicionar Espaço Teste
            </Button>
            <div className="text-sm space-y-1">
              {espacos.slice(-3).map(e => (
                <div key={e.id} className="p-2 bg-gray-50 rounded">
                  <strong>{e.nome}</strong> - Cap: {e.capacidade}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🧹 Limpeza</CardTitle>
          <CardDescription>
            Ferramentas de limpeza do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={clearStorage} variant="destructive" className="w-full">
            Limpar localStorage e Recarregar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Estado Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ 
              usuariosCount: usuarios.length, 
              espacosCount: espacos.length,
              loading 
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default Debug; 