export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          tipo: 'admin' | 'gestor' | 'usuario'
          ativo: boolean
          espacos: number[] | null
          telefone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          tipo: 'admin' | 'gestor' | 'usuario'
          ativo?: boolean
          espacos?: number[] | null
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          tipo?: 'admin' | 'gestor' | 'usuario'
          ativo?: boolean
          espacos?: number[] | null
          telefone?: string | null
          updated_at?: string
        }
      }
      espacos: {
        Row: {
          id: number
          nome: string
          capacidade: number
          descricao: string | null
          equipamentos: string[] | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          capacidade: number
          descricao?: string | null
          equipamentos?: string[] | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          capacidade?: number
          descricao?: string | null
          equipamentos?: string[] | null
          ativo?: boolean
          updated_at?: string
        }
      }
      agendamentos: {
        Row: {
          id: number
          espaco_id: number
          usuario_id: string
          data: string
          aula_inicio: number
          aula_fim: number
          status: 'pendente' | 'aprovado' | 'rejeitado'
          observacoes: string | null
          agendamento_fixo_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          espaco_id: number
          usuario_id: string
          data: string
          aula_inicio: number
          aula_fim: number
          status?: 'pendente' | 'aprovado' | 'rejeitado'
          observacoes?: string | null
          agendamento_fixo_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          espaco_id?: number
          usuario_id?: string
          data?: string
          aula_inicio?: number
          aula_fim?: number
          status?: 'pendente' | 'aprovado' | 'rejeitado'
          observacoes?: string | null
          agendamento_fixo_id?: number | null
          updated_at?: string
        }
      }
      agendamentos_fixos: {
        Row: {
          id: number
          espaco_id: number
          usuario_id: string
          data_inicio: string
          data_fim: string
          aula_inicio: number
          aula_fim: number
          dias_semana: number[]
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          espaco_id: number
          usuario_id: string
          data_inicio: string
          data_fim: string
          aula_inicio: number
          aula_fim: number
          dias_semana: number[]
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          espaco_id?: number
          usuario_id?: string
          data_inicio?: string
          data_fim?: string
          aula_inicio?: number
          aula_fim?: number
          dias_semana?: number[]
          observacoes?: string | null
          ativo?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_usuario: 'admin' | 'gestor' | 'usuario'
      status_agendamento: 'pendente' | 'aprovado' | 'rejeitado'
    }
  }
} 