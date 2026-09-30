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
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AdminEncaixeTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_admin_post_for_other_user_returns_201(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00'))
            ->assertStatus(201)
            ->assertJsonPath('user_id', $client->id);
    }

    public function test_admin_post_stores_pendente(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00', [
                'status' => 'pendente',
            ]))
            ->assertStatus(201);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $client->id,
            'status' => 'pendente',
        ]);
    }

    public function test_admin_post_stores_confirmado(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00', [
                'status' => 'confirmado',
            ]))
            ->assertStatus(201);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $client->id,
            'status' => 'confirmado',
        ]);
    }

    public function test_admin_post_copies_service_price(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00'))
            ->assertStatus(201);

        $this->assertDatabaseHas('bookings', [
            'user_id' => $client->id,
            'price' => 150.00,
        ]);
    }

    public function test_admin_post_inserts_entrada(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00'))
            ->assertStatus(201);

        $booking = Booking::query()->where('user_id', $client->id)->first();
        $this->assertNotNull($booking);
        $this->assertSame(1, Transaction::query()->where('booking_id', $booking->id)->count());
        $this->assertDatabaseHas('transactions', [
            'booking_id' => $booking->id,
            'type' => 'entrada',
            'amount' => 150.00,
        ]);
    }

    public function test_admin_post_by_email_returns_201(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();
        $body = $this->body($client, $service, $pro, $date, '09:00');
        unset($body['user_id']);
        $body['email'] = $client->email;

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(201)
            ->assertJsonPath('user_id', $client->id);
    }

    public function test_admin_post_without_user_is_422(): void
    {
        [$pro, $service, $date] = $this->day();
        $body = $this->body(User::factory()->create(), $service, $pro, $date, '09:00');
        unset($body['user_id']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Informe o usuário.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_with_id_and_email_is_422(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();
        $body = $this->body($client, $service, $pro, $date, '09:00');
        $body['email'] = $client->email;

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Informe só o id ou o e-mail.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_unknown_user_id_is_422(): void
    {
        [$pro, $service, $date] = $this->day();
        $body = $this->body(User::factory()->create(), $service, $pro, $date, '09:00');
        $body['user_id'] = 999999;

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Usuário não encontrado.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_unknown_email_is_422(): void
    {
        [$pro, $service, $date] = $this->day();
        $body = $this->body(User::factory()->create(), $service, $pro, $date, '09:00');
        unset($body['user_id']);
        $body['email'] = 'ausente@example.com';

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Usuário não encontrado.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_rejects_cancelado(): void
    {
        $this->rejectStatus('cancelado');
    }

    public function test_admin_post_rejects_concluido(): void
    {
        $this->rejectStatus('concluído');
    }

    public function test_admin_post_rejects_absent_status(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();
        $body = $this->body($client, $service, $pro, $date, '09:00');
        unset($body['status']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Status inicial inválido.');

        $this->assertSame(0, Booking::query()->count());
    }

    #[DataProvider('paymentMethods')]
    public function test_admin_post_accepts_each_payment_method(string $method, string $time): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, $time, [
                'payment_method' => $method,
            ]))
            ->assertStatus(201);
    }

    public function test_admin_post_rejects_absent_payment(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();
        $body = $this->body($client, $service, $pro, $date, '09:00');
        unset($body['payment_method']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $body)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Forma de pagamento inválida.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_rejects_boleto(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00', [
                'payment_method' => 'boleto',
            ]))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Forma de pagamento inválida.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_overlap_is_422(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day(60);
        $this->occupant($pro, $date, '09:00', 120);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '10:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário já reservado.');

        $this->assertSame(1, Booking::query()->where('professional_id', $pro->id)->count());
    }

    public function test_admin_post_overlap_inserts_no_transaction(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day(60);
        $this->occupant($pro, $date, '09:00', 120);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '10:00'))
            ->assertStatus(422);

        $this->assertSame(0, Transaction::query()->count());
    }

    public function test_admin_post_outside_window_is_422(): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day(120, '09:00:00', '10:00:00');

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário fora da disponibilidade do profissional.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_past_time_today_is_422(): void
    {
        Carbon::setTestNow('2026-10-05 15:00:00');
        $client = User::factory()->create();
        [$pro, $service] = $this->dayOn('2026-10-05', 60);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, '2026-10-05', '14:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Horário já passou.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_admin_post_past_date_is_422(): void
    {
        Carbon::setTestNow('2026-10-05 15:00:00');
        $client = User::factory()->create();
        [$pro, $service] = $this->dayOn('2026-10-04', 60);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, '2026-10-04', '14:00'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Não é possível agendar em data passada.');

        $this->assertSame(0, Booking::query()->count());
    }

    public function test_guest_post_admin_booking_is_401(): void
    {
        $this->postJson('/api/admin/bookings', [])->assertUnauthorized();
    }

    public function test_non_admin_post_admin_booking_is_403(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($user)
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00'))
            ->assertForbidden();

        $this->assertSame(0, Booking::query()->count());
    }

    public static function paymentMethods(): array
    {
        return [
            'pix' => ['pix', '09:00'],
            'cartao_credito' => ['cartao_credito', '10:00'],
            'cartao_debito' => ['cartao_debito', '11:00'],
            'dinheiro' => ['dinheiro', '12:00'],
        ];
    }

    private function rejectStatus(string $status): void
    {
        $client = User::factory()->create();
        [$pro, $service, $date] = $this->day();

        $this->actingAs($this->admin())
            ->postJson('/api/admin/bookings', $this->body($client, $service, $pro, $date, '09:00', [
                'status' => $status,
            ]))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Status inicial inválido.');

        $this->assertSame(0, Booking::query()->count());
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function day(int $duration = 60, string $start = '09:00:00', string $end = '18:00:00'): array
    {
        $date = Carbon::now()->addDays(30)->toDateString();

        return array_merge($this->dayOn($date, $duration, $start, $end), [$date]);
    }

    private function dayOn(string $date, int $duration, string $start = '09:00:00', string $end = '18:00:00'): array
    {
        $pro = Professional::factory()->create();
        $service = Service::factory()->create([
            'duration_minutes' => $duration,
            'price' => 150.00,
        ]);
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse($date)->dayOfWeek,
            'start_time' => $start,
            'end_time' => $end,
            'slot_duration' => 60,
        ]);

        return [$pro, $service];
    }

    private function occupant(Professional $pro, string $date, string $time, int $duration): void
    {
        Booking::create([
            'user_id' => User::factory()->create()->id,
            'professional_id' => $pro->id,
            'service_id' => Service::factory()->create(['duration_minutes' => $duration])->id,
            'date' => $date,
            'time' => $time,
            'status' => Booking::STATUS_CONFIRMED,
            'payment_method' => 'pix',
            'price' => 100,
        ]);
    }

    private function body(User $client, Service $service, Professional $pro, string $date, string $time, array $extra = []): array
    {
        return array_merge([
            'user_id' => $client->id,
            'service_id' => $service->id,
            'professional_id' => $pro->id,
            'date' => $date,
            'time' => $time,
            'payment_method' => 'pix',
            'status' => 'pendente',
        ], $extra);
    }
}
