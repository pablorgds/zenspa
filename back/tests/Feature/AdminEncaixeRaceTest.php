<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use App\Services\SlotOccupancy;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class AdminEncaixeRaceTest extends TestCase
{
    private string $database;

    private string $raceDir;

    protected function setUp(): void
    {
        parent::setUp();

        $this->database = '/tmp/zenspa-admin-race-'.getmypid().'.sqlite';
        $this->raceDir = '/tmp/zenspa-admin-race-'.getmypid();

        if (file_exists($this->database)) {
            unlink($this->database);
        }
        if (is_dir($this->raceDir)) {
            array_map('unlink', glob($this->raceDir.'/*') ?: []);
            rmdir($this->raceDir);
        }

        touch($this->database);
        mkdir($this->raceDir);

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', $this->database);
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->artisan('migrate', ['--force' => true]);
    }

    protected function tearDown(): void
    {
        DB::disconnect('sqlite');
        if (file_exists($this->database)) {
            unlink($this->database);
        }
        if (is_dir($this->raceDir)) {
            array_map('unlink', glob($this->raceDir.'/*') ?: []);
            rmdir($this->raceDir);
        }

        parent::tearDown();
    }

    public function test_admin_post_race_persists_one(): void
    {
        $date = Carbon::now()->addDays(21)->toDateString();
        $pro = Professional::factory()->create();
        $service = Service::factory()->create(['duration_minutes' => 120]);
        Availability::create([
            'professional_id' => $pro->id,
            'day_of_week' => (string) Carbon::parse($date)->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'slot_duration' => 60,
        ]);
        $admin = User::factory()->create(['is_admin' => true]);
        $client = User::factory()->create();

        $first = $this->spawn('a', $admin, $client, $service, $pro, $date, '09:00');
        $second = $this->spawn('b', $admin, $client, $service, $pro, $date, '10:00');

        DB::disconnect('sqlite');
        $first->start();
        $second->start();
        $first->wait();
        $second->wait();

        DB::reconnect('sqlite');

        $results = [
            $this->readResult($this->raceDir.'/a.json'),
            $this->readResult($this->raceDir.'/b.json'),
        ];
        $detail = json_encode($results)."\n".$first->getErrorOutput().$second->getErrorOutput();

        $this->assertSame(0, $first->getExitCode(), $detail);
        $this->assertSame(0, $second->getExitCode(), $detail);

        $statuses = array_column($results, 'status');
        sort($statuses);
        $this->assertSame([201, 422], $statuses, $detail);

        $rejected = $results[0]['status'] === 422 ? $results[0] : $results[1];
        $this->assertSame('Horário já reservado.', $rejected['body']['message'] ?? null, $detail);
        $this->assertSame(1, Booking::query()
            ->where('professional_id', $pro->id)
            ->whereDate('date', $date)
            ->whereIn('status', SlotOccupancy::OCCUPYING)
            ->count());
    }

    private function spawn(string $slot, User $admin, User $client, Service $service, Professional $pro, string $date, string $time): Process
    {
        $result = $this->raceDir.'/'.$slot.'.json';

        return new Process(
            [
                PHP_BINARY,
                base_path('tests/Support/post_booking.php'),
                $this->database,
                $this->raceDir,
                $slot,
                $admin->createToken('race')->plainTextToken,
                json_encode([
                    'user_id' => $client->id,
                    'service_id' => $service->id,
                    'professional_id' => $pro->id,
                    'date' => $date,
                    'time' => $time,
                    'payment_method' => 'pix',
                    'status' => 'pendente',
                ]),
                $result,
                '/api/admin/bookings',
            ],
            base_path(),
            null,
            null,
            30
        );
    }

    private function readResult(string $path): array
    {
        if (! file_exists($path)) {
            return ['status' => 0, 'body' => ['missing' => $path]];
        }

        return json_decode((string) file_get_contents($path), true);
    }
}
