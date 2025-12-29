<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index()
    {
        return response()->json(Booking::with(['service', 'professional'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'required|exists:professionals,id',
            'date' => 'required|date',
            'time' => 'required|string',
            'payment_method' => 'required|string',
            'price' => 'required|numeric',
        ]);

        $booking = Booking::create($validated);

        return response()->json($booking, 21);
    }
}
