<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Block;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfessionalBlockSlotTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_day_block_hides_all_slots(): void
    {
        $pro = $this->mondayGrid('09:00:00', '18:00:00');
        Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 00:00:00',
            'ends_at' => '2026-10-06 00:00:00',
            'reason' => 'Folga',
        ]);

        $this->getJson("/api/professionals/{$pro->id}/slots?date=2026-10-05")
            ->assertOk()
            ->assertExactJson([]);
    }

    public function test_partial_block_keeps_11_and_14(): void
    {
        $pro = $this->mondayGrid('11:00:00', '15:00:00');
        Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Almoço',
        ]);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date=2026-10-05");

        $response->assertOk();
        $slots = $response->json();
        $this->assertContains('11:00', $slots);
        $this->assertContains('14:00', $slots);
        $this->assertNotContains('12:00', $slots);
        $this->assertNotContains('13:00', $slots);
    }

    public function test_agenda_free_slots_omit_partial_block(): void
    {
        $pro = $this->mondayGrid('11:00:00', '15:00:00');
        Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Almoço',
        ]);

        $response = $this->actingAs($this->admin())
            ->getJson("/api/admin/agenda?date=2026-10-05&professional_id={$pro->id}");

        $response->assertOk();
        $slots = $response->json('professionals.0.free_slots');
        $this->assertContains('11:00', $slots);
        $this->assertContains('14:00', $slots);
        $this->assertNotContains('12:00', $slots);
        $this->assertNotContains('13:00', $slots);
    }

    public function test_cancelled_booking_does_not_lift_block(): void
    {
        $pro = $this->mondayGrid('11:00:00', '15:00:00');
        Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => '2026-10-05 12:00:00',
            'ends_at' => '2026-10-05 14:00:00',
            'reason' => 'Almoço',
        ]);
        Booking::create([
            'user_id' => User::factory()->create()->id,
            'professional_id' => $pro->id,
            'service_id' => Service::factory()->create(['duration_minutes' => 60])->id,
            'date' => '2026-10-05',
            'time' => '12:00',
            'status' => Booking::STATUS_CANCELLED,
            'payment_method' => 'pix',
            'price' => 100,
        ]);

        $response = $this->actingAs($this->admin())
            ->getJson("/api/admin/agenda?date=2026-10-05&professional_id={$pro->id}");

        $response->assertOk();
        $this->assertNotContains('12:00', $response->json('professionals.0.free_slots'));
    }

    private function mondayGrid(string $start, string $end): Professional
    {
        $pro = Professional::factory()->create();
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => '1',
            'start_time' => $start,
            'end_time' => $end,
            'slot_duration' => 60,
        ]);

        return $pro;
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }
}
