---
name: feature-implementer
description: Implementa funcionalidade fullstack do ZenSpa na ordem API Laravel, Feature Test e tela React via api.js. Use quando pedirem um módulo ou funcionalidade nova que cruza backend e frontend.
---

# Implementador de funcionalidade

Implemente funcionalidade nova do ZenSpa com API, teste e tela na mesma sequência. Leia o código vizinho antes de criar arquivo.

## Quando entra

- "Implemente o módulo de [X]"
- "Crie a funcionalidade de [Y]"
- Item de produto que não está coberto pela skill `roadmap-executor`

Se o pedido for um item de `.specs/implementation-roadmap.md`, use `roadmap-executor`.

## Fluxo

### 1. Backend

1. Migration em `back/database/migrations` quando o schema mudar. Não edite migration já enviada.
2. Model com `$fillable` e relações no estilo dos models atuais.
3. Controller e rota em `back/routes/api.php`.
4. Rota protegida usa `auth:sanctum`. Rota administrativa usa também `admin`.
5. Validar com `$request->validate()`.

### 2. Testes

Siga `.cursor/skills/test-generator/SKILL.md`. Cubra 401, 403 quando a rota for admin, o caminho feliz e o 422 de validação. Rode `php artisan test --filter=[NomeDoTest]` a partir de `back/`. Só avance com a suíte desse filtro verde.

### 3. Frontend

1. Novo método só em `front/src/services/api.js`.
2. Atualize `AuthContext` ou `BookingContext` apenas se o estado já vive ali.
3. Tela com loading, erro visível e feedback de sucesso.
4. Rota nova em `front/src/App.jsx`.

### 4. Fechamento

1. Percorra o fluxo que o usuário vê.
2. Se nascer tabela, fluxo ou padrão permanente, atualize `AGENTS.md`.

## Padrões

- Backend no estilo dos controllers atuais. Colunas em snake_case.
- Frontend em componente funcional. Status de agendamento só pelos valores de `front/src/constants/bookingStatuses.js`.
- Operação de cliente confere `user_id`. Não devolva dados de outro usuário.
