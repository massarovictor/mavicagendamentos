# 🚀 Guia Completo: Migração para Supabase

## 📋 Resumo

Este guia detalha o processo completo de migração do **Easy Arrange App** do localStorage para o **Supabase**, mantendo total compatibilidade com o sistema existente.

## 🎯 Objetivos da Migração

- ✅ **Persistência real** dos dados
- ✅ **Sincronização em tempo real** entre usuários
- ✅ **Backup automático** na nuvem
- ✅ **Escalabilidade** para múltiplos usuários
- ✅ **Autenticação robusta**
- ✅ **Row Level Security (RLS)**
- ✅ **Compatibilidade total** com o sistema atual

---

## 🛠️ PASSO A PASSO

### **1. Configuração do Projeto Supabase**

#### 1.1 Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Configure:
   - **Nome**: `easy-arrange-app`
   - **Organização**: Sua organização
   - **Região**: South America (São Paulo) para melhor latência
   - **Senha do banco**: Escolha uma senha forte

#### 1.2 Obter credenciais
1. Vá para `Settings > API`
2. Copie:
   - **Project URL** 
   - **anon/public key**

#### 1.3 Configurar variáveis de ambiente
Crie arquivo `.env` na raiz do projeto:
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### **2. Executar Scripts SQL**

#### 2.1 Criar tabelas
No Supabase Dashboard:
1. Vá para `SQL Editor`
2. Execute o script `supabase/migrations/001_initial_schema.sql`
3. Verifique se todas as tabelas foram criadas

#### 2.2 Popular dados iniciais
1. Execute o script `supabase/migrations/002_seed_data.sql`
2. Verifique os dados na aba `Table Editor`

### **3. Configurar RLS (Row Level Security)**

As políticas RLS já estão incluídas no script SQL, mas aqui está o resumo:

#### Usuários
- **Admin**: Acesso total
- **Gestor**: Pode ver todos os usuários, modificar apenas seus dados
- **Usuário**: Pode ver apenas seus próprios dados

#### Espaços
- **Todos**: Podem visualizar
- **Admin**: Acesso total
- **Gestor**: Pode modificar apenas espaços atribuídos

#### Agendamentos
- **Usuário**: Vê seus próprios agendamentos
- **Gestor**: Vê agendamentos dos seus espaços
- **Admin**: Vê todos

### **4. Implementar a Migração**

#### 4.1 Testar conexão
```typescript
// No console do navegador
import { supabase } from './src/lib/supabase.ts';
const { data, error } = await supabase.from('usuarios').select('*');
console.log(data, error);
```

#### 4.2 Executar migração de dados
```typescript
import { migrateLocalStorageToSupabase } from './src/utils/migrateToSupabase.ts';
const result = await migrateLocalStorageToSupabase();
console.log(result);
```

#### 4.3 Alternar para Supabase
No arquivo onde está sendo usado `useAppState`, substitua por:
```typescript
// De:
import { useAppState } from '@/hooks/useAppState';

// Para:
import { useSupabaseData as useAppState } from '@/hooks/useSupabaseData';
```

---

## 🔧 Estrutura das Tabelas

### **usuarios**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
nome VARCHAR(255) NOT NULL
email VARCHAR(255) UNIQUE NOT NULL
tipo tipo_usuario NOT NULL DEFAULT 'usuario'
ativo BOOLEAN NOT NULL DEFAULT true
espacos INTEGER[] DEFAULT NULL
telefone VARCHAR(20)
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### **espacos**
```sql
id SERIAL PRIMARY KEY
nome VARCHAR(255) NOT NULL
capacidade INTEGER NOT NULL CHECK (capacidade > 0)
descricao TEXT
equipamentos TEXT[] DEFAULT NULL
ativo BOOLEAN NOT NULL DEFAULT true
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### **agendamentos**
```sql
id SERIAL PRIMARY KEY
espaco_id INTEGER REFERENCES espacos(id)
usuario_id UUID REFERENCES usuarios(id)
data DATE NOT NULL
aula_inicio INTEGER CHECK (aula_inicio >= 1 AND aula_inicio <= 9)
aula_fim INTEGER CHECK (aula_fim >= 1 AND aula_fim <= 9)
status status_agendamento DEFAULT 'pendente'
observacoes TEXT
agendamento_fixo_id INTEGER REFERENCES agendamentos_fixos(id)
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### **agendamentos_fixos**
```sql
id SERIAL PRIMARY KEY
espaco_id INTEGER REFERENCES espacos(id)
usuario_id UUID REFERENCES usuarios(id)
data_inicio DATE NOT NULL
data_fim DATE NOT NULL
aula_inicio INTEGER CHECK (aula_inicio >= 1 AND aula_inicio <= 9)
aula_fim INTEGER CHECK (aula_fim >= 1 AND aula_fim <= 9)
dias_semana INTEGER[] NOT NULL
observacoes TEXT
ativo BOOLEAN NOT NULL DEFAULT true
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

---

## 🔐 Autenticação

### **Opção 1: Autenticação Simples (Atual)**
- Mantém o sistema atual de busca por nome + tipo
- Usa `useSupabaseAuth.loginSimple()`
- Ideal para migração gradual

### **Opção 2: Autenticação Completa**
- Email + senha real
- Usa `useSupabaseAuth.loginWithEmailPassword()`
- Mais segura para produção

### **Configuração**
```typescript
// Login simples (compatibilidade)
const { loginSimple } = useSupabaseAuth();
await loginSimple('João Silva', 'usuario');

