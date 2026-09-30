<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_update_profile()
    {
        $response = $this->putJson('/api/user', [
            'name' => 'New Name'
        ]);
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_update_profile()
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com'
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/user', [
                'name' => 'New Name',
                'email' => 'new@example.com'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@example.com'
        ]);
    }

    public function test_user_cannot_update_profile_with_existing_email()
    {
        $otherUser = User::factory()->create(['email' => 'other@example.com']);
        $user = User::factory()->create(['email' => 'user@example.com']);

        $response = $this->actingAs($user)
            ->putJson('/api/user', [
                'email' => 'other@example.com'
            ]);

        $response->assertStatus(422);
    }
}
