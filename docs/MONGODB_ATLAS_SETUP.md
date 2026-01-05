# Como Conectar ao MongoDB Atlas

Este guia ensina como configurar o MongoDB Atlas para o FlexiWell CRM.

## Passo 1: Criar Conta no MongoDB Atlas

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Clique em "Try Free" ou "Start Free"
3. Crie sua conta (pode usar Google, GitHub ou email)

## Passo 2: Criar um Cluster

1. Após login, clique em "Build a Database"
2. Escolha o plano **FREE (M0)** - suficiente para desenvolvimento e pequenos projetos
3. Escolha o provedor (AWS, Google Cloud ou Azure) e a região mais próxima de você
   - Para Brasil: escolha `South America (São Paulo)` se disponível
4. Dê um nome ao cluster (ex: `flexiwell-cluster`)
5. Clique em "Create"

## Passo 3: Configurar Acesso

### 3.1 Criar Usuário do Banco

1. No menu lateral, vá em **Database Access**
2. Clique em "Add New Database User"
3. Escolha "Password" como método de autenticação
4. Defina:
   - **Username**: `flexiwell_admin` (ou outro de sua escolha)
   - **Password**: Gere uma senha forte (clique em "Autogenerate Secure Password")
   - **IMPORTANTE**: Copie e salve essa senha!
5. Em "Database User Privileges", selecione "Read and write to any database"
6. Clique em "Add User"

### 3.2 Configurar IP Access (Network Access)

1. No menu lateral, vá em **Network Access**
2. Clique em "Add IP Address"
3. Para desenvolvimento, clique em "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ Em produção, configure apenas os IPs do seu servidor
4. Clique em "Confirm"

## Passo 4: Obter a Connection String

1. Volte para **Database** no menu lateral
2. Clique em "Connect" no seu cluster
3. Escolha "Connect your application"
4. Selecione:
   - Driver: `Node.js`
   - Version: `6.0 or later`
5. Copie a connection string. Ela será algo como:

```
mongodb+srv://flexiwell_admin:<password>@flexiwell-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Passo 5: Configurar no FlexiWell

1. No projeto FlexiWell, crie/edite o arquivo `.env.local`:

```bash
# Substitua <password> pela senha que você salvou
# Adicione o nome do banco (/flexiwell) antes do ?

MONGODB_URI=mongodb+srv://flexiwell_admin:SUA_SENHA_AQUI@flexiwell-cluster.xxxxx.mongodb.net/flexiwell?retryWrites=true&w=majority
```

2. **IMPORTANTE**: Substitua:
   - `SUA_SENHA_AQUI` pela senha do usuário
   - `flexiwell-cluster.xxxxx` pelo endereço real do seu cluster
   - Adicione `/flexiwell` antes do `?` para especificar o banco de dados

## Passo 6: Testar a Conexão

### Opção A: Rodar o Seed Script

```bash
# Instale as dependências se necessário
npm install mongodb bcryptjs dotenv

# Execute o seed
npx ts-node scripts/seed.ts
```

Se tudo estiver correto, você verá:
```
🌱 Starting database seed...
✅ Connected to MongoDB
...
🎉 Database seed completed successfully!
```

### Opção B: Testar via Aplicação

```bash
npm run dev
```

Acesse `http://localhost:3000/login` e tente fazer login com:
- Email: `admin@flexiwell.com`
- Senha: `password123`

## Passo 7: Verificar os Dados no Atlas

1. No MongoDB Atlas, vá em **Database** > **Browse Collections**
2. Você verá o banco `flexiwell` com as collections:
   - `users`
   - `staff`
   - `clients`
   - `classes`
   - `units`

## Troubleshooting

### Erro: "MongoServerError: bad auth"
- Verifique se a senha está correta
- Certifique-se de que não há caracteres especiais não-escapados na senha
- Se a senha tem `@`, `#`, ou outros caracteres especiais, use URL encoding

### Erro: "MongoNetworkError: connection timed out"
- Verifique se seu IP está na lista de Network Access
- Tente adicionar 0.0.0.0/0 temporariamente para testar

### Erro: "MongoServerSelectionError"
- Verifique se o cluster está ativo (não pausado)
- Clusters M0 gratuitos pausam após 60 dias de inatividade

## Próximos Passos

Após configurar o MongoDB:

1. [ ] Execute o seed script para popular dados iniciais
2. [ ] Teste o login na aplicação
3. [ ] Configure as variáveis do Stripe para pagamentos
4. [ ] Configure a API do OpenAI para o chat AI

---

## Configuração para Produção

Para produção, considere:

1. **Upgrade do Cluster**: M0 é limitado a 512MB. Para produção, considere M10+
2. **IP Whitelist**: Configure apenas os IPs do seu servidor (Vercel/Railway)
3. **Backup**: Configure backups automáticos (disponível em planos pagos)
4. **Índices**: Crie índices adicionais baseado nos padrões de query
5. **Monitoramento**: Ative alertas no Atlas para monitorar performance

## Custos

- **M0 (Free)**: Gratuito, 512MB, ideal para desenvolvimento
- **M10**: ~$57/mês, 10GB, para produção pequena
- **M20**: ~$120/mês, 20GB, para produção média

Para mais detalhes: [MongoDB Atlas Pricing](https://www.mongodb.com/pricing)
