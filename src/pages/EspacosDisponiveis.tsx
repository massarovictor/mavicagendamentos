import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Settings, Users, Calendar, MapPin, Clock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '@/utils/format';
import { NumeroAula } from '@/types';

const EspacosDisponiveis = () => {
  const { espacos, agendamentos, loading } = useSupabaseData();
  const navigate = useNavigate();

  const espacosAtivos = espacos.filter(e => e.ativo);

  const getEspacoStats = (espacoId: number) => {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => 
      a.espacoId === espacoId && 
      a.data === hoje &&
      a.status === 'aprovado'
    );

    const proximoAgendamento = agendamentos
      .filter(a => 
        a.espacoId === espacoId && 
        a.status === 'aprovado' &&
        new Date(a.data) >= new Date()
      )
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];

    return {
      agendamentosHoje: agendamentosHoje.length,
      disponivel: agendamentosHoje.length === 0,
      proximoAgendamento
    };
  };

  if (loading) {
    return <LoadingSpinner message="Carregando espaços..." />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Espaços Disponíveis"
        subtitle="Visualize todos os espaços disponíveis para agendamento"
        icon={Search}
        stats={[
          {
            label: "Total de Espaços",
            value: espacosAtivos.length,
            icon: MapPin,
            color: "bg-blue-500"
          },
          {
            label: "Disponíveis Hoje",
            value: espacosAtivos.filter(e => getEspacoStats(e.id).disponivel).length,
            icon: Calendar,
            color: "bg-green-500"
          },
          {
            label: "Capacidade Total",
            value: espacosAtivos.reduce((sum, e) => sum + e.capacidade, 0),
            icon: Users,
            color: "bg-purple-500"
          }
        ]}
      />

      {espacosAtivos.length === 0 ? (
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Nenhum espaço disponível</p>
              <p className="text-sm">Contate o administrador para mais informações</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Espaços</p>
                    <p className="text-2xl font-bold text-gray-900">{espacosAtivos.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disponíveis Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {espacosAtivos.filter(e => getEspacoStats(e.id).disponivel).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Capacidade Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {espacosAtivos.reduce((sum, e) => sum + e.capacidade, 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Espaços */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {espacosAtivos.map((espaco) => {
              const stats = getEspacoStats(espaco.id);
              return (
                <Card key={espaco.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {espaco.nome}
                      </CardTitle>
                      <Badge 
                        variant={stats.disponivel ? "default" : "secondary"}
                        className={`text-xs w-fit ${
                          stats.disponivel 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {stats.disponivel ? "Disponível Hoje" : "Ocupado Hoje"}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {espaco.descricao || "Sem descrição disponível"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <span className="font-medium">{espaco.capacidade} pessoas</span>
                    </div>

                    {espaco.equipamentos && espaco.equipamentos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Equipamentos:</p>
                        <div className="flex flex-wrap gap-1">
                          {espaco.equipamentos.slice(0, 3).map((eq, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              {eq}
                            </Badge>
                          ))}
                          {espaco.equipamentos.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{espaco.equipamentos.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">
                          {stats.agendamentosHoje} agendamento{stats.agendamentosHoje !== 1 ? 's' : ''} hoje
                        </span>
                      </div>

                      {stats.proximoAgendamento && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            Próximo: {formatDateTime(stats.proximoAgendamento.data, stats.proximoAgendamento.aulaInicio as NumeroAula)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full hover:shadow-lg transition-shadow"
                      size="sm"
                      onClick={() => navigate('/novo-agendamento')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Novo Agendamento
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default EspacosDisponiveis;
