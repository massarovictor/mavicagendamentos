
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users, Calendar } from 'lucide-react';

const MeusEspacos = () => {
  const { espacos, agendamentos, usuarios } = useLocalStorage();
  const { usuario } = useAuth();

  const meusEspacos = espacos.filter(e => usuario?.espacos?.includes(e.id));

  const getEspacoStats = (espacoId: number) => {
    const agendamentosEspaco = agendamentos.filter(a => a.espacoId === espacoId);
    const pendentes = agendamentosEspaco.filter(a => a.status === 'pendente').length;
    const aprovados = agendamentosEspaco.filter(a => a.status === 'aprovado').length;
    const proximosAgendamentos = agendamentosEspaco.filter(a => 
      new Date(a.data) >= new Date() && a.status === 'aprovado'
    ).length;

    return {
      total: agendamentosEspaco.length,
      pendentes,
      aprovados,
      proximos: proximosAgendamentos
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meus Espaços</h1>
        <p className="text-gray-600 mt-2">Gerencie os espaços sob sua responsabilidade</p>
      </div>

      {meusEspacos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum espaço atribuído a você.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meusEspacos.map((espaco) => {
            const stats = getEspacoStats(espaco.id);
            return (
              <Card key={espaco.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {espaco.nome}
                    </CardTitle>
                    <Badge variant={espaco.ativo ? "default" : "secondary"}>
                      {espaco.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {espaco.descricao || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Capacidade: {espaco.capacidade} pessoas</span>
                  </div>

                  {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Equipamentos:</p>
                      <div className="flex flex-wrap gap-1">
                        {espaco.equipamentos.map((eq, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-xs text-gray-500">Total Agendamentos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.pendentes}</div>
                      <div className="text-xs text-gray-500">Pendentes</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
                      <div className="text-xs text-gray-500">Aprovados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.proximos}</div>
                      <div className="text-xs text-gray-500">Próximos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeusEspacos;
