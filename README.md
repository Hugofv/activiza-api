# 💼 Operations Management API

API RESTful em Node.js + TypeScript + Express para gestão de operações financeiras, clientes, parcelas e pagamentos.

---

## 🛠 Stack Tecnológica

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma Client
- **Validation:** Zod
- **DI Container:** Awilix
- **Testing:** Jest (configuração disponível)

---

## 📁 Estrutura do Projeto

```
/src
  /controllers          # Controllers RESTful (sem sufixo .controller)
    accounts.ts
    clients.ts
    operations.ts
    installments.ts
    payments.ts
    resources.ts
    alerts.ts
    notifications.ts
    settings.ts
    platformUsers.ts
  
  /services              # Lógica de negócio (sem sufixo .service)
    accounts.ts
    clients.ts
    operations.ts        # Inclui geração automática de parcelas
    installments.ts
    payments.ts
    resources.ts
    alerts.ts
    notifications.ts
    settings.ts
    platformUsers.ts
  
  /routes                # Definição de rotas
    accounts.routes.ts
    clients.routes.ts
    operations.routes.ts
    installments.routes.ts
    payments.routes.ts
    resources.routes.ts
    alerts.routes.ts
    notifications.routes.ts
    settings.routes.ts
    platformUsers.routes.ts
    index.ts
  
  /dtos                  # Data Transfer Objects com Zod schemas
    accounts.dto.ts
    clients.dto.ts
    operations.dto.ts
    installments.dto.ts
    payments.dto.ts
  
  /validators            # Validators Zod (re-export dos DTOs)
    operations.validator.ts
    payments.validator.ts
    clients.validator.ts
  
  /middlewares           # Middlewares Express
    auth.middleware.ts      # Autenticação (stub)
    role.middleware.ts      # Controle de acesso por role
    error.middleware.ts     # Tratamento global de erros
    validation.middleware.ts # Validação de requests
  
  /utils                  # Utilitários
    serializeBigInt.ts      # Converte BigInt para string em JSON
    pagination.ts           # Helpers de paginação
    dateHelpers.ts          # Cálculo de datas para parcelas
  
  /constants              # Constantes e enums
    enums.ts                # Todos os enums do sistema
  
  /prisma
    client.ts               # Instância do PrismaClient
  
  /__tests__              # Testes unitários
    operations.controller.test.ts
  
  index.ts                 # Entry point da aplicação
  server.ts                # Configuração do Express
  container.ts             # Configuração do DI Container
```

---

## 🚀 Início Rápido

### 1. Instalação

```bash
npm install
```

### 2. Configuração do Banco de Dados

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/shadow_dbname"
PORT=3000
NODE_ENV=development
```

### 3. Migrations do Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate dev

# (Opcional) Visualizar dados no Prisma Studio
npx prisma studio
```

