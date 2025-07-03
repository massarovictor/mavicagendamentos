-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create ENUMs
DO $$ BEGIN
    CREATE TYPE tipo_usuario AS ENUM ('admin', 'gestor', 'usuario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_agendamento AS ENUM ('pendente', 'aprovado', 'rejeitado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL DEFAULT 'usuario',
    ativo BOOLEAN NOT NULL DEFAULT true,
    espacos INTEGER[] DEFAULT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: espacos
CREATE TABLE IF NOT EXISTS espacos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    capacidade INTEGER NOT NULL CHECK (capacidade > 0),
    descricao TEXT,
    equipamentos TEXT[] DEFAULT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: agendamentos_fixos (primeiro, sem dependências)
CREATE TABLE IF NOT EXISTS agendamentos_fixos (
    id SERIAL PRIMARY KEY,
    espaco_id INTEGER NOT NULL REFERENCES espacos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    aula_inicio INTEGER NOT NULL CHECK (aula_inicio >= 1 AND aula_inicio <= 9),
    aula_fim INTEGER NOT NULL CHECK (aula_fim >= 1 AND aula_fim <= 9),
    dias_semana INTEGER[] NOT NULL CHECK (array_length(dias_semana, 1) > 0),
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT aula_range_valid_fixo CHECK (aula_inicio <= aula_fim),
    CONSTRAINT date_range_valid CHECK (data_inicio <= data_fim),
    CONSTRAINT dias_semana_valid CHECK (
        dias_semana <@ ARRAY[0,1,2,3,4,5,6] AND 
        array_length(dias_semana, 1) > 0
    )
);

-- Create table: agendamentos (depois dos agendamentos_fixos)
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    espaco_id INTEGER NOT NULL REFERENCES espacos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    aula_inicio INTEGER NOT NULL CHECK (aula_inicio >= 1 AND aula_inicio <= 9),
    aula_fim INTEGER NOT NULL CHECK (aula_fim >= 1 AND aula_fim <= 9),
    status status_agendamento NOT NULL DEFAULT 'pendente',
    observacoes TEXT,
    agendamento_fixo_id INTEGER REFERENCES agendamentos_fixos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT aula_range_valid CHECK (aula_inicio <= aula_fim),
    CONSTRAINT aula_max_duration CHECK (aula_fim - aula_inicio <= 3) -- máximo 4 aulas consecutivas
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_espacos_ativo ON espacos(ativo);
CREATE INDEX IF NOT EXISTS idx_espacos_nome ON espacos USING gin(nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_espaco_data ON agendamentos(espaco_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_composite ON agendamentos(espaco_id, data, status);

CREATE INDEX IF NOT EXISTS idx_agendamentos_fixos_espaco ON agendamentos_fixos(espaco_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_fixos_periodo ON agendamentos_fixos(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_agendamentos_fixos_ativo ON agendamentos_fixos(ativo);

-- Create updated_at triggers function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS usuarios_updated_at ON usuarios;
CREATE TRIGGER usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS espacos_updated_at ON espacos;
CREATE TRIGGER espacos_updated_at 
    BEFORE UPDATE ON espacos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS agendamentos_updated_at ON agendamentos;
CREATE TRIGGER agendamentos_updated_at 
    BEFORE UPDATE ON agendamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS agendamentos_fixos_updated_at ON agendamentos_fixos;
CREATE TRIGGER agendamentos_fixos_updated_at 
    BEFORE UPDATE ON agendamentos_fixos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos_fixos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access usuarios" ON usuarios;
DROP POLICY IF EXISTS "Users can view their own data" ON usuarios;
DROP POLICY IF EXISTS "Gestores can view usuarios" ON usuarios;

DROP POLICY IF EXISTS "All can view espacos" ON espacos;
DROP POLICY IF EXISTS "Admin full access espacos" ON espacos;
DROP POLICY IF EXISTS "Gestores can manage assigned espacos" ON espacos;

DROP POLICY IF EXISTS "Users can view their agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can insert agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can update their pending agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin full access agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Gestores can manage agendamentos in their espacos" ON agendamentos;

DROP POLICY IF EXISTS "Admin full access agendamentos_fixos" ON agendamentos_fixos;
DROP POLICY IF EXISTS "Gestores can manage agendamentos_fixos in their espacos" ON agendamentos_fixos;
DROP POLICY IF EXISTS "All can view agendamentos_fixos" ON agendamentos_fixos;

-- RLS Policies

-- usuarios: Admin pode tudo, gestores podem ver usuários, usuários só veem a si mesmos
CREATE POLICY "Admin full access usuarios" ON usuarios
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() AND u.tipo = 'admin'
        )
    );

CREATE POLICY "Users can view their own data" ON usuarios
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Gestores can view usuarios" ON usuarios
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() AND u.tipo IN ('gestor', 'admin')
        )
    );

-- espacos: Todos podem ver, apenas admin e gestores responsáveis podem modificar
CREATE POLICY "All can view espacos" ON espacos
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin full access espacos" ON espacos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() AND u.tipo = 'admin'
        )
    );

CREATE POLICY "Gestores can manage assigned espacos" ON espacos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() 
                AND u.tipo = 'gestor' 
                AND espacos.id = ANY(u.espacos)
        )
    );

-- agendamentos: Usuários veem seus próprios, gestores veem de seus espaços, admin vê tudo
CREATE POLICY "Users can view their agendamentos" ON agendamentos
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert agendamentos" ON agendamentos
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update their pending agendamentos" ON agendamentos
    FOR UPDATE TO authenticated
    USING (usuario_id = auth.uid() AND status = 'pendente')
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admin full access agendamentos" ON agendamentos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() AND u.tipo = 'admin'
        )
    );

CREATE POLICY "Gestores can manage agendamentos in their espacos" ON agendamentos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u, espacos e
            WHERE u.id = auth.uid() 
                AND u.tipo = 'gestor'
                AND e.id = agendamentos.espaco_id
                AND e.id = ANY(u.espacos)
        )
    );

-- agendamentos_fixos: Apenas admin e gestores responsáveis
CREATE POLICY "Admin full access agendamentos_fixos" ON agendamentos_fixos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() AND u.tipo = 'admin'
        )
    );

CREATE POLICY "Gestores can manage agendamentos_fixos in their espacos" ON agendamentos_fixos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u, espacos e
            WHERE u.id = auth.uid() 
                AND u.tipo = 'gestor'
                AND e.id = agendamentos_fixos.espaco_id
                AND e.id = ANY(u.espacos)
        )
    );

CREATE POLICY "All can view agendamentos_fixos" ON agendamentos_fixos
    FOR SELECT TO authenticated
    USING (true); 