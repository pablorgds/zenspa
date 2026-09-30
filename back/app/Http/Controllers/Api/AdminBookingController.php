<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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
            'time' => 'sometimes|required|string',
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    Booking::STATUS_PENDING,
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_CANCELLED,
                    Booking::STATUS_COMPLETED
                ])
            ],
        ]);

        $booking->update($validated);

        return response()->json($booking);
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