### 4. Executar a API

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm run build
npm start
```

---

## 📚 Documentação da API

Consulte o arquivo **[README_API.md](./README_API.md)** para documentação completa dos endpoints, exemplos de requests/responses e códigos de erro.

### Endpoints Principais

- **Accounts:** `/api/accounts` - Gestão de contas
- **Clients:** `/api/clients` - Gestão de clientes
- **Operations:** `/api/operations` - Gestão de operações financeiras
- **Installments:** `/api/installments` - Gestão de parcelas
- **Payments:** `/api/payments` - Gestão de pagamentos
- **Resources:** `/api/resources` - Gestão de recursos (propriedades, veículos, etc.)
- **Alerts:** `/api/alerts` - Gestão de alertas
- **Notifications:** `/api/notifications` - Gestão de notificações
- **Settings:** `/api/settings` - Configurações
- **Platform Users:** `/api/platform-users` - Usuários da plataforma

---

## 🔑 Funcionalidades Principais

### 1. Geração Automática de Parcelas

Ao criar uma operação com `installments` e `frequency`, o sistema automaticamente:
- Calcula o valor de cada parcela
- Gera as datas de vencimento baseadas na frequência (WEEKLY, BIWEEKLY, MONTHLY)
- Separa principal e juros (se houver)
- Cria os registros de parcelas no banco

**Exemplo:**
```typescript
POST /api/operations
{
  "accountId": 1,
  "clientId": 1,
  "type": "LOAN",
  "principalAmount": 10000,
  "installments": 12,
  "frequency": "MONTHLY",
  "interestRate": 2.5,
  "startDate": "2024-01-01T00:00:00.000Z"
}
```

### 2. Soft Delete

Todos os métodos `delete` implementam **soft delete**:
- Registros não são removidos fisicamente
- Campo `deletedAt` é preenchido com a data/hora da exclusão
- Queries por padrão filtram registros deletados (`deletedAt IS NULL`)
- Use `includeDeleted: true` para incluir registros deletados

**Nota:** Adicione o campo `deletedAt` aos modelos no Prisma schema (veja [SOFT_DELETE.md](./SOFT_DELETE.md))

### 3. Serialização de BigInt

IDs do tipo `BigInt` (Operation.id, Installment.id, Payment.id) são automaticamente convertidos para string em respostas JSON, evitando erros de serialização.

### 4. Validação com Zod

Todos os endpoints de criação/atualização validam os dados de entrada usando schemas Zod, retornando erros detalhados em caso de validação falhar.

### 5. Paginação

Todos os endpoints de listagem suportam paginação:
- `page` (padrão: 1)
- `limit` (padrão: 20, máximo: 100)

---

## 🔐 Autenticação e Autorização

### Autenticação (Stub)

O middleware `auth.middleware.ts` atualmente é um stub. Para produção, implemente:
- Validação de JWT tokens
- Verificação de sessões
- Integração com OAuth providers

**Formato atual (desenvolvimento):**
```
Authorization: Bearer userId:role
```

### Controle de Acesso

Use os middlewares de role para proteger endpoints:

```typescript
import { requireRole, requireOwnerOrAdmin } from '../middlewares/role.middleware';

// Apenas owner
router.get('/admin', requireRole('owner'), handler);

// Owner ou admin
router.get('/settings', requireOwnerOrAdmin, handler);
```

**Roles disponíveis:**
- `owner` - Proprietário
- `admin` - Administrador
- `agent` - Agente
- `viewer` - Visualizador

---

## 🧪 Testes

### Configuração

Instale as dependências de teste:

```bash
npm install --save-dev jest @types/jest ts-jest
```

Adicione ao `package.json`:

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.test.ts"]
  }
}
```

### Executar Testes

```bash
npm test
```

---

## 📝 Convenções de Código

### Nomenclatura

- **Arquivos:** camelCase (sem sufixos `.controller` ou `.service`)
- **Classes:** PascalCase
- **Funções/Métodos:** camelCase
- **Constantes:** UPPER_SNAKE_CASE
- **Database:** snake_case (Prisma cuida do mapeamento)

### Estrutura de Resposta

Todas as respostas seguem o formato:

```json
{
  "success": true,
  "data": { ... }
}
```

Erros:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia com hot-reload (nodemon)

# Build
npm run build            # Compila TypeScript para dist/

# Produção
npm start                # Inicia servidor compilado

# Prisma
npm run prisma generate  # Gera Prisma Client
npx prisma migrate dev   # Executa migrations
npx prisma studio        # Abre Prisma Studio
```

---

## 📦 Dependências Principais

- `express` - Framework web
- `@prisma/client` - ORM
- `zod` - Validação de schemas
- `awilix` / `awilix-express` - Dependency Injection
- `date-fns` - Manipulação de datas
- `jet-logger` - Logging

---

## 🐛 Troubleshooting

### Erro: "Property 'X' does not exist on PrismaClient"

Execute:
```bash
npx prisma generate
```

### Erro: "deletedAt is not defined"

Adicione o campo `deletedAt` aos modelos no schema Prisma (veja [SOFT_DELETE.md](./SOFT_DELETE.md)) e execute:
```bash
npx prisma migrate dev --name add_soft_delete
npx prisma generate
```

### Erro de serialização BigInt

O utilitário `serializeBigInt` já está implementado e é usado automaticamente nos controllers. Certifique-se de que está sendo aplicado nas respostas.

---

## 📄 Licença

[Adicione sua licença aqui]

---

## 👥 Contribuindo

[Adicione instruções de contribuição se necessário]

---

## 📞 Suporte

[Adicione informações de contato/suporte]
