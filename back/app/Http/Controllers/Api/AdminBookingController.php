<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\SlotOccupancy;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminBookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['service', 'professional', 'user']);

        if ($request->has('professional_id')) {
            $query->where('professional_id', $request->professional_id);
        }

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('date', 'desc')->orderBy('time', 'desc')->get());
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'professional_id' => 'sometimes|required|exists:professionals,id',
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required|date_format:H:i',
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    Booking::STATUS_PENDING,
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_CANCELLED,
                    Booking::STATUS_COMPLETED,
                ]),
            ],
        ]);

        $touchesSchedule = array_key_exists('professional_id', $validated)
            || array_key_exists('date', $validated)
            || array_key_exists('time', $validated);

        if (! $touchesSchedule) {
            $booking->update($validated);

            return response()->json($booking);
        }

        $professionalId = (int) ($validated['professional_id'] ?? $booking->professional_id);
        $date = Carbon::parse($validated['date'] ?? $booking->date)->toDateString();
        $time = Carbon::parse($validated['time'] ?? $booking->time)->format('H:i');
        $sameInterval = $professionalId === (int) $booking->professional_id
            && $date === Carbon::parse($booking->date)->toDateString()
            && $time === Carbon::parse($booking->time)->format('H:i');

        if ($sameInterval) {
            $booking->update($validated);

            return response()->json($booking);
        }

        $duration = (int) $booking->service->duration_minutes;
        $message = null;

        $updated = SlotOccupancy::run($professionalId, function () use (&$message, $booking, $validated, $professionalId, $date, $time, $duration) {
            if (! SlotOccupancy::fitsWindow($professionalId, $date, $time, $duration)) {
                $message = 'Horário fora da disponibilidade do profissional.';

                return null;
            }

            if (SlotOccupancy::overlaps($professionalId, $date, $time, $duration, $booking->id)) {
                $message = 'Horário já reservado.';

                return null;
            }

            $booking->update($validated);

            return $booking;
        });

        if ($message !== null) {
            return response()->json(['message' => $message], 422);
        }

        return response()->json($updated);
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();

        return response()->json(['message' => 'Booking deleted successfully']);
    }

    public function cancel(Booking $booking)
    {
        $booking->update(['status' => Booking::STATUS_CANCELLED]);

        return response()->json($booking);
    }
}
