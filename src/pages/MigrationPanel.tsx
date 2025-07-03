import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Trash2,
  Info
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { migrateLocalStorageToSupabase, revertMigration, clearSupabaseData } from '@/utils/migrateToSupabase';

const MigrationPanel = () => {
  const notifications = useNotifications();
  const [migrationState, setMigrationState] = useState<{
    isRunning: boolean;
    progress: number;
    status: 'idle' | 'running' | 'success' | 'error';
    message: string;
    errors: string[];
    result: any;
  }>({
    isRunning: false,
    progress: 0,
    status: 'idle',
    message: '',
    errors: [],
    result: null,
  });

  const [supabaseConfig, setSupabaseConfig] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  });

  const checkLocalStorageData = () => {
    const data = {
      usuarios: localStorage.getItem('usuarios'),
      espacos: localStorage.getItem('espacos'),
      agendamentos: localStorage.getItem('agendamentos'),
      agendamentosFixos: localStorage.getItem('agendamentosFixos'),
    };

    const counts = {
      usuarios: data.usuarios ? JSON.parse(data.usuarios).length : 0,
      espacos: data.espacos ? JSON.parse(data.espacos).length : 0,
      agendamentos: data.agendamentos ? JSON.parse(data.agendamentos).length : 0,
      agendamentosFixos: data.agendamentosFixos ? JSON.parse(data.agendamentosFixos).length : 0,
    };

    return counts;
  };

  const handleMigration = async () => {
    setMigrationState(prev => ({
      ...prev,
      isRunning: true,
      progress: 0,
      status: 'running',
      message: 'Iniciando migração...',
      errors: [],
    }));

    try {
      // Simular progresso
      const progressSteps = [
        { progress: 10, message: 'Verificando dados locais...' },
        { progress: 20, message: 'Conectando ao Supabase...' },
        { progress: 40, message: 'Migrando usuários...' },
        { progress: 60, message: 'Migrando espaços...' },
        { progress: 80, message: 'Migrando agendamentos...' },
        { progress: 90, message: 'Finalizando...' },
      ];

      for (const step of progressSteps) {
        setMigrationState(prev => ({
          ...prev,
          progress: step.progress,
          message: step.message,
        }));
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await migrateLocalStorageToSupabase();

      setMigrationState(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        status: result.success ? 'success' : 'error',
        message: result.message,
        errors: result.errors,
        result,
      }));

      if (result.success) {
        notifications.success('Migração concluída!', result.message);
      } else {
        notifications.error('Erro na migração', result.message);
      }

    } catch (error) {
      setMigrationState(prev => ({
        ...prev,
        isRunning: false,
        status: 'error',
        message: 'Falha na migração',
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      }));
      notifications.error('Erro na migração', 'Falha ao executar migração');
    }
  };

  const handleRevert = async () => {
    try {
      const result = await revertMigration();
      if (result.success) {
        notifications.success('Reversão concluída!', result.message);
        setMigrationState(prev => ({ ...prev, status: 'idle', message: '', errors: [] }));
      } else {
        notifications.error('Erro na reversão', result.message);
      }
    } catch (error) {
      notifications.error('Erro na reversão', 'Falha ao reverter migração');
    }
  };

  const handleClearSupabase = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta ação irá APAGAR TODOS os dados do Supabase!\n\nEsta ação é IRREVERSÍVEL. Tem certeza?')) {
      return;
    }

    try {
      const result = await clearSupabaseData();
      if (result.success) {
        notifications.success('Dados limpos!', result.message);
      } else {
        notifications.error('Erro ao limpar', result.message);
      }
    } catch (error) {
      notifications.error('Erro ao limpar', 'Falha ao limpar dados do Supabase');
    }
  };

  const localData = checkLocalStorageData();
  const hasLocalData = Object.values(localData).some(count => count > 0);
  const configComplete = supabaseConfig.url && supabaseConfig.key;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Painel de Migração para Supabase</h1>
        <p className="text-gray-600">Migre seus dados do localStorage para o Supabase com segurança</p>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="migration">Migração</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status da Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuração Supabase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>URL do Projeto</span>
                    <Badge variant={supabaseConfig.url ? 'success' : 'destructive'}>
                      {supabaseConfig.url ? 'Configurado' : 'Não configurado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Chave Anônima</span>
                    <Badge variant={supabaseConfig.key ? 'success' : 'destructive'}>
                      {supabaseConfig.key ? 'Configurado' : 'Não configurado'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status dos Dados Locais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Dados Locais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Usuários</span>
                    <Badge variant={localData.usuarios > 0 ? 'success' : 'secondary'}>
                      {localData.usuarios} registros
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Espaços</span>
                    <Badge variant={localData.espacos > 0 ? 'success' : 'secondary'}>
                      {localData.espacos} registros
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agendamentos</span>
                    <Badge variant={localData.agendamentos > 0 ? 'success' : 'secondary'}>
                      {localData.agendamentos} registros
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agend. Fixos</span>
                    <Badge variant={localData.agendamentosFixos > 0 ? 'success' : 'secondary'}>
                      {localData.agendamentosFixos} registros
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert de Status */}
          {!configComplete && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configure as variáveis de ambiente do Supabase antes de prosseguir com a migração.
              </AlertDescription>
            </Alert>
          )}

          {!hasLocalData && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Nenhum dado encontrado no localStorage. A migração não é necessária.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Supabase</CardTitle>
              <CardDescription>
                Configure as credenciais do seu projeto Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL do Projeto</label>
                <input
                  type="text"
                  placeholder="https://seu-projeto.supabase.co"
                  value={supabaseConfig.url}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chave Anônima</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.key}
                  onChange={(e) => setSupabaseConfig(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Essas informações devem estar no arquivo .env como VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Executar Migração</CardTitle>
              <CardDescription>
                Migre seus dados do localStorage para o Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationState.isRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{migrationState.message}</span>
                    <span className="text-sm text-gray-500">{migrationState.progress}%</span>
                  </div>
                  <Progress value={migrationState.progress} className="w-full" />
                </div>
              )}

              {migrationState.status === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {migrationState.message}
                    {migrationState.result && (
                      <div className="mt-2 text-sm">
                        Migrados: {migrationState.result.migrated.usuarios} usuários, {migrationState.result.migrated.espacos} espaços, {migrationState.result.migrated.agendamentos} agendamentos, {migrationState.result.migrated.agendamentosFixos} agendamentos fixos
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {migrationState.status === 'error' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {migrationState.message}
                    {migrationState.errors.length > 0 && (
                      <div className="mt-2">
                        <details className="text-sm">
                          <summary>Detalhes dos erros ({migrationState.errors.length})</summary>
                          <ul className="mt-1 space-y-1">
                            {migrationState.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleMigration}
                  disabled={migrationState.isRunning || !configComplete || !hasLocalData}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {migrationState.isRunning ? 'Migrando...' : 'Iniciar Migração'}
                </Button>

                {migrationState.status === 'success' && (
                  <Button 
                    variant="outline" 
                    onClick={handleRevert}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reverter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Ferramentas Perigosas</CardTitle>
                <CardDescription>
                  Use com extrema cautela - essas ações são irreversíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive" 
                  onClick={handleClearSupabase}
                  className="flex items-center gap-2 w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Dados do Supabase
                </Button>
                <p className="text-xs text-gray-500">
                  Remove todos os dados das tabelas do Supabase. Use apenas se quiser recriar o banco.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
                <CardDescription>
                  Baixe um backup dos seus dados locais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const data = {
                      usuarios: JSON.parse(localStorage.getItem('usuarios') || '[]'),
                      espacos: JSON.parse(localStorage.getItem('espacos') || '[]'),
                      agendamentos: JSON.parse(localStorage.getItem('agendamentos') || '[]'),
                      agendamentosFixos: JSON.parse(localStorage.getItem('agendamentosFixos') || '[]'),
                      exportedAt: new Date().toISOString(),
                    };
                    
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `easy-arrange-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    notifications.success('Backup exportado!', 'Arquivo baixado com sucesso');
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  <Download className="h-4 w-4" />
                  Exportar Backup
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MigrationPanel; 