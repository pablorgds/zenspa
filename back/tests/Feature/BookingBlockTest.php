<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Block;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingBlockTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_post_on_block_is_422(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->block($pro, $date.' 12:00:00', $date.' 14:00:00');
        $before = Booking::query()->count();

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '12:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário bloqueado.');

        $this->assertSame($before, Booking::query()->count());
    }

    public function test_admin_post_on_block_is_422(): void
    {
        $client = User::factory()->create();
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->block($pro, $date.' 12:00:00', $date.' 14:00:00');
        $before = Booking::query()->count();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', [
                'user_id' => $client->id,
                'service_id' => $service->id,
                'professional_id' => $pro->id,
                'date' => $date,
                'time' => '12:00',
                'payment_method' => 'pix',
                'status' => 'pendente',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário bloqueado.');

        $this->assertSame($before, Booking::query()->count());
        unset($user);
    }

    public function test_admin_put_onto_block_keeps_previous_slot(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $booking = $this->book($pro, $service, $date, '09:00', Booking::STATUS_PENDING);
        $this->block($pro, $date.' 12:00:00', $date.' 14:00:00');

        $this->actingAs($this->admin())
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'time' => '12:00',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário bloqueado.');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'professional_id' => $pro->id,
            'date' => $date,
            'time' => '09:00',
        ]);
        unset($user);
    }

    public function test_admin_status_put_on_blocked_booking_is_200(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $booking = $this->book($pro, $service, $date, '12:00', Booking::STATUS_PENDING);
        $this->block($pro, $date.' 12:00:00', $date.' 14:00:00');

        $this->actingAs($this->admin())
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'status' => Booking::STATUS_CONFIRMED,
            ])
            ->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => Booking::STATUS_CONFIRMED,
        ]);
        unset($user);
    }

    public function test_client_post_120_crossing_block_is_422(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(120);
        $this->block($pro, $date.' 10:00:00', $date.' 11:00:00');

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '09:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário bloqueado.');
    }

    public function test_client_post_beside_block_returns_201(): void
    {
        [$user, $pro, $service, $date] = $this->openDay(60);
        $this->block($pro, $date.' 12:00:00', $date.' 14:00:00');

        $this->actingAs($user)
            ->postJson('/api/bookings', $this->payload($service, $pro, $date, '09:00'))
            ->assertStatus(201);
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function openDay(int $duration): array
    {
        $date = Carbon::now()->addDays(30)->toDateString();
        $user = User::factory()->create();
        $pro = Professional::factory()->create();
        $service = Service::factory()->create(['duration_minutes' => $duration]);
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse($date)->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);

        return [$user, $pro, $service, $date];
    }

    private function block(Professional $pro, string $starts, string $ends): void
    {
        Block::query()->create([
            'professional_id' => $pro->id,
            'starts_at' => $starts,
            'ends_at' => $ends,
            'reason' => 'Folga',
        ]);
    }

    private function book(Professional $pro, Service $service, string $date, string $time, string $status): Booking
    {
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
