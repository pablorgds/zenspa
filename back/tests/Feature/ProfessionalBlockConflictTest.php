<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProfessionalBlockConflictTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_block_over_occupant_returns_ids(): void
    {
        $pro = Professional::factory()->create();
        $booking = $this->book($pro, '09:00', 60, Booking::STATUS_CONFIRMED);

        $response = $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 09:00:00',
                'ends_at' => '2026-10-05 10:00:00',
                'reason' => 'Folga',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Intervalo com agendamento ativo.')
            ->assertJsonPath('booking_ids', [$booking->id]);

        $this->assertSame(0, Block::query()->count());
    }

    #[DataProvider('occupyingStatuses')]
    public function test_post_block_over_each_occupying_status(string $status): void
    {
        $pro = Professional::factory()->create();
        $booking = $this->book($pro, '09:00', 60, $status);

        $response = $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 09:00:00',
                'ends_at' => '2026-10-05 10:00:00',
                'reason' => 'Folga',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Intervalo com agendamento ativo.');
        $this->assertSame([$booking->id], $response->json('booking_ids'));
        $this->assertSame(0, Block::query()->count());
    }

    public static function occupyingStatuses(): array
    {
        return [
            'pendente' => [Booking::STATUS_PENDING],
            'confirmado' => [Booking::STATUS_CONFIRMED],
            'concluído' => [Booking::STATUS_COMPLETED],
        ];
    }

    public function test_post_block_over_cancelled_returns_201(): void
    {
        $pro = Professional::factory()->create();
        $this->book($pro, '09:00', 60, Booking::STATUS_CANCELLED);

        $response = $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 09:00:00',
                'ends_at' => '2026-10-05 10:00:00',
                'reason' => 'Folga',
            ]);

        $response->assertStatus(201);
        $this->assertSame(1, Block::query()->count());
    }

    public function test_put_block_onto_occupant_keeps_interval(): void
    {
        $pro = Professional::factory()->create();
        $booking = $this->book($pro, '09:00', 60, Booking::STATUS_CONFIRMED);
        $block = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 14:00:00',
            'ends_at' => '2026-10-05 16:00:00',
            'reason' => 'Folga',
        ]);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/professionals/{$pro->id}/blocks/{$block->id}", [
                'starts_at' => '2026-10-05 09:00:00',
                'ends_at' => '2026-10-05 10:00:00',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Intervalo com agendamento ativo.')
            ->assertJsonPath('booking_ids', [$booking->id]);

        $fresh = $block->fresh();
        $this->assertSame('2026-10-05 14:00:00', $fresh->starts_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-10-05 16:00:00', $fresh->ends_at->format('Y-m-d H:i:s'));
    }

    public function test_block_writes_do_not_change_booking_status(): void
    {
        $pro = Professional::factory()->create();
        $occupant = $this->book($pro, '09:00', 60, Booking::STATUS_PENDING);
        $free = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 14:00:00',
            'ends_at' => '2026-10-05 16:00:00',
            'reason' => 'Tarde',
        ]);
        $toDelete = Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-06 09:00:00',
            'ends_at' => '2026-10-06 10:00:00',
            'reason' => 'Outro dia',
        ]);
        $admin = $this->admin();

        $this->actingAs($admin)
            ->postJson("/api/admin/professionals/{$pro->id}/blocks", [
                'starts_at' => '2026-10-05 09:00:00',
                'ends_at' => '2026-10-05 10:00:00',
                'reason' => 'Folga',
            ])
            ->assertStatus(422);

        $this->actingAs($admin)
            ->putJson("/api/admin/professionals/{$pro->id}/blocks/{$free->id}", [
                'starts_at' => '2026-10-05 09:00:00',
                'ends_at' => '2026-10-05 10:00:00',
            ])
            ->assertStatus(422);

        $this->actingAs($admin)
            ->deleteJson("/api/admin/professionals/{$pro->id}/blocks/{$toDelete->id}")
            ->assertStatus(204);

        $this->assertDatabaseHas('bookings', [
            'id' => $occupant->id,
            'status' => Booking::STATUS_PENDING,
        ]);
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function book(Professional $pro, string $time, int $duration, string $status): Booking
    {
        return Booking::create([
            'user_id' => User::factory()->create()->id,
            'professional_id' => $pro->id,
            'service_id' => Service::factory()->create(['duration_minutes' => $duration])->id,
            'date' => '2026-10-05',
            'time' => $time,
            'status' => $status,
            'payment_method' => 'pix',
            'price' => 100,
        ]);
    }
}
