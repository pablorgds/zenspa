<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professional;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ProfessionalController extends Controller
{
    public function index()
    {
        return response()->json(Professional::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'avatar' => 'nullable|string',
            'rating' => 'nullable|numeric',
            'specialties' => 'required|array',
        ]);

        $professional = Professional::create($validated);
        return response()->json($professional, 201);
    }

    public function update(Request $request, $id)
    {
        $professional = Professional::findOrFail($id);
        $validated = $request->validate([
            'name' => 'string|max:255',
            'role' => 'string|max:255',
            'avatar' => 'nullable|string',
            'rating' => 'numeric',
            'specialties' => 'array',
        ]);

        $professional->update($validated);
        return response()->json($professional);
    }

    public function destroy($id)
    {
        $professional = Professional::findOrFail($id);
        $professional->delete();
        return response()->json(null, 204);
    }

    public function availableSlots(Request $request, $id)
    {
        $date = $request->query('date'); // YYYY-MM-DD
        if (!$date) {
            return response()->json(['message' => 'Date is required'], 400);
        }

        $carbonDate = Carbon::parse($date);
        $dayOfWeek = $carbonDate->dayOfWeek; // 0 (Sunday) to 6 (Saturday)

        $professional = Professional::with(['availabilities' => function($query) use ($dayOfWeek) {
            $query->where('day_of_week', (string)$dayOfWeek);
        }])->findOrFail($id);

        $existingBookings = $professional->bookings()
            ->whereDate('date', $date)
            ->pluck('time')
            ->toArray();

        $slots = [];
        foreach ($professional->availabilities as $availability) {
            $start = Carbon::createFromFormat('H:i:s', $availability->start_time);
            $end = Carbon::createFromFormat('H:i:s', $availability->end_time);

            while ($start->copy()->addMinutes($availability->slot_duration)->lte($end)) {
                $slotTime = $start->format('H:i');
                if (!in_array($slotTime, $existingBookings)) {
                    $slots[] = $slotTime;
                }
                $start->addMinutes($availability->slot_duration);
            }
        }

        return response()->json($slots);
    }
}
