# Skill: Gerador de Testes Funcionais (Laravel)

Esta skill permite a geração automática e padronizada de testes de funcionalidade (Feature Tests) para o backend Laravel do ZenSpa, garantindo que novas funcionalidades sigam os padrões de segurança e qualidade já estabelecidos.

## 🛠️ Comando de Ativação
Quando o usuário solicitar algo como:
- "Gere testes para a funcionalidade X"
- "Crie testes de funcionalidade para o novo endpoint Y"
- "skill:test-gen [funcionalidade]"

## 📋 Regras de Geração

Sempre que esta skill for ativada, os testes gerados DEVEM:

1.  **Localização**: Ser criados em `back/tests/Feature/`.
2.  **Namespace e Herança**: Usar `namespace Tests\Feature;` e estender `Tests\TestCase`.
3.  **Trait de Banco de Dados**: Usar `use Illuminate\Foundation\Testing\RefreshDatabase;`.
4.  **Autenticação**:
    *   Testar acesso **não autenticado** (deve retornar 401).
    *   Testar acesso **autenticado** usando `$this->actingAs($user)`.
5.  **Autorização (Admin)**:
    *   Se a rota for administrativa, testar que usuários comuns recebem 403 (ou o status configurado, ex: 405 se a rota não existir para o método).
    *   Garantir que apenas `is_admin => true` tenha acesso.
6.  **Asserções Mínimas**:
    *   Verificar status code esperado (`assertStatus`).
    *   Verificar estrutura do JSON retornado (`assertJsonStructure` ou `assertJson`).
    *   Verificar persistência no banco (`assertDatabaseHas`) para operações de escrita.
7.  **Massa de Dados**: Usar `User::factory()`, `Professional::factory()`, etc., ou `Model::create()` se a factory não existir.

## 템플릿 Base

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

## 🚀 Fluxo de Execução (Junie)
1. Identificar o Controller e as rotas da nova funcionalidade.
2. Identificar se requer autenticação ou privilégios de admin.
3. Gerar o arquivo de teste seguindo as regras acima.
4. Executar o teste com `docker exec zenspa-api php artisan test --filter=[Nome]Test`.
5. Corrigir eventuais falhas até que todos os testes passem.
