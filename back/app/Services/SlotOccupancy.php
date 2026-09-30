<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\Professional;
use Carbon\Carbon;
use Closure;
use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SlotOccupancy
{
    public const OCCUPYING = [
        Booking::STATUS_PENDING,
        Booking::STATUS_CONFIRMED,
        Booking::STATUS_COMPLETED,
    ];

    public static function run(int $professionalId, callable $callback): mixed
    {
        $connection = DB::connection();
        $previousMode = null;

        if ($connection->getDriverName() === 'sqlite') {
            $connection->statement('PRAGMA busy_timeout = 8000');
            $previousMode = $connection->getConfig('transaction_mode') ?? 'DEFERRED';
            self::setTransactionMode($connection, 'IMMEDIATE');
        }

        try {
            return DB::transaction(function () use ($professionalId, $callback) {
                Professional::query()->whereKey($professionalId)->lockForUpdate()->first();

                return $callback();
            });
        } finally {
            if ($previousMode !== null) {
                self::setTransactionMode($connection, $previousMode);
            }
        }
    }

    public static function isPast(string $date, string $time): bool
    {
        $now = Carbon::now();
        $day = Carbon::parse($date);

        if (! $day->isSameDay($now)) {
            return false;
        }

        return Carbon::parse($date.' '.$time)->lt($now);
    }

    public static function fitsWindow(int $professionalId, string $date, string $time, int $durationMinutes): bool
    {
        $start = Carbon::createFromFormat('H:i', $time);
        $end = $start->copy()->addMinutes($durationMinutes);

        $dayOfWeek = Carbon::parse($date)->dayOfWeek;

        return Availability::query()
            ->where('professional_id', $professionalId)
            ->whereIn('day_of_week', [(string) $dayOfWeek, $dayOfWeek])
            ->where('start_time', '<=', $start->format('H:i:s'))
            ->where('end_time', '>=', $end->format('H:i:s'))
            ->exists();
    }

    public static function overlaps(int $professionalId, string $date, string $time, int $durationMinutes, ?int $exceptId = null): bool
    {
        $start = self::minutes($time);
        $end = $start + $durationMinutes;

        foreach (self::occupying($professionalId, $date, $exceptId) as $booking) {
            $otherStart = self::minutes($booking->time);
            $otherEnd = $otherStart + (int) $booking->service->duration_minutes;

            if ($start < $otherEnd && $otherStart < $end) {
                return true;
            }
        }

        return false;
    }

    public static function pointOccupied(string $point, Collection $bookings): bool
    {
        $minutes = self::minutes($point);

        foreach ($bookings as $booking) {
            $start = self::minutes($booking->time);
            $end = $start + (int) $booking->service->duration_minutes;

            if ($minutes >= $start && $minutes < $end) {
                return true;
            }
        }

        return false;
    }

    public static function freeSlots(int $professionalId, string $date): array
    {
        $carbonDate = Carbon::parse($date);
        $dayOfWeek = $carbonDate->dayOfWeek;
        $availabilities = Availability::query()
            ->where('professional_id', $professionalId)
            ->whereIn('day_of_week', [(string) $dayOfWeek, $dayOfWeek])
            ->get();
        $occupying = self::occupying($professionalId, $date);
        $now = Carbon::now();
        $isToday = $carbonDate->isSameDay($now);
        $slots = [];

        foreach ($availabilities as $availability) {
            $start = Carbon::createFromFormat('H:i:s', $availability->start_time);
            $end = Carbon::createFromFormat('H:i:s', $availability->end_time);

            while ($start->copy()->addMinutes($availability->slot_duration)->lte($end)) {
                $slotTime = $start->format('H:i');
                $slotAt = Carbon::parse($date.' '.$slotTime);
                $hiddenByClock = $isToday && $slotAt->lt($now);
                if (! $hiddenByClock && ! self::pointOccupied($slotTime, $occupying)) {
                    $slots[] = $slotTime;
                }
                $start->addMinutes($availability->slot_duration);
            }
        }

        return $slots;
    }

    public static function occupying(int $professionalId, string $date, ?int $exceptId = null): Collection
    {
        return Booking::query()
            ->with('service')
            ->where('professional_id', $professionalId)
            ->whereDate('date', $date)
            ->whereIn('status', self::OCCUPYING)
            ->when($exceptId, fn ($query) => $query->where('id', '!=', $exceptId))
            ->get();
    }

    private static function minutes(string $time): int
    {
        $parsed = Carbon::parse($time);

        return ($parsed->hour * 60) + $parsed->minute;
    }

    private static function setTransactionMode(Connection $connection, string $mode): void
    {
        $setter = Closure::bind(function (string $mode) {
            $this->config['transaction_mode'] = $mode;
        }, $connection, Connection::class);

        $setter($mode);
    }
}
