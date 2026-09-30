---
name: roadmap-executor
description: Executa o próximo item de .specs/implementation-roadmap.md na ordem MVP-1 a MVP-5, com Feature Test antes da tela. Use quando pedirem o próximo item do roadmap, um item MVP, ou a implementação sequencial da agenda.
---

# Executor do roadmap

Implemente um item de `.specs/implementation-roadmap.md` por vez. Leia o spec inteiro do item antes de editar código.

## Quando entra

- "próximo item do roadmap"
- "implemente o item MVP-N"
- "skill:roadmap MVP-1"

## Fluxo

### 0. Leitura

1. `.specs/implementation-roadmap.md` — critério de conclusão do item.
2. Controller, model, página e teste já existentes, para não recriar o que está na seção "Já entregue".

### 1. Ordem

| Item | Fase | Título |
|------|------|--------|
| 1.1 | Entregue | Limpeza de dados mockados no frontend |
| 1.2 | Entregue | Gestão de disponibilidades pelo admin |
| 2.1 | Entregue | Caixa interno (não é gateway de pagamento) |
| MVP-1 | MVP | Integridade dos horários |
| MVP-2 | MVP | Agenda do dia e marcação pela recepção |
| MVP-3 | MVP | Bloqueios pontuais |
| MVP-4 | MVP | Antecedência no cancelamento e estorno interno |
| MVP-5 | MVP | Agenda do profissional autenticado |
| Pós-MVP | Depois | E-mail, perfil, serviço × profissional |
| Pagamentos | Depois | PIX/cartão, webhook e exportação CSV |

Não reabra item entregue. Siga MVP-1 → MVP-5. Pagamentos e o bloco pós-MVP só começam com o critério de MVP pronto do spec.

### 2. Implementação

Backend, testes, frontend, nessa ordem.

**Backend.** Migration se o schema mudar; model; controller com `$request->validate()`; rota em `back/routes/api.php` com `auth:sanctum` e `admin` quando for administrativa.

**Testes.** Siga `.cursor/skills/test-generator/SKILL.md`. Cubra 401, 403 de não-admin, caminho feliz e 422. Rode `php artisan test --filter=[NomeDoTest]` a partir de `back/`. A tela só começa com esse filtro verde.

**Frontend.** Método em `front/src/services/api.js`; context só se o estado já mora ali; loading, erro visível e sucesso; rota nova em `front/src/App.jsx`.

### 3. Fechamento

1. O critério do item no spec está satisfeito.
2. Marque o item em `.specs/implementation-roadmap.md` com `✅ Concluído em YYYY-MM-DD`.
3. Se nascer tabela, fluxo ou padrão permanente, atualize `AGENTS.md`.

## Regras

- Rota protegida usa `auth:sanctum`. Rota admin usa `admin`. Checagem de `user_id` em dado de cliente; vínculo `professionals.user_id` em dado de profissional.
- Componente funcional, com loading e erro em chamada assíncrona.
- Comentário só quando o motivo não aparece no código.

| O que mudar | Arquivo |
|-------------|---------|
| Rotas API | `back/routes/api.php` |
| Controller | `back/app/Http/Controllers/Api/` |
| Model | `back/app/Models/` |
| Migration | `back/database/migrations/` |
| Testes | `back/tests/Feature/` |
| Cliente HTTP | `front/src/services/api.js` |
| Página | `front/src/pages/` |
| Componente | `front/src/components/` |
| Context | `front/src/context/` |
| Rota da SPA | `front/src/App.jsx` |
