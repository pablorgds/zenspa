<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

[, $database, $raceDir, $slot, $token, $payloadJson, $resultPath] = $argv;

config()->set('database.default', 'sqlite');
config()->set('database.connections.sqlite.database', $database);
DB::purge('sqlite');
DB::reconnect('sqlite');
DB::statement('PRAGMA busy_timeout = 8000');

$tables = array_map(fn ($row) => $row->name, DB::select("SELECT name FROM sqlite_master WHERE type = 'table'"));
if (! in_array('personal_access_tokens', $tables, true)) {
    file_put_contents($resultPath, json_encode([
        'status' => 0,
        'body' => [
            'error' => 'race database has no tokens table',
            'database' => $database,
            'listed' => DB::select('pragma database_list'),
            'tables' => $tables,
        ],
    ]));
    exit(1);
}
$seen = false;

DB::listen(function ($query) use ($raceDir, $slot, &$seen) {
    if ($seen) {
        return;
    }

    $sql = strtolower($query->sql);
    if (! str_contains($sql, 'bookings') || ! str_starts_with(ltrim($sql), 'select')) {
        return;
    }

    $seen = true;
    file_put_contents($raceDir.'/ready-'.$slot, '1');
    $deadline = microtime(true) + 3;
    while (count(glob($raceDir.'/ready-*')) < 2 && microtime(true) < $deadline) {
        usleep(20000);
    }
});

try {
    $payload = json_decode($payloadJson, true);
    $path = $argv[7] ?? '/api/bookings';
    $request = Request::create($path, 'POST', $payload);
    $request->headers->set('Accept', 'application/json');
    $request->headers->set('Authorization', 'Bearer '.$token);

    $response = $kernel->handle($request);
    file_put_contents($resultPath, json_encode([
        'status' => $response->getStatusCode(),
        'body' => json_decode($response->getContent(), true),
    ]));
    $kernel->terminate($request, $response);
} catch (Throwable $e) {
    file_put_contents($resultPath, json_encode([
        'status' => 0,
        'body' => ['error' => $e->getMessage()],
    ]));
    fwrite(STDERR, $e->getMessage()."\n".$e->getTraceAsString());
    exit(1);
}
