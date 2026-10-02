<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Professional;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalBlockTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_post_block_returns_201(): void
    {
        $pro = Professional::factory()->create();

        $response = $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 12:00:00',
                'ends_at' => '2026-10-05 14:00:00',
                'reason' => 'Folga',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('professional_id', $pro->id)
            ->assertJsonPath('reason', 'Folga');

        $this->assertDatabaseHas('blocks', [
            'professional_id' => $pro->id,
            'reason' => 'Folga',
        ]);
        $this->assertSame('2026-10-05 12:00:00', Block::query()->first()->starts_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-10-05 14:00:00', Block::query()->first()->ends_at->format('Y-m-d H:i:s'));
    }

    public function test_admin_lists_blocks_by_starts_at(): void
    {
        $pro = Professional::factory()->create();
        $later = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 14:00:00',
            'ends_at' => '2026-10-05 16:00:00',
            'reason' => 'Tarde',
        ]);
        $earlier = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 09:00:00',
            'ends_at' => '2026-10-05 11:00:00',
            'reason' => 'Manhã',
        ]);

        $response = $this->actingAs($this->admin())
            ->getJson("/api/admin/professionals/{$pro->id}/blocks");

        $response->assertOk();
        $rows = $response->json();
        $this->assertCount(2, $rows);
        foreach ($rows as $row) {
            $this->assertArrayHasKey('id', $row);
            $this->assertArrayHasKey('professional_id', $row);
            $this->assertArrayHasKey('starts_at', $row);
            $this->assertArrayHasKey('ends_at', $row);
            $this->assertArrayHasKey('reason', $row);
        }
        $this->assertSame($earlier->id, $rows[0]['id']);
        $this->assertSame($later->id, $rows[1]['id']);
        $this->assertTrue($rows[0]['starts_at'] < $rows[1]['starts_at']);
    }

    public function test_admin_put_block_reason(): void
    {
        $pro = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);

        $response = $this->actingAs($this->admin())
            ->putJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}", [
                'reason' => 'Consulta médica',
            ]);

        $response->assertOk()->assertJsonPath('reason', 'Consulta médica');
        $this->assertDatabaseHas('blocks', [
            'id' => $block->id,
            'reason' => 'Consulta médica',
        ]);
    }

    public function test_admin_delete_block_is_204(): void
    {
        $pro = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);

        $this->actingAs($this->admin())
            ->deleteJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('blocks', ['id' => $block->id]);
    }

    public function test_admin_post_block_equal_bounds_is_422(): void
    {
        $pro = Professional::factory()->create();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 12:00:00',
                'ends_at' => '2026-10-05 12:00:00',
                'reason' => 'Folga',
            ])
            ->assertStatus(422);

        $this->assertSame(0, Block::query()->count());
    }

    public function test_admin_put_block_equal_bounds_is_422(): void
    {
        $pro = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}", [
                'starts_at' => '2026-10-05 12:00:00',
                'ends_at' => '2026-10-05 12:00:00',
            ])
            ->assertStatus(422);

        $this->assertSame('2026-10-05 14:00:00', $block->fresh()->ends_at->format('Y-m-d H:i:s'));
    }

    public function test_admin_post_block_empty_reason_is_422(): void
    {
        $pro = Professional::factory()->create();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 12:00:00',
                'ends_at' => '2026-10-05 14:00:00',
                'reason' => '',
            ])
            ->assertStatus(422);

        $this->assertSame(0, Block::query()->count());
    }

    public function test_missing_professional_blocks_are_404(): void
    {
        $admin = $this->admin();
        $payload = [
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ];

        $this->actingAs($admin)->getJson('/api/admin/professionals/999999/blocks')->assertNotFound();
        $this->actingAs($admin)->postJson('/api/admin/professionals/999999/blocks', $payload)->assertNotFound();
        $this->actingAs($admin)->putJson('/api/admin/professionals/999999/blocks/1', $payload)->assertNotFound();
        $this->actingAs($admin)->deleteJson('/api/admin/professionals/999999/blocks/1')->assertNotFound();
    }

    public function test_put_block_of_other_professional_is_404(): void
    {
        $owner = Professional::factory()->create();
        $other = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $owner->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/professionals/{$other->id}/blocks/{$block->id}", [
                'reason' => 'Consulta médica',
            ])
            ->assertNotFound();
    }

    public function test_delete_block_of_other_professional_is_404(): void
    {
        $owner = Professional::factory()->create();
        $other = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $owner->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);

        $this->actingAs($this->admin())
            ->deleteJson("/api/admin/professionals/{$other->id}/blocks/{$block->id}")
            ->assertNotFound();
    }

    public function test_guest_block_routes_are_401(): void
    {
        $pro = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);
        $payload = [
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ];

        $this->getJson("/api/admin/professionals/{$pro->id}/blocks")->assertUnauthorized();
        $this->postJson("/api/admin/professionals/{$pro->id}/blocks", $payload)->assertUnauthorized();
        $this->putJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}", $payload)->assertUnauthorized();
        $this->deleteJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}")->assertUnauthorized();
    }

    public function test_non_admin_block_routes_are_403(): void
    {
        $pro = Professional::factory()->create();
        $block = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Folga',
        ]);
        $user = User::factory()->create(['is_admin' => false]);
        $payload = [
            'starts_at' => '2026-10-06 12:00:00',
            'ends_at' => '2026-10-06 14:00:00',
            'reason' => 'Folga',
        ];

        $this->actingAs($user)->getJson("/api/admin/professionals/{$pro->id}/blocks")->assertForbidden();
        $this->actingAs($user)->postJson("/api/admin/professionals/{$pro->id}/blocks", $payload)->assertForbidden();
        $this->actingAs($user)->putJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}", $payload)->assertForbidden();
        $this->actingAs($user)->deleteJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}")->assertForbidden();

        $this->assertSame(1, Block::query()->count());
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }
}
