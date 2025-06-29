
export interface Usuario {
  id: number;
  nome: string;
  tipo: 'admin' | 'gestor' | 'usuario';
  espacos?: number[]; // IDs dos espaços que o gestor gerencia
  email?: string;
  telefone?: string;
}

export interface Espaco {
  id: number;
  nome: string;
  capacidade: number;
  descricao?: string;
  equipamentos?: string[];
  ativo: boolean;
}

export interface Agendamento {
  id: number;
  espacoId: number;
  usuarioId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  criadoEm: string;
  agendamentoFixoId?: number; // Referência ao agendamento fixo que gerou este agendamento
}

export interface AgendamentoFixo {
  id: number;
  espacoId: number;
  usuarioId: number;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[]; // 0-6 (domingo-sábado)
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface AuthState {
  usuario: Usuario | null;
  isLoggedIn: boolean;
}
