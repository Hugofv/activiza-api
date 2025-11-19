# Response Helpers

Funções helper para simplificar e padronizar respostas HTTP nos controllers.

## Uso Básico

```typescript
import { ok, created, noContent, notFound, badRequest } from '../utils/response';

// Sucesso (200 OK)
ok(res, data);

// Criado (201 Created)
created(res, data);

// Sem conteúdo (204 No Content)
noContent(res);

// Não encontrado (404 Not Found)
notFound(res, 'Resource not found');

// Requisição inválida (400 Bad Request)
badRequest(res, 'Invalid input', 'VALIDATION_ERROR');
```

## Funções Disponíveis

### Sucesso

#### `ok(res, data)` - 200 OK
Retorna dados com sucesso.

```typescript
const account = await accountsService.findById(id);
ok(res, serializeBigInt(account));
```

#### `created(res, data)` - 201 Created
Recurso criado com sucesso.

```typescript
const account = await accountsService.create(dto);
created(res, serializeBigInt(account));
```

#### `noContent(res)` - 204 No Content
Operação bem-sucedida sem conteúdo de retorno.

```typescript
await accountsService.delete(id);
noContent(res);
```

### Erros

#### `badRequest(res, message, code?, details?)` - 400 Bad Request
Requisição inválida.

```typescript
if (!clientId) {
  badRequest(res, 'Client ID is required', 'VALIDATION_ERROR');
  return;
}
```

#### `unauthorized(res, message?, code?)` - 401 Unauthorized
Não autenticado.

```typescript
if (!req.user) {
  unauthorized(res);
  return;
}
```

#### `forbidden(res, message?, code?)` - 403 Forbidden
Acesso negado.

```typescript
if (req.user.role !== 'owner') {
  forbidden(res, 'Only owners can access this resource');
  return;
}
```

#### `notFound(res, message?, code?)` - 404 Not Found
Recurso não encontrado.

```typescript
const account = await accountsService.findById(id);
if (!account) {
  notFound(res, 'Account not found');
  return;
}
```

#### `conflict(res, message, code?)` - 409 Conflict
Conflito (ex: email duplicado).

```typescript
if (await usersService.emailExists(email)) {
  conflict(res, 'Email already registered');
  return;
}
```

#### `unprocessableEntity(res, message, code?, details?)` - 422 Unprocessable Entity
Erro de validação.

```typescript
const validation = validateSchema(data);
if (!validation.valid) {
  unprocessableEntity(res, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  return;
}
```

#### `internalServerError(res, message?, code?)` - 500 Internal Server Error
Erro interno do servidor.

```typescript
try {
  await someOperation();
} catch (err) {
  internalServerError(res, 'An unexpected error occurred');
  return;
}
```

### Função Genérica

#### `error(res, statusCode, message, code, details?)`
Para casos customizados.

```typescript
error(res, 418, "I'm a teapot", 'TEAPOT_ERROR');
```

## Exemplo Completo

```typescript
import { ok, created, notFound, badRequest } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';

export class AccountsController {
  async show(req: IReq, res: IRes): Promise<void> {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      badRequest(res, 'Invalid ID format');
      return;
    }
    
    const account = await this.accountsService.findById(id);
    
    if (!account) {
      notFound(res, 'Account not found');
      return;
    }
    
    ok(res, serializeBigInt(account));
  }
  
  async create(req: IReq, res: IRes): Promise<void> {
    const account = await this.accountsService.create(req.body);
    created(res, serializeBigInt(account));
  }
}
```

## Vantagens

✅ **Código mais limpo** - Menos repetição  
✅ **Consistência** - Formato padronizado de resposta  
✅ **Type-safe** - TypeScript garante tipos corretos  
✅ **Fácil manutenção** - Mudanças centralizadas  
✅ **Legibilidade** - Intenção clara do código