// Login completo
const { loginWithEmailPassword } = useSupabaseAuth();
await loginWithEmailPassword('joao@email.com', 'senha123');
```

---

## 📊 Recursos Implementados

### **Sincronização em Tempo Real**
- ✅ Mudanças refletem instantaneamente em todas as abas
- ✅ Múltiplos usuários podem usar simultaneamente
- ✅ Atualizações automáticas via WebSocket

### **Validações no Banco**
- ✅ Constraints de integridade referencial
- ✅ Validações de horário (1-9 aulas)
- ✅ Validações de data
- ✅ Capacidade máxima de aulas consecutivas

### **Backup e Recuperação**
- ✅ Backup automático antes da migração
- ✅ Função de reversão disponível
- ✅ Dados preservados no localStorage como fallback

### **Performance**
- ✅ Índices otimizados para consultas frequentes
- ✅ Queries eficientes com joins automáticos
- ✅ Cache inteligente no frontend

---

## 🔄 Processo de Rollback

Se precisar voltar ao localStorage:

```typescript
import { revertMigration } from '@/utils/migrateToSupabase';
const result = await revertMigration();
console.log(result);
```

E alterar de volta:
```typescript
// Voltar para:
import { useAppState } from '@/hooks/useAppState';
```

---

## 🚨 Troubleshooting

### **Problema: Erro de RLS**
```
Row level security violation
```
**Solução**: Verificar se o usuário está autenticado e tem permissões

### **Problema: Erro de Conexão**
```
Failed to fetch
```
**Solução**: Verificar variáveis de ambiente e URL do Supabase

### **Problema: Dados não aparecem**
```
Empty result set
```
**Solução**: Verificar se os dados foram migrados e se há dados na tabela

### **Problema: UUID vs Number**
```
Invalid input syntax for type uuid
```
**Solução**: O sistema converte automaticamente, mas verificar mapeamento

---

## 📈 Benefícios Alcançados

### **Antes (localStorage)**
- ❌ Dados perdidos ao limpar navegador
- ❌ Sem sincronização entre usuários
- ❌ Sem backup automático
- ❌ Limitado a um usuário por vez
- ❌ Sem validações no backend

### **Depois (Supabase)**
- ✅ Dados persistentes na nuvem
- ✅ Sincronização em tempo real
- ✅ Backup automático
- ✅ Múltiplos usuários simultâneos
- ✅ Validações robustas no banco
- ✅ Row Level Security
- ✅ Escalabilidade infinita
- ✅ API REST automática
- ✅ WebSocket em tempo real

---

## 🛡️ Segurança

### **Row Level Security**
- Usuários só acessam dados autorizados
- Políticas granulares por tipo de usuário
- Validação automática no banco

### **Validações**
- Constraints de banco impedem dados inválidos
- Validações de negócio mantidas
- Rate limiting implementado

### **Backup**
- Dados preservados automaticamente
- Histórico de mudanças
- Recuperação de desastres

---

## 🎉 Conclusão

A migração para Supabase transforma o Easy Arrange App de um protótipo local em uma **aplicação enterprise real**, mantendo 100% de compatibilidade com o código existente.

### **Próximos Passos Recomendados:**

1. **Imediato**: Configurar projeto Supabase e executar migração
2. **Curto prazo**: Implementar autenticação completa (email/senha)
3. **Médio prazo**: Adicionar notificações por email
4. **Longo prazo**: Analytics e relatórios avançados

### **Suporte:**
- Documentação: [docs.supabase.com](https://docs.supabase.com)
- Community: [discord.supabase.com](https://discord.supabase.com)
- GitHub: [github.com/supabase/supabase](https://github.com/supabase/supabase)

---

**🎯 Sistema preparado para produção em menos de 1 dia!** 