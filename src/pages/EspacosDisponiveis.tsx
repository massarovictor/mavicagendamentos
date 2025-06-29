
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Settings, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EspacosDisponiveis = () => {
  const { espacos, agendamentos } = useLocalStorage();
  const navigate = useNavigate();

  const espacosAtivos = espacos.filter(e => e.ativo);

  const getEspacoStats = (espacoId: number) => {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => 
      a.espacoId === espacoId && 
      a.data === hoje &&
      a.status === 'aprovado'
    ).length;

    return {
      agendamentosHoje,
      disponivel: agendamentosHoje === 0
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Espaços Disponíveis</h1>
        <p className="text-gray-600 mt-2">Visualize todos os espaços disponíveis para agendamento</p>
      </div>

      {espacosAtivos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum espaço disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {espacosAtivos.map((espaco) => {
            const stats = getEspacoStats(espaco.id);
            return (
              <Card key={espaco.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {espaco.nome}
                    </CardTitle>
                    <Badge variant={stats.disponivel ? "default" : "secondary"}>
                      {stats.disponivel ? "Disponível Hoje" : "Ocupado Hoje"}
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

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600">
                      {stats.agendamentosHoje} agendamento(s) hoje
                    </span>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => navigate('/novo-agendamento')}
                  >
                    Fazer Agendamento
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EspacosDisponiveis;
