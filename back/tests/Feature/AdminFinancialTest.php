<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFinancialTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): string
    {
        $admin = User::factory()->create(['is_admin' => true]);
        return $this->postJson('/api/login', [
            'email'    => $admin->email,
            'password' => 'password',
        ])->json('access_token');
    }

    private function userToken(): string
    {
        $user = User::factory()->create(['is_admin' => false]);
        return $this->postJson('/api/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->json('access_token');
    }

    public function test_unauthenticated_cannot_access_financial_summary()
    {
        $this->getJson('/api/admin/financial/summary')
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_access_financial_summary()
    {
        $token = $this->userToken();
        $this->withToken($token)
            ->getJson('/api/admin/financial/summary')
            ->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_transactions()
    {
        $this->getJson('/api/admin/financial/transactions')
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_access_transactions()
    {
        $token = $this->userToken();
        $this->withToken($token)
            ->getJson('/api/admin/financial/transactions')
            ->assertStatus(403);
    }

    public function test_admin_can_get_daily_summary()
    {
        $token = $this->adminToken();
        $this->withToken($token)
            ->getJson('/api/admin/financial/summary?period=daily')
            ->assertStatus(200)
            ->assertJsonStructure(['period', 'revenue', 'bookings_count', 'total_revenue', 'total_bookings']);
    }

    public function test_admin_can_get_monthly_summary()
    {
        $token = $this->adminToken();
        $this->withToken($token)
            ->getJson('/api/admin/financial/summary?period=monthly')
            ->assertStatus(200)
            ->assertJsonFragment(['period' => 'monthly']);
    }

    public function test_admin_can_list_transactions_paginated()
    {
        $token = $this->adminToken();
        $this->withToken($token)
            ->getJson('/api/admin/financial/transactions')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'per_page', 'current_page']);
    }

    public function test_booking_creation_generates_transaction()
    {
        $user = User::factory()->create(['is_admin' => false]);
        $token = $this->postJson('/api/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->json('access_token');

        $service      = Service::factory()->create(['price' => 150.00]);
        $professional = Professional::factory()->create();
        $nextMonday   = Carbon::now()->next(Carbon::MONDAY);

        Availability::create([
            'professional_id' => $professional->id,
            'day_of_week'     => $nextMonday->dayOfWeek,
            'start_time'      => '09:00:00',
            'end_time'        => '18:00:00',
            'slot_duration'   => 60,
        ]);

        $this->withToken($token)
            ->postJson('/api/bookings', [
                'service_id'      => $service->id,
                'professional_id' => $professional->id,
                'date'            => $nextMonday->toDateString(),
                'time'            => '10:00',
                'payment_method'  => 'pix',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('transactions', [
            'amount' => 150.00,
            'type'   => 'entrada',
        ]);
    }

    public function test_summary_totals_reflect_existing_transactions()
    {
        $booking = Booking::factory()->create(['price' => 200.00]);
        Transaction::create([
            'booking_id'  => $booking->id,
            'amount'      => 200.00,
            'type'        => 'entrada',
            'description' => "Agendamento #{$booking->id}",
        ]);

        $token = $this->adminToken();
        $res = $this->withToken($token)
            ->getJson('/api/admin/financial/summary?period=daily')
            ->assertStatus(200);

        $this->assertEquals(200.00, $res->json('total_revenue'));
    }
}
