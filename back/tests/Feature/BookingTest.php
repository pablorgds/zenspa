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

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_available_slots()
    {
        $pro = Professional::create([
            'name' => 'Test Pro',
            'role' => 'Specialist',
            'specialties' => ['Test'],
        ]);

        // Monday is day 1 in ProfessionalController (using Carbon dayOfWeek where 0 is Sunday, 1 is Monday)
        // Wait, Carbon dayOfWeek is 0 (Sun) to 6 (Sat).
        // My ProfessionalController uses $carbonDate->dayOfWeek;
        // 2026-03-16 is a Monday (day 1)
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => '1',
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'slot_duration' => 60,
        ]);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date=2026-03-16");

        $response->assertStatus(200)
            ->assertJson(['09:00', '10:00']);
    }

    public function test_booked_slots_are_not_available()
    {
        $user = User::factory()->create();
        $pro = Professional::create([
            'name' => 'Test Pro',
            'role' => 'Specialist',
            'specialties' => ['Test'],
        ]);
        $service = Service::create([
            'name' => 'Test Service',
            'tag' => 'Test',
            'description' => 'Test Description',
            'duration_minutes' => 60,
            'price' => 100,
        ]);

        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => '1',
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'slot_duration' => 60,
        ]);

        Booking::create([
            'user_id' => $user->id,
            'professional_id' => $pro->id,
            'service_id' => $service->id,
            'date' => '2026-03-16',
            'time' => '09:00',
            'status' => Booking::STATUS_CONFIRMED,
            'payment_method' => 'card',
            'price' => 100,
        ]);

        $response = $this->getJson("/api/professionals/{$pro->id}/slots?date=2026-03-16");

        $response->assertStatus(200)
            ->assertExactJson(['10:00']);
    }

    public function test_authenticated_user_can_create_booking()
    {
        $user = User::factory()->create();
        $pro = Professional::create([
            'name' => 'Test Pro',
            'role' => 'Specialist',
            'specialties' => ['Test'],
        ]);
        $service = Service::create([
            'name' => 'Test Service',
            'tag' => 'Test',
            'description' => 'Test Description',
            'duration_minutes' => 60,
            'price' => 100,
        ]);

        // Próxima segunda-feira garante data futura e dia conhecido (1)
        $date = Carbon::now()->next(Carbon::MONDAY)->toDateString();

        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => Carbon::MONDAY,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/bookings', [
                'service_id' => $service->id,
                'professional_id' => $pro->id,
                'date' => $date,
                'time' => '09:00',
                'payment_method' => 'pix',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'time' => '09:00',
        ]);
    }
}
