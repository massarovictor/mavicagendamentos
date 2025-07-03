# 🚨 Correção do Erro: relation "agendamentos_fixos" does not exist

## 📋 Problema
O erro ocorreu porque o script SQL original tinha uma **referência circular**: a tabela `agendamentos` tentava referenciar `agendamentos_fixos` antes dela ser criada.

## ✅ Solução Implementada

### **1. Script Corrigido**
Criado arquivo `supabase/migrations/001_initial_schema_fixed.sql` com:
- ✅ Ordem correta de criação das tabelas
- ✅ `CREATE TABLE IF NOT EXISTS` para evitar erros de duplicação
- ✅ `DROP POLICY IF EXISTS` para permitir re-execução
- ✅ Tratamento de ENUMs com `DO $$ BEGIN ... EXCEPTION`

### **2. Passos para Corrigir**

#### **Opção A: Usar Script Corrigido (Recomendado)**
```sql
-- No Supabase Dashboard > SQL Editor:
-- 1. Execute o arquivo: supabase/migrations/001_initial_schema_fixed.sql
-- 2. Execute o arquivo: supabase/migrations/002_seed_data.sql
```

#### **Opção B: Limpar e Recriar**
1. **Limpar tabelas existentes** (se necessário):
```sql
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS agendamentos_fixos CASCADE;
DROP TABLE IF EXISTS espacos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TYPE IF EXISTS tipo_usuario CASCADE;
DROP TYPE IF EXISTS status_agendamento CASCADE;
```

2. **Executar script corrigido**:
```sql
-- Execute supabase/migrations/001_initial_schema_fixed.sql
```

### **3. Principais Correções Feitas**

#### **Ordem de Criação**
```sql
-- ✅ CORRETO: Ordem sem dependências circulares
1. usuarios
2. espacos  
3. agendamentos_fixos  -- Criado ANTES
4. agendamentos        -- Referencia agendamentos_fixos
```

#### **Tratamento de Erros**
```sql
-- ✅ ENUMs com tratamento de duplicação
DO $$ BEGIN
    CREATE TYPE tipo_usuario AS ENUM ('admin', 'gestor', 'usuario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ✅ Tabelas com IF NOT EXISTS
CREATE TABLE IF NOT EXISTS usuarios (...)

-- ✅ Índices com IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ✅ Políticas com DROP IF EXISTS
DROP POLICY IF EXISTS "Admin full access usuarios" ON usuarios;
CREATE POLICY "Admin full access usuarios" ON usuarios...
```

## 🎯 Verificar se Funcionou

### **1. Testar no SQL Editor**
```sql
-- Verificar se todas as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deve retornar:
-- agendamentos
-- agendamentos_fixos
-- espacos
-- usuarios
```

### **2. Verificar dados iniciais**
```sql
SELECT COUNT(*) as usuarios FROM usuarios;
SELECT COUNT(*) as espacos FROM espacos;
SELECT COUNT(*) as agendamentos FROM agendamentos;
```

### **3. Testar no Frontend**
```typescript
// No console do navegador:
import { supabase } from './src/lib/supabase.ts';
const { data, error } = await supabase.from('usuarios').select('*');
console.log('Usuários:', data);
console.log('Erro:', error);
```

## 🔧 Se Ainda Houver Problemas

### **Erro: duplicate key value violates unique constraint**
```sql
-- Limpar dados duplicados
DELETE FROM usuarios WHERE id IN (
    SELECT id FROM usuarios 
    GROUP BY email HAVING COUNT(*) > 1
);
```

### **Erro: RLS is enabled but no policies exist**
```sql
-- Desabilitar RLS temporariamente para teste
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE espacos DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos_fixos DISABLE ROW LEVEL SECURITY;
```

### **Erro: function auth.uid() does not exist**
As políticas RLS só funcionam com usuários autenticados. Para testar sem autenticação:
```sql
-- Políticas mais simples para teste
DROP POLICY IF EXISTS "Admin full access usuarios" ON usuarios;
CREATE POLICY "allow_all_usuarios" ON usuarios FOR ALL USING (true);
```

## 📞 Próximos Passos

1. **Execute o script corrigido**
2. **Verifique se as tabelas foram criadas**
3. **Teste a conexão no frontend**
4. **Execute a migração de dados**
5. **Prossiga com a implementação**

---

**✅ Com essas correções, o erro será resolvido e você poderá prosseguir com a migração!** 