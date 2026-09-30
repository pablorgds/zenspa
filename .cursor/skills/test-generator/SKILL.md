---
name: test-generator
description: Gera Feature Tests Laravel em back/tests/Feature para endpoints do ZenSpa, com 401, 403 de admin e persistência. Use quando pedirem testes de uma rota, ou antes de implementar a tela de uma funcionalidade nova.
---

# Gerador de testes funcionais

Gere Feature Tests do backend Laravel do ZenSpa no padrão dos testes que já existem.

## Quando entra

- "Gere testes para a funcionalidade X"
- "Crie testes de funcionalidade para o novo endpoint Y"
- A skill `feature-implementer` ou `roadmap-executor` pede os testes antes do frontend

## Regras

1. Criar o arquivo em `back/tests/Feature/`.
2. Namespace `Tests\Feature`, classe estendendo `Tests\TestCase`.
3. Usar `Illuminate\Foundation\Testing\RefreshDatabase`.
4. Acesso sem token retorna 401.
5. Acesso autenticado usa `$this->actingAs($user)`.
6. Rota administrativa: usuário comum recebe 403; só `is_admin => true` passa. A rota continua com o middleware `admin`.
7. Asserções mínimas: `assertStatus`, estrutura JSON (`assertJsonStructure` ou `assertJson`) e `assertDatabaseHas` em escrita.
8. Massa de dados com `User::factory()`, `Professional::factory()` e as factories existentes, ou `Model::create()` se a factory não existir.
9. Não enfraquecer nem apagar teste para a suíte ficar verde.

## Modelo

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class [Nome]Test extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_[feature]()
    {
        $response = $this->getJson('/api/[endpoint]');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_[action]_[feature]()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/[endpoint]', [
                // dados
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('[tabela]', [
            // verificações
        ]);
    }
}
```

## Fluxo

1. Ler o controller e as rotas da funcionalidade.
2. Decidir se a rota exige autenticação ou `is_admin`.
3. Gerar o teste com as regras acima.
4. Rodar, a partir de `back/`, `php artisan test --filter=[Nome]Test`.
5. Corrigir o código ou o teste até passar.
