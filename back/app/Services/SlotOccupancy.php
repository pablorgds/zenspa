<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\Block;
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
        $blocks = Block::query()->where('professional_id', $professionalId)->get();
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
                if (! $hiddenByClock && ! self::pointOccupied($slotTime, $occupying) && ! self::pointBlocked($date, $slotTime, $blocks)) {
                    $slots[] = $slotTime;
                }
                $start->addMinutes($availability->slot_duration);
            }
        }

        return $slots;
    }

    public static function blocked(int $professionalId, string $date, string $time, int $durationMinutes): bool
    {
        $start = Carbon::parse($date.' '.$time);
        $end = $start->copy()->addMinutes($durationMinutes);

        foreach (Block::query()->where('professional_id', $professionalId)->get() as $block) {
            if ($start->lt($block->ends_at) && $block->starts_at->lt($end)) {
                return true;
            }
        }

        return false;
    }

    public static function occupyingIdsIn(int $professionalId, Carbon $starts, Carbon $ends): array
    {
        $from = $starts->toDateString();
        $to = $ends->copy()->subSecond()->toDateString();
        $ids = [];

        $bookings = Booking::query()
            ->with('service')
            ->where('professional_id', $professionalId)
            ->whereIn('status', self::OCCUPYING)
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to)
            ->orderBy('id')
            ->get();

        foreach ($bookings as $booking) {
            $otherStart = Carbon::parse($booking->date.' '.Carbon::parse($booking->time)->format('H:i'));
            $otherEnd = $otherStart->copy()->addMinutes((int) $booking->service->duration_minutes);

            if ($starts->lt($otherEnd) && $otherStart->lt($ends)) {
                $ids[] = $booking->id;
            }
        }

        return $ids;
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

    public static function pointBlocked(string $date, string $point, Collection $blocks): bool
    {
        $at = Carbon::parse($date.' '.$point);

        foreach ($blocks as $block) {
            if ($at->gte($block->starts_at) && $at->lt($block->ends_at)) {
                return true;
            }
        }

        return false;
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
