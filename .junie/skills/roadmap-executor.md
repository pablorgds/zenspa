# Skill: Executor do Roadmap ZenSpa

Esta skill guia a implementação sequencial dos itens definidos em `.junie/specs/implementation-roadmap.md`. Sempre leia o spec antes de começar qualquer item para garantir aderência aos critérios de conclusão.

## Comando de Ativação
- "skill:roadmap [item]" — ex: `skill:roadmap 1.2`
- "implemente o item [X] do roadmap"
- "próximo item do roadmap"

## Fluxo de Execução

### Passo 0 — Leitura obrigatória
Antes de qualquer ação, leia:
1. `.junie/specs/implementation-roadmap.md` — para entender o item, suas sub-tarefas e critério de conclusão
2. Os arquivos existentes relacionados ao item (controller, model, página, etc.) para não duplicar ou sobrescrever lógica já correta

### Passo 1 — Identifique o item pelo número e fase

| Item | Fase | Título |
|------|------|--------|
| 1.1  | Estabilização | Limpeza de dados mockados no frontend |
| 1.2  | Estabilização | Gestão de Disponibilidades pelo Admin |
| 2.1  | Negócio | Módulo Financeiro Básico |
| 2.2  | Negócio | Regra de Antecedência no Cancelamento |
| 2.3  | Negócio | Notificações por E-mail |
| 3.1  | Expansão | Integração de Pagamento (PIX simulado) |
| 3.2  | Expansão | Relatórios Exportáveis |

**Regra:** Não pule fases. Itens da Fase 2 só devem ser iniciados após todos os itens da Fase 1 estarem concluídos. Itens da Fase 3 exigem a Fase 2 completa.

### Passo 2 — Execute na ordem correta

Para itens com backend + frontend, siga sempre:

#### A) Backend
1. **Migration** (se necessário): `php artisan make:migration`
2. **Model** (se necessário): definir `$fillable`, relações, constantes
3. **Controller**: implementar métodos com `$request->validate()` e lógica de negócio
4. **Rotas**: registrar em `routes/api.php` com middlewares corretos (`auth:sanctum`, `admin`)
5. **Verificar:** rodar `php artisan route:list` para confirmar as rotas

#### B) Testes (antes do frontend)
1. Ativar a skill `.junie/skills/test-generator.md`
2. Gerar Feature Test cobrindo: unauthenticated (401), non-admin se aplicável (403), happy path (200/201/204), casos de erro de validação (422)
3. Executar: `php artisan test --filter=[NomeDoTest]`
4. **Só avance para o frontend se todos os testes passarem**

#### C) Frontend
1. **api.js**: adicionar métodos de comunicação para os novos endpoints
2. **Context** (se necessário): atualizar AuthContext ou BookingContext
3. **Componente/Página**: criar ou atualizar UI com:
   - Estado de loading (`isLoading`) durante chamadas à API
   - Tratamento de erro com mensagem visível ao usuário
   - Feedback de sucesso após operação
4. **Rota no App.jsx** (se nova página)

### Passo 3 — Validação Final
1. Confirmar que o critério de conclusão definido no spec está satisfeito
2. Atualizar o status do item no spec: adicionar `✅ Concluído em YYYY-MM-DD` ao final da seção do item
3. Atualizar `.junie/guidelines.md` se houver mudança estrutural permanente (nova tabela, novo fluxo, novo padrão)

## Regras Gerais (aplicar em todos os itens)

- **PHP:** PSR-12, métodos camelCase, colunas snake_case
- **Middlewares:** `auth:sanctum` em toda rota protegida; middleware `admin` em rotas administrativas
- **Validação:** nunca confiar em dados do request sem `$request->validate()`
- **Frontend:** componentes funcionais React, hooks apenas (sem class components), Tailwind para estilos
- **Segurança:** checar `user_id` ownership antes de qualquer operação de leitura ou escrita em dados do usuário
- **Sem comentários óbvios:** só adicionar comentário quando o "porquê" não for evidente pelo código

## Referência Rápida de Arquivos-Chave

| O que modificar | Arquivo |
|-----------------|---------|
| Novas rotas API | `back/routes/api.php` |
| Novo controller | `back/app/Http/Controllers/Api/` |
| Novo model | `back/app/Models/` |
| Nova migration | `back/database/migrations/` |
| Novos testes | `back/tests/Feature/` |
| Novo método API client | `front/src/services/api.js` |
| Nova página | `front/src/pages/` |
| Novo componente | `front/src/components/` |
| Novo context | `front/src/context/` |
| Registrar rota frontend | `front/src/App.jsx` (ou equivalente de roteamento) |
