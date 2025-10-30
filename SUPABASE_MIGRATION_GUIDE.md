# Guia de Migração para Supabase

## Passo 1: Habilitar Lovable Cloud

1. Clique no botão **Cloud** no topo da interface do Lovable
2. Clique em **Enable Cloud** para ativar o backend
3. Aguarde a criação automática do projeto Supabase

## Passo 2: Executar Migrations SQL

As migrations SQL já estão criadas na pasta `supabase/migrations/`:

1. Acesse a aba **Cloud** → **Database** no Lovable
2. Execute a migration `20240101000000_initial_schema.sql`
3. Isso criará todas as tabelas, políticas RLS e funções necessárias

## Passo 3: Criar o Usuário Admin

1. No painel do Supabase, vá em **Authentication** → **Users**
2. Crie um novo usuário com:
   - Email: `admin@carolamorimstudio.com`
   - Senha: `admin123` (ou sua escolha)
3. Copie o UUID do usuário criado
4. Execute no SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('COLE-O-UUID-AQUI', 'admin');
```

## Passo 4: Instalar Dependências

O Lovable instalará automaticamente o pacote `@supabase/supabase-js` quando necessário.

## Passo 5: Atualizar o Código

Após habilitar o Cloud, você precisará atualizar o código para usar Supabase em vez de localStorage:

1. Substituir chamadas de `storage.ts` por queries Supabase
2. Implementar autenticação com `supabase.auth`
3. Atualizar componentes para usar dados do Supabase

## Estrutura das Tabelas

### profiles
- Armazena informações do perfil do usuário
- Criado automaticamente via trigger ao registrar

### user_roles
- **CRÍTICO**: Roles em tabela separada por segurança
- Evita escalação de privilégios
- Usa função `has_role()` para verificações

### services
- Serviços oferecidos pelo studio
- Gerenciados pelo admin

### time_slots
- Horários disponíveis por serviço
- Status: available | booked

### appointments
- Agendamentos dos clientes
- Status: active | cancelled

## Segurança

✅ **Row Level Security (RLS)** habilitado em todas as tabelas
✅ **Roles em tabela separada** para evitar ataques
✅ **Função security definer** para verificação de roles
✅ **Políticas granulares** por tipo de usuário

## Próximos Passos

Após seguir este guia, peça ao Lovable para:
1. Atualizar o código para usar Supabase
2. Implementar autenticação com Supabase Auth
3. Migrar dados do localStorage (se necessário)
