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

class DayAgendaTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_agenda_lists_every_professional(): void
    {
        $this->professional('Ana');
        $this->professional('Bruno');

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk()->assertJsonPath('date', '2026-10-05');
        $rows = $response->json('professionals');
        $this->assertCount(Professional::query()->count(), $rows);
        foreach ($rows as $row) {
            $this->assertArrayHasKey('id', $row);
            $this->assertArrayHasKey('name', $row);
            $this->assertArrayHasKey('bookings', $row);
            $this->assertArrayHasKey('free_slots', $row);
        }
    }

    public function test_agenda_filters_one_professional(): void
    {
        $ana = $this->professional('Ana');
        $this->professional('Bruno');

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05&professional_id='.$ana->id);

        $response->assertOk();
        $this->assertCount(1, $response->json('professionals'));
        $this->assertSame($ana->id, $response->json('professionals.0.id'));
    }

    public function test_agenda_orders_ana_before_bruno(): void
    {
        $this->professional('Bruno');
        $this->professional('Ana');

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk();
        $this->assertSame(
            ['Ana', 'Bruno'],
            array_column($response->json('professionals'), 'name')
        );
    }

    public function test_agenda_includes_professional_without_availability(): void
    {
        $pro = $this->professional('Sem grade');

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk();
        $row = collect($response->json('professionals'))->firstWhere('id', $pro->id);
        $this->assertNotNull($row);
        $this->assertSame([], $row['bookings']);
        $this->assertSame([], $row['free_slots']);
    }

    #[DataProvider('occupyingStatuses')]
    public function test_agenda_lists_occupying_bookings_by_time(string $status): void
    {
        $pro = $this->professional('Ana');
        $this->booking($pro, '11:00', $status);
        $early = $this->booking($pro, '09:00', $status);

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk();
        $bookings = $response->json('professionals.0.bookings');
        $this->assertSame(['09:00', '11:00'], array_column($bookings, 'time'));
        $this->assertSame($early->id, $bookings[0]['id']);
        $this->assertSame($status, $bookings[0]['status']);
        $this->assertNotNull($bookings[0]['user']);
        $this->assertNotNull($bookings[0]['service']);
        $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $bookings[0]['time']);
        $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $bookings[1]['time']);
    }

    public function test_agenda_omits_cancelled_booking(): void
    {
        $pro = $this->professional('Ana');
        $this->booking($pro, '09:00', Booking::STATUS_CANCELLED);

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk();
        $this->assertSame([], $response->json('professionals.0.bookings'));
    }

    public function test_agenda_free_slots_skip_cancel_and_overlap(): void
    {
        Carbon::setTestNow('2026-10-05 08:00:00');
        $pro = $this->professional('Ana');
        $this->window($pro, '2026-10-05');
        $this->booking($pro, '09:00', Booking::STATUS_CANCELLED, 60);
        $this->booking($pro, '14:00', Booking::STATUS_PENDING, 120);

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk();
        $slots = $response->json('professionals.0.free_slots');
        $this->assertContains('09:00', $slots);
        $this->assertContains('16:00', $slots);
        $this->assertNotContains('14:00', $slots);
        $this->assertNotContains('15:00', $slots);
    }

    public function test_agenda_omits_past_grid_point_today(): void
    {
        Carbon::setTestNow('2026-10-05 15:00:00');
        $pro = $this->professional('Ana');
        $this->window($pro, '2026-10-05');

        $response = $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05');

        $response->assertOk();
        $slots = $response->json('professionals.0.free_slots');
        $this->assertNotContains('14:00', $slots);
        $this->assertContains('15:00', $slots);
    }

    public function test_agenda_past_date_is_200(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2020-01-06')
            ->assertOk();
    }

    public function test_agenda_without_date_is_422(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Data inválida.');
    }

    public function test_agenda_invalid_date_is_422(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-13-40')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Data inválida.');
    }

    public function test_agenda_missing_professional_is_404(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/agenda?date=2026-10-05&professional_id=999999')
            ->assertNotFound();
    }

    public function test_guest_get_agenda_is_401(): void
    {
        $this->getJson('/api/admin/agenda?date=2026-10-05')->assertUnauthorized();
    }

    public function test_non_admin_get_agenda_is_403(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)
            ->getJson('/api/admin/agenda?date=2026-10-05')
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

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function professional(string $name): Professional
    {
        return Professional::factory()->create(['name' => $name]);
    }

    private function window(Professional $pro, string $date): void
    {
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse($date)->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);
    }

    private function booking(Professional $pro, string $time, string $status, int $duration = 60): Booking
    {
        return Booking::create([
            'user_id' => User::factory()->create()->id,
            'professional_id' => $pro->id,
            'service_id' => Service::factory()->create(['duration_minutes' => $duration])->id,
            'date' => '2026-10-05',
            'time' => $time,
            'status' => $status,
            'payment_method' => 'pix',
            'price' => 100,
        ]);
    }
}
