<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Professional;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_routes()
    {
        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->actingAs($user)
            ->getJson('/api/admin/professionals');

        $response->assertStatus(405);
    }

    public function test_admin_can_access_admin_routes()
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/professionals', [
                'name' => 'Admin Pro',
                'role' => 'Expert',
                'specialties' => ['Deep Tissue'],
                'rating' => 5.0
            ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_create_professional()
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/professionals', [
                'name' => 'New Pro',
                'role' => 'Expert',
                'specialties' => ['Deep Tissue'],
                'rating' => 5.0
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('professionals', ['name' => 'New Pro']);
    }
}
