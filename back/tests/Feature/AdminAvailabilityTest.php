<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Professional;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function user(): User
    {
        return User::factory()->create(['is_admin' => false]);
    }

    private function professional(): Professional
    {
        return Professional::factory()->create();
    }

    private function availability(Professional $pro): Availability
    {
        return Availability::create([
            'professional_id' => $pro->id,
            'day_of_week'     => 1,
            'start_time'      => '09:00',
            'end_time'        => '18:00',
            'slot_duration'   => 60,
        ]);
    }

    // --- Authentication ---

    public function test_unauthenticated_cannot_list_availabilities()
    {
        $pro = $this->professional();
        $this->getJson("/api/admin/professionals/{$pro->id}/availabilities")
            ->assertStatus(401);
    }

    public function test_unauthenticated_cannot_create_availability()
    {
        $pro = $this->professional();
        $this->postJson("/api/admin/professionals/{$pro->id}/availabilities", [])
            ->assertStatus(401);
    }

    // --- Authorization ---

    public function test_non_admin_cannot_list_availabilities()
    {
        $pro = $this->professional();
        $this->actingAs($this->user())
            ->getJson("/api/admin/professionals/{$pro->id}/availabilities")
            ->assertStatus(403);
    }

    public function test_non_admin_cannot_create_availability()
    {
        $pro = $this->professional();
        $this->actingAs($this->user())
            ->postJson("/api/admin/professionals/{$pro->id}/availabilities", [
                'day_of_week'   => 1,
                'start_time'    => '09:00',
                'end_time'      => '18:00',
                'slot_duration' => 60,
            ])
            ->assertStatus(403);
    }

    // --- Happy path ---

    public function test_admin_can_list_availabilities()
    {
        $pro = $this->professional();
        $this->availability($pro);

        $this->actingAs($this->admin())
            ->getJson("/api/admin/professionals/{$pro->id}/availabilities")
            ->assertStatus(200)
            ->assertJsonStructure([['id', 'day_of_week', 'start_time', 'end_time', 'slot_duration']]);
    }

    public function test_admin_can_create_availability()
    {
        $pro = $this->professional();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/availabilities", [
                'day_of_week'   => 2,
                'start_time'    => '08:00',
                'end_time'      => '17:00',
                'slot_duration' => 60,
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['id', 'professional_id', 'day_of_week', 'start_time', 'end_time', 'slot_duration']);

        $this->assertDatabaseHas('availabilities', [
            'professional_id' => $pro->id,
            'day_of_week'     => 2,
            'start_time'      => '08:00:00',
            'end_time'        => '17:00:00',
            'slot_duration'   => 60,
        ]);
    }

    public function test_admin_can_update_availability()
    {
        $pro  = $this->professional();
        $avail = $this->availability($pro);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/professionals/{$pro->id}/availabilities/{$avail->id}", [
                'slot_duration' => 30,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['slot_duration' => 30]);

        $this->assertDatabaseHas('availabilities', ['id' => $avail->id, 'slot_duration' => 30]);
    }

    public function test_admin_can_delete_availability()
    {
        $pro   = $this->professional();
        $avail = $this->availability($pro);

        $this->actingAs($this->admin())
            ->deleteJson("/api/admin/professionals/{$pro->id}/availabilities/{$avail->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('availabilities', ['id' => $avail->id]);
    }

    public function test_cannot_update_availability_belonging_to_another_professional()
    {
        $pro1  = $this->professional();
        $pro2  = $this->professional();
        $avail = $this->availability($pro1);

        $this->actingAs($this->admin())
            ->putJson("/api/admin/professionals/{$pro2->id}/availabilities/{$avail->id}", [
                'slot_duration' => 30,
            ])
            ->assertStatus(404);
    }

    // --- Validation ---

    public function test_create_availability_requires_valid_time_range()
    {
        $pro = $this->professional();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/availabilities", [
                'day_of_week'   => 1,
                'start_time'    => '18:00',
                'end_time'      => '09:00',
                'slot_duration' => 60,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['end_time']);
    }

    public function test_create_availability_requires_all_fields()
    {
        $pro = $this->professional();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/professionals/{$pro->id}/availabilities", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['day_of_week', 'start_time', 'end_time', 'slot_duration']);
    }
}
