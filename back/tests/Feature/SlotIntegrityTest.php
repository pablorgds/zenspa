<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SlotIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_cancelled_booking_time_is_listed(): void
    {
        [$pro, $date] = $this->grid('09:00:00', '11:00:00');
        $this->book($pro, '09:00', 60, Booking::STATUS_CANCELLED, $date);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date={$date}");

        $response->assertOk();
        $this->assertContains('09:00', $response->json());
    }

    public function test_one_hundred_twenty_minutes_hides_09_and_10(): void
    {
        [$pro, $date] = $this->grid('09:00:00', '12:00:00');
        $this->book($pro, '09:00', 120, Booking::STATUS_PENDING, $date);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date={$date}");

        $response->assertOk();
        $this->assertNotContains('09:00', $response->json());
        $this->assertNotContains('10:00', $response->json());
    }

    public function test_one_hundred_twenty_minutes_keeps_11(): void
    {
        [$pro, $date] = $this->grid('09:00:00', '12:00:00');
        $this->book($pro, '09:00', 120, Booking::STATUS_PENDING, $date);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date={$date}");

        $response->assertOk();
        $this->assertContains('11:00', $response->json());
    }

    public function test_past_grid_point_on_today_is_omitted(): void
    {
        Carbon::setTestNow('2026-09-30 15:00:00');
        $pro = Professional::factory()->create();
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse('2026-09-30')->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date=2026-09-30");

        $response->assertOk();
        $this->assertNotContains('14:00', $response->json());
        $this->assertContains('15:00', $response->json());
    }

    #[DataProvider('occupyingStatuses')]
    public function test_occupying_status_hides_grid_point(string $status): void
    {
        [$pro, $date] = $this->grid('09:00:00', '12:00:00');
        $this->book($pro, '09:00', 120, $status, $date);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date={$date}");

        $response->assertOk()->assertExactJson(['11:00']);
    }

    public function test_english_confirmed_status_does_not_occupy(): void
    {
        [$pro, $date] = $this->grid('09:00:00', '11:00:00');
        $this->book($pro, '09:00', 60, 'confirmed', $date);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date={$date}");

        $response->assertOk();
        $this->assertContains('09:00', $response->json());
    }

    public function test_slots_without_date_are_400(): void
    {
        $pro = Professional::factory()->create();

        $this->getJson("/api/professionals/{$pro->id}/slots")
            ->assertStatus(400)
            ->assertJsonPath('message', 'Date is required');
    }

    public function test_slots_for_missing_professional_are_404(): void
    {
        $this->getJson('/api/professionals/999999/slots?date=2026-10-05')
            ->assertNotFound();
    }

    public function test_overlapping_post_returns_reserved_message(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->book($pro, '09:00', 120, Booking::STATUS_CONFIRMED, $date);

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '10:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário já reservado.');
    }

    public function test_overlapping_post_inserts_nothing(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->book($pro, '09:00', 120, Booking::STATUS_PENDING, $date);

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '10:00'))
            ->assertStatus(422);

        $this->assertSame(1, Booking::query()->where('professional_id', $pro->id)->count());
    }

    public function test_past_time_today_is_rejected(): void
    {
        Carbon::setTestNow('2026-09-30 15:00:00');
        [$user, $pro, $service] = $this->openDayOn('2026-09-30', 60);

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, '2026-09-30', '14:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário já passou.');
    }

    public function test_interval_outside_one_window_is_rejected(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(120, '09:00:00', '10:00:00');

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '09:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário fora da disponibilidade do profissional.');
    }

    public function test_free_interval_returns_201(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '09:00'))
            ->assertStatus(201);
    }

    public function test_post_on_cancelled_time_returns_201(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->book($pro, '09:00', 60, Booking::STATUS_CANCELLED, $date);

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '09:00'))
            ->assertStatus(201);
    }

    public function test_post_on_english_confirmed_returns_201(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->book($pro, '09:00', 60, 'confirmed', $date);

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '09:00'))
            ->assertStatus(201);
    }

    public function test_guest_post_booking_is_401(): void
    {
        $this->postJson('/api/bookings', [])->assertUnauthorized();
    }

    public function test_admin_reschedule_onto_occupant_keeps_previous_slot(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        [$pro, $date] = $this->window();
        $occupant = Service::factory()->create(['duration_minutes' => 120]);
        $moved = Service::factory()->create(['duration_minutes' => 60]);
        $this->book($pro, '09:00', 120, Booking::STATUS_CONFIRMED, $date, $occupant);
        $booking = $this->book($pro, '14:00', 60, Booking::STATUS_PENDING, $date, $moved);

        $this->actingAs($admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'time' => '10:00',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário já reservado.');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'professional_id' => $pro->id,
            'date' => $date,
            'time' => '14:00',
        ]);
    }

    public function test_admin_reschedule_outside_window_keeps_previous_slot(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        [$pro, $date] = $this->window();
        $booking = $this->book($pro, '14:00', 60, Booking::STATUS_PENDING, $date);

        $this->actingAs($admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'time' => '07:00',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário fora da disponibilidade do profissional.');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'professional_id' => $pro->id,
            'date' => $date,
            'time' => '14:00',
        ]);
    }

    public function test_admin_status_only_update_returns_200_without_window(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $booking = $this->book(Professional::factory()->create(), '09:00', 60, Booking::STATUS_PENDING, '2026-10-05');

        $this->assertSame(0, Availability::query()->count());

        $this->actingAs($admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'status' => Booking::STATUS_CONFIRMED,
            ])
            ->assertOk();
    }

    public function test_admin_put_own_interval_returns_200(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $pro = Professional::factory()->create();
        $booking = $this->book($pro, '09:00', 60, Booking::STATUS_PENDING, '2026-10-05');

        $this->actingAs($admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'professional_id' => $pro->id,
                'date' => '2026-10-05',
                'time' => '09:00',
            ])
            ->assertOk();
    }

    public function test_admin_may_save_past_time_today(): void
    {
        Carbon::setTestNow('2026-09-30 15:00:00');
        $admin = User::factory()->create(['is_admin' => true]);
        $pro = Professional::factory()->create();
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse('2026-09-30')->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);
        $booking = $this->book($pro, '11:00', 60, Booking::STATUS_PENDING, '2026-10-05');

        $this->actingAs($admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'date' => '2026-09-30',
                'time' => '14:00',
            ])
            ->assertOk();
    }

    public function test_admin_time_must_match_hi(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $booking = $this->book(Professional::factory()->create(), '09:00', 60, Booking::STATUS_PENDING, '2026-10-05');

        $this->actingAs($admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'time' => '9am',
            ])
            ->assertStatus(422);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'time' => '09:00',
        ]);
    }

    public function test_guest_put_admin_booking_is_401(): void
    {
        $this->putJson('/api/admin/bookings/1', ['status' => 'confirmado'])
            ->assertUnauthorized();
    }

    public function test_non_admin_put_booking_is_403(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $booking = $this->book(Professional::factory()->create(), '09:00', 60, Booking::STATUS_PENDING, '2026-10-05');

        $this->actingAs($user)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'status' => Booking::STATUS_CANCELLED,
            ])
            ->assertForbidden();
    }

    public static function occupyingStatuses(): array
    {
        return [
            'pendente' => [Booking::STATUS_PENDING],
            'confirmado' => [Booking::STATUS_CONFIRMED],
            'concluído' => [Booking::STATUS_COMPLETED],
        ];
    }

    private function futureDate(): string
    {
        $date = Carbon::now()->next(Carbon::MONDAY);
        if ($date->isSameDay(Carbon::now())) {
            $date->addWeek();
        }

        return $date->toDateString();
    }

    private function grid(string $start, string $end): array
    {
        $date = $this->futureDate();
        $pro = Professional::factory()->create();
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse($date)->dayOfWeek,
            'start_time' => $start,
            'end_time' => $end,
            'slot_duration' => 60,
        ]);

        return [$pro, $date];
    }

    private function window(): array
    {
        return $this->grid('09:00:00', '18:00:00');
    }

    private function openDay(int $duration, string $start = '09:00:00', string $end = '18:00:00'): array
    {
        $date = $this->futureDate();

        return array_merge($this->openDayOn($date, $duration, $start, $end), [$date]);
    }

    private function openDayOn(string $date, int $duration, string $start = '09:00:00', string $end = '18:00:00'): array
    {
        $user = User::factory()->create();
        $pro = Professional::factory()->create();
        $service = Service::factory()->create(['duration_minutes' => $duration]);
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse($date)->dayOfWeek,
            'start_time' => $start,
            'end_time' => $end,
            'slot_duration' => 60,
        ]);

        return [$user, $pro, $service];
    }

    private function book(Professional $pro, string $time, int $duration, string $status, string $date, ?Service $service = null): Booking
    {
        $service ??= Service::factory()->create(['duration_minutes' => $duration]);

        return Booking::create([
            'user_id' => User::factory()->create()->id,
            'professional_id' => $pro->id,
            'service_id' => $service->id,
            'date' => $date,
            'time' => $time,
            'status' => $status,
            'payment_method' => 'pix',
            'price' => 100,
        ]);
    }

    private function payload(Service $service, Professional $pro, string $date, string $time): array
    {
        return [
            'service_id' => $service->id,
            'professional_id' => $pro->id,
            'date' => $date,
            'time' => $time,
            'payment_method' => 'pix',
        ];
    }
}
