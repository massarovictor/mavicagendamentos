import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { NotificationService } from '@/lib/notificationService';
import { emailService } from '@/lib/emailService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function TesteNotificacaoCompleto() {
  const { usuarios, espacos, loading } = useSupabaseData();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedEspaco, setSelectedEspaco] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [emailConfig, setEmailConfig] = useState<any>(null);

  useEffect(() => {
    if (!loading && usuarios.length > 0 && espacos.length > 0) {
      analisarSistema();
      verificarConfigEmail();
    }
  }, [loading, usuarios, espacos]);

  const verificarConfigEmail = async () => {
    const config = emailService.getConfig();
    setEmailConfig(config);
  };

  const analisarSistema = () => {
    console.log('🔍 Analisando sistema de notificações...');
    
    const resultados = espacos.map(espaco => {
      // Usar a função corrigida do NotificationService
      const gestores = NotificationService.findGestoresDoEspaco(espaco.id, usuarios);
      
      return {
        espaco,
        gestores,
        temGestor: gestores.length > 0,
        status: gestores.length > 0 ? 'ok' : 'erro'
      };
    });

    setTestResults(resultados);
    
    console.log('📊 Resultado da análise:', {
      totalEspacos: espacos.length,
      espacosComGestores: resultados.filter(r => r.temGestor).length,
      espacosSemGestores: resultados.filter(r => !r.temGestor).length
    });
  };

  const testarNotificacaoEspaco = async (espacoId: number) => {
    setTesting(true);
    
    const espaco = espacos.find(e => e.id === espacoId);
    const usuarioTeste = usuarios.find(u => u.tipo === 'usuario');
    
    if (!espaco || !usuarioTeste) {
      alert('❌ Dados não encontrados para teste');
      setTesting(false);
      return;
    }

    const agendamentoTeste = {
      id: 999,
      espacoId: espacoId,
      usuarioId: usuarioTeste.id,
      data: new Date().toISOString().split('T')[0],
      aulaInicio: 7,
      aulaFim: 8,
      status: 'pendente' as const,
      observacoes: 'Teste de notificação do sistema'
    };

    console.log('🧪 Iniciando teste de notificação:', {
      espaco: espaco.nome,
      usuario: usuarioTeste.nome,
      agendamento: agendamentoTeste
    });

    try {
      const resultado = await NotificationService.notificarTodosGestores(
        agendamentoTeste, 
        usuarioTeste, 
        espaco, 
        usuarios
      );
      
      const mensagem = resultado 
        ? `✅ Teste bem-sucedido para ${espaco.nome}!` 
        : `❌ Falha no teste para ${espaco.nome}`;
      
      alert(mensagem + '\n\nVerifique o console e os logs do email para detalhes.');
      
    } catch (error) {
      console.error('❌ Erro durante teste:', error);
      alert(`❌ Erro durante teste: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const testarConexaoEmail = async () => {
    setTesting(true);
    
    try {
      console.log('🔍 Testando conexão do sistema de email...');
      
      // Forçar email real se configurado
      if (emailConfig?.configured) {
        emailService.forceRealEmails();
      }
      
      const sucesso = await emailService.sendSimpleEmail(
        'teste@sistema.com',
        'Teste de Conexão do Sistema',
        'Este é um teste do sistema de notificações por email. Se você recebeu esta mensagem, o sistema está funcionando corretamente.',
        'nova_solicitacao'
      );
      
      if (sucesso) {
        alert('✅ Sistema de email funcionando!\n\nVerifique os logs do console para detalhes.');
      } else {
        alert('❌ Falha no sistema de email.\n\nVerifique as configurações e logs.');
      }
      
    } catch (error) {
      console.error('❌ Erro no teste de email:', error);
      alert(`❌ Erro no teste de email: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const executarScriptCorrecao = () => {
    alert(`📋 Execute este script no Supabase Dashboard > SQL Editor:

1. Vá para https://supabase.com/dashboard
2. Acesse seu projeto
3. Clique em "SQL Editor" 
4. Cole e execute o conteúdo do arquivo: corrigir_gestores_espacos.sql

Isso corrigirá as atribuições entre gestores e espaços no banco de dados.`);
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const espacosComProblema = testResults.filter(r => !r.temGestor);
  const espacosOk = testResults.filter(r => r.temGestor);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔧 Teste Completo: Sistema de Notificações</h1>
      
      {/* Status do Sistema */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📊 Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{espacos.length}</p>
              <p className="text-sm text-gray-600">Total Espaços</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{espacosOk.length}</p>
              <p className="text-sm text-gray-600">Com Gestores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{espacosComProblema.length}</p>
              <p className="text-sm text-gray-600">Sem Gestores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{usuarios.filter(u => u.tipo === 'gestor').length}</p>
              <p className="text-sm text-gray-600">Total Gestores</p>
            </div>
          </div>

          {/* Status do Email */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Status do Sistema de Email:</h4>
            <div className="flex items-center gap-2 mb-2">
              {emailConfig?.configured ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Gmail configurado ({emailConfig.from})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Modo simulação (configure .env)</span>
                </>
              )}
            </div>
            <Button onClick={testarConexaoEmail} size="sm" disabled={testing}>
              {testing ? <Clock className="w-4 h-4 mr-2" /> : null}
              🧪 Testar Conexão Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Problemas Encontrados */}
      {espacosComProblema.length > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> {espacosComProblema.length} espaço(s) não têm gestores responsáveis.
            Isso impede o envio de notificações. 
            <Button 
              onClick={executarScriptCorrecao} 
              variant="outline" 
              size="sm"
              className="ml-2"
            >
              📋 Corrigir via SQL
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Espaços */}
      <div className="grid gap-4">
        {testResults.map((result) => (
          <Card key={result.espaco.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{result.espaco.nome}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={result.temGestor ? "default" : "destructive"}>
                    {result.gestores.length} gestor(es)
                  </Badge>
                  <Button 
                    onClick={() => testarNotificacaoEspaco(result.espaco.id)}
                    disabled={!result.temGestor || testing}
                    size="sm"
                  >
                    {testing ? <Clock className="w-4 h-4 mr-2" /> : null}
                    🧪 Testar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{result.espaco.descricao}</p>
              
              {result.gestores.length > 0 ? (
                <div>
                  <h4 className="font-medium text-sm mb-2">Gestores responsáveis:</h4>
                  <div className="space-y-2">
                    {result.gestores.map((gestor: any) => (
                      <div key={gestor.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{gestor.nome}</span>
                          <span className="text-sm text-gray-600 ml-2">({gestor.email})</span>
                        </div>
                        <Badge variant="outline">{gestor.tipo}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-red-600 bg-red-50 p-3 rounded">
                  ⚠️ Nenhum gestor responsável por este espaço
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teste Geral */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 Teste Geral do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Testar notificação para um espaço específico:</label>
              <div className="flex gap-2">
                <Select value={selectedEspaco?.toString() || ''} onValueChange={(value) => {
                  setSelectedEspaco(parseInt(value));
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Escolha um espaço para testar" />
                  </SelectTrigger>
                  <SelectContent>
                    {espacosOk.map(result => (
                      <SelectItem key={result.espaco.id} value={result.espaco.id.toString()}>
                        {result.espaco.nome} ({result.gestores.length} gestor(es))
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => selectedEspaco && testarNotificacaoEspaco(selectedEspaco)}
                  disabled={!selectedEspaco || testing}
                >
                  {testing ? <Clock className="w-4 h-4 mr-2" /> : null}
                  🎯 Testar Selecionado
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>O que este teste faz:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Simula uma nova solicitação de agendamento</li>
                <li>Identifica os gestores responsáveis pelo espaço</li>
                <li>Envia notificação por email para cada gestor</li>
                <li>Mostra logs detalhados no console</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 