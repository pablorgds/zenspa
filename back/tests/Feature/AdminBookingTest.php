<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBookingTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected $user;

    protected $professional;

    protected $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['is_admin' => true]);
        $this->user = User::factory()->create();
        $this->professional = Professional::factory()->create();
        $this->service = Service::factory()->create();
    }

    public function test_admin_can_list_all_bookings()
    {
        Booking::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/bookings');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_admin_can_filter_bookings_by_professional()
    {
        $otherPro = Professional::factory()->create();

        Booking::factory()->create([
            'professional_id' => $this->professional->id,
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
        ]);

        Booking::factory()->create([
            'professional_id' => $otherPro->id,
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/bookings?professional_id={$this->professional->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.professional_id', $this->professional->id);
    }

    public function test_admin_can_reschedule_booking()
    {
        $this->service->update(['duration_minutes' => 60]);

        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
            'date' => '2026-03-20',
            'time' => '10:00',
        ]);

        Availability::create([
            'professional_id' => $this->professional->id,
            'day_of_week' => (string) Carbon::parse('2026-03-21')->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'date' => '2026-03-21',
                'time' => '11:00',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'date' => '2026-03-21',
            'time' => '11:00',
        ]);
    }

    public function test_admin_can_change_booking_status()
    {
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
            'status' => Booking::STATUS_PENDING,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/admin/bookings/{$booking->id}", [
                'status' => Booking::STATUS_CONFIRMED,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => Booking::STATUS_CONFIRMED,
        ]);
    }

    public function test_admin_can_cancel_booking()
    {
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
            'status' => Booking::STATUS_CONFIRMED,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/bookings/{$booking->id}/cancel");

        $response->assertStatus(200);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => Booking::STATUS_CANCELLED,
        ]);
    }

    public function test_admin_can_delete_booking()
    {
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/bookings/{$booking->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('bookings', [
            'id' => $booking->id,
        ]);
    }

    public function test_non_admin_cannot_access_admin_booking_routes()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/admin/bookings');

        $response->assertStatus(403);
    }
}
