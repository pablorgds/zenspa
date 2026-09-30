# Skill: Implementador de Novas Funcionalidades (Fullstack)

Esta skill orienta a implementação estruturada de novas funcionalidades no ZenSpa, garantindo que o backend (API + Segurança), os testes e o frontend (UI + Integração) estejam em sincronia.

## 🛠️ Comando de Ativação
Quando o usuário solicitar algo como:
- "Implemente o módulo de [X]"
- "Crie a funcionalidade de pagamento via [Y]"
- "skill:feature-impl [funcionalidade]"

## 📋 Fluxo de Execução Obrigatório

Sempre que esta skill for ativada, o fluxo DEVE seguir estas etapas:

### Etapa 1: Infraestrutura (Backend)
1.  **Modelo e Migração**: Criar ou atualizar Modelos e Migrações (ex: `php artisan make:migration`).
2.  **Controller e Rotas**: Implementar a lógica de negócio no Controller e registrar rotas em `api.php`.
    *   Sempre aplicar middleware `auth:sanctum`.
    *   Se for funcionalidade admin, aplicar middleware `admin`.
3.  **Validação**: Usar `$request->validate()` com regras rigorosas.

### Etapa 2: Garantia de Qualidade (Testes)
1.  **Ativar Skill de Testes**: Usar automaticamente a skill `.junie/skills/test-generator.md` para gerar os testes de funcionalidade da nova rota.
2.  **Execução**: Garantir que os testes passam (`php artisan test`) antes de ir para o frontend.

### Etapa 3: Integração (Frontend)
1.  **API Service**: Atualizar `front/src/services/api.js` com o novo método de comunicação.
2.  **Contexto/Estado**: Se necessário, atualizar Context APIs para refletir novos dados globais.
3.  **Componentes e Páginas**: Criar ou atualizar a UI (React) garantindo feedback visual de carregamento e erro.

### Etapa 4: Validação Final
1.  Realizar um teste manual do fluxo completo (E2E).
2.  Atualizar o `guidelines.md` se houver mudanças estruturais permanentes.

## 🚀 Padrões Técnicos
- **Backend**: PSR-12, CamelCase para métodos, snake_case para colunas de banco.
- **Frontend**: Componentes funcionais, Hooks (useEffect, useState), CSS via `global.css` ou módulos locais.
- **Segurança**: Nunca expor dados sensíveis no JSON de retorno; sempre verificar permissão de proprietário (`user_id`).
