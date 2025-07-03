import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppState } from '@/hooks/useAppState';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Shield, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Settings,
  Activity
} from 'lucide-react';
import { DataIntegrityValidations, SecurityValidations } from '@/utils/validations';

interface SystemHealth {
  dataIntegrity: {
    isValid: boolean;
    errors: string[];
    lastCheck: string;
  };
  security: {
    isValid: boolean;
    errors: string[];
    lastCheck: string;
  };
  performance: {
    dataSize: number;
    backupCount: number;
    lastBackup: string | null;
  };
}

export const SystemStatus: React.FC = () => {
  const { usuarios, espacos, agendamentos, agendamentosFixos, dataCorrupted, lastBackup, actions } = useAppState();
  const notifications = useNotifications();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    
    try {
      // Verificação de integridade de dados
      const integrityResult = DataIntegrityValidations.validateRelationalIntegrity({
        usuarios,
        espacos,
        agendamentos,
        agendamentosFixos
      });

      // Verificação de segurança
      const allData = { usuarios, espacos, agendamentos, agendamentosFixos };
      const securityResult = SecurityValidations.validateUserInput(allData);

      // Cálculo de performance
      const dataSize = JSON.stringify(allData).length;
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));

      const health: SystemHealth = {
        dataIntegrity: {
          isValid: integrityResult.length === 0,
          errors: integrityResult,
          lastCheck: new Date().toISOString()
        },
        security: {
          isValid: securityResult.isValid,
          errors: securityResult.errors,
          lastCheck: new Date().toISOString()
        },
        performance: {
          dataSize,
          backupCount: backupKeys.length,
          lastBackup
        }
      };

      setSystemHealth(health);
      
      if (health.dataIntegrity.isValid && health.security.isValid) {
        notifications.success('Verificação concluída', 'Sistema está funcionando corretamente');
      } else {
        notifications.error('Problemas detectados', 'Verifique os detalhes abaixo');
      }
    } catch (error) {
      notifications.error('Erro na verificação', 'Falha ao verificar integridade do sistema');
    } finally {
      setIsChecking(false);
    }
  };

  const createBackup = () => {
    const backupKey = actions.createManualBackup();
    if (backupKey) {
      notifications.success('Backup criado', `Backup ${backupKey} criado com sucesso`);
      runHealthCheck(); // Atualizar contadores
    } else {
      notifications.error('Falha no backup', 'Não foi possível criar o backup');
    }
  };

  const exportData = () => {
    try {
      const data = {
        usuarios,
        espacos,
        agendamentos,
        agendamentosFixos,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `easy-arrange-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.success('Dados exportados', 'Arquivo de exportação baixado com sucesso');
    } catch (error) {
      notifications.error('Erro na exportação', 'Falha ao exportar dados');
    }
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ ATENÇÃO: Esta ação irá APAGAR TODOS os dados do sistema!\n\nEsta ação é IRREVERSÍVEL. Tem certeza que deseja continuar?')) {
      if (window.confirm('Última confirmação: TODOS os dados serão perdidos. Prosseguir?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, [usuarios, espacos, agendamentos, agendamentosFixos]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Monitoramento de integridade, segurança e performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {dataCorrupted ? (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                )}
              </div>
              <div className="text-sm font-medium">Integridade</div>
              <Badge variant={dataCorrupted ? "destructive" : "secondary"}>
                {dataCorrupted ? "Corrompido" : "OK"}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-sm font-medium">Segurança</div>
              <Badge variant={systemHealth?.security.isValid ? "secondary" : "destructive"}>
                {systemHealth?.security.isValid ? "Seguro" : "Atenção"}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-sm font-medium">Dados</div>
              <Badge variant="secondary">
                {systemHealth ? formatFileSize(systemHealth.performance.dataSize) : "..."}
              </Badge>
            </div>
          </div>

          {/* Alertas de Problemas */}
          {systemHealth && !systemHealth.dataIntegrity.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Problemas de integridade detectados:</div>
                <ul className="mt-2 space-y-1">
                  {systemHealth.dataIntegrity.errors.map((error, index) => (
                    <li key={index} className="text-sm">• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {systemHealth && !systemHealth.security.isValid && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Problemas de segurança detectados:</div>
                <ul className="mt-2 space-y-1">
                  {systemHealth.security.errors.map((error, index) => (
                    <li key={index} className="text-sm">• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{usuarios.length}</div>
              <div className="text-sm text-muted-foreground">Usuários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{espacos.length}</div>
              <div className="text-sm text-muted-foreground">Espaços</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{agendamentos.length}</div>
              <div className="text-sm text-muted-foreground">Agendamentos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{agendamentosFixos.length}</div>
              <div className="text-sm text-muted-foreground">Fixos</div>
            </div>
          </div>

          {/* Informações de Backup */}
          {systemHealth && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Informações de Backup</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Backups disponíveis:</span>
                  <span className="ml-2 font-medium">{systemHealth.performance.backupCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Último backup:</span>
                  <span className="ml-2 font-medium">
                    {systemHealth.performance.lastBackup 
                      ? new Date(systemHealth.performance.lastBackup).toLocaleString('pt-BR')
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ações de Manutenção */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthCheck}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={createBackup}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Backup
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllData}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>

          {/* Última verificação */}
          {systemHealth && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Última verificação: {new Date(systemHealth.dataIntegrity.lastCheck).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 