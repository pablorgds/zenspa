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

class ConcurrentBookingTest extends TestCase
{
    private string $database;

    private string $raceDir;

    protected function setUp(): void
    {
        parent::setUp();

        $this->database = '/tmp/zenspa-slot-race-'.getmypid().'.sqlite';
        $this->raceDir = '/tmp/zenspa-slot-race-'.getmypid();

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

        $tables = DB::select("SELECT name FROM sqlite_master WHERE type = 'table'");
        $listed = DB::select('pragma database_list');
        if ($tables === []) {
            throw new \RuntimeException('race migrate missed the file: '.json_encode($listed));
        }
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

    public function test_concurrent_overlapping_posts_persist_one(): void
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

        $first = $this->spawn('a', User::factory()->create(), $service, $pro, $date, '09:00');
        $second = $this->spawn('b', User::factory()->create(), $service, $pro, $date, '10:00');

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

    private function spawn(string $slot, User $user, Service $service, Professional $pro, string $date, string $time): Process
    {
        $result = $this->raceDir.'/'.$slot.'.json';

        return new Process(
            [
                PHP_BINARY,
                base_path('tests/Support/post_booking.php'),
                $this->database,
                $this->raceDir,
                $slot,
                $user->createToken('race')->plainTextToken,
                json_encode([
                    'service_id' => $service->id,
                    'professional_id' => $pro->id,
                    'date' => $date,
                    'time' => $time,
                    'payment_method' => 'pix',
                ]),
                $result,
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
