-- Tabela para logs de emails enviados
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    destinatario VARCHAR(255) NOT NULL,
    assunto TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nova_solicitacao', 'aprovacao', 'rejeicao', 'teste')),
    enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sucesso BOOLEAN NOT NULL DEFAULT true,
    erro_mensagem TEXT,
    agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_logs_destinatario ON email_logs(destinatario);
CREATE INDEX IF NOT EXISTS idx_email_logs_tipo ON email_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_email_logs_enviado_em ON email_logs(enviado_em);
CREATE INDEX IF NOT EXISTS idx_email_logs_agendamento ON email_logs(agendamento_id);

-- RLS para email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver tudo
CREATE POLICY "Admin full access email_logs" ON email_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE u.id = auth.uid() AND u.tipo = 'admin'
        )
    );

-- Política: Usuários podem ver emails enviados para eles
CREATE POLICY "Users can view their email logs" ON email_logs
    FOR SELECT TO authenticated
    USING (
        destinatario = (
            SELECT email FROM usuarios 
            WHERE id = auth.uid()
        )
    );

-- Comentário sobre a tabela
COMMENT ON TABLE email_logs IS 'Log de todos os emails enviados pelo sistema de notificações';
COMMENT ON COLUMN email_logs.tipo IS 'Tipo de notificação: nova_solicitacao, aprovacao, rejeicao, teste';
COMMENT ON COLUMN email_logs.agendamento_id IS 'ID do agendamento relacionado (se aplicável)'; 