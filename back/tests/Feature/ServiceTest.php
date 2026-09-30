<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_manage_services()
    {
        // Unauthenticated access to admin endpoints (POST/PUT/DELETE)
        $this->postJson('/api/admin/services', [])->assertStatus(401);
        $this->putJson('/api/admin/services/1', [])->assertStatus(401);
        $this->deleteJson('/api/admin/services/1')->assertStatus(401);
    }

    public function test_non_admin_user_cannot_manage_services()
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->postJson('/api/admin/services', [
            'name' => 'Test Service',
            'tag' => 'Test',
            'description' => 'Test Desc',
            'duration_minutes' => 60,
            'price' => 100
        ])->assertStatus(403);
    }

    public function test_admin_can_create_service()
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->postJson('/api/admin/services', [
            'name' => 'Aromatherapy',
            'tag' => 'Relax',
            'description' => 'Essential oils massage',
            'duration_minutes' => 60,
            'price' => 150.00
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('services', [
            'name' => 'Aromatherapy',
            'price' => 150.00
        ]);
    }

    public function test_admin_can_update_service()
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $service = Service::create([
            'name' => 'Old Name',
            'tag' => 'Old Tag',
            'description' => 'Old Desc',
            'duration_minutes' => 30,
            'price' => 50
        ]);

        $response = $this->actingAs($admin)->putJson("/api/admin/services/{$service->id}", [
            'name' => 'New Name',
            'price' => 75.00
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'name' => 'New Name',
            'price' => 75.00
        ]);
    }

    public function test_admin_can_delete_service()
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $service = Service::create([
            'name' => 'To Delete',
            'tag' => 'Tag',
            'description' => 'Desc',
            'duration_minutes' => 30,
            'price' => 50
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/services/{$service->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_anyone_can_list_services()
    {
        Service::create([
            'name' => 'Public Service',
            'tag' => 'Tag',
            'description' => 'Desc',
            'duration_minutes' => 30,
            'price' => 50
        ]);

        $response = $this->getJson('/api/services');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }
}
