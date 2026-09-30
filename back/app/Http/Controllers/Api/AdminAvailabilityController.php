<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Models\Professional;
use Illuminate\Http\Request;

class AdminAvailabilityController extends Controller
{
    public function index(Professional $professional)
    {
        return response()->json(
            $professional->availabilities()->orderBy('day_of_week')->orderBy('start_time')->get()
        );
    }

    public function store(Request $request, Professional $professional)
    {
        $validated = $request->validate([
            'day_of_week'    => 'required|integer|min:0|max:6',
            'start_time'     => 'required|date_format:H:i',
            'end_time'       => 'required|date_format:H:i|after:start_time',
            'slot_duration'  => 'required|integer|min:1',
        ]);

        $availability = $professional->availabilities()->create($validated);

        return response()->json($availability, 201);
    }

    public function update(Request $request, Professional $professional, Availability $availability)
    {
        if ($availability->professional_id !== $professional->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'day_of_week'    => 'sometimes|required|integer|min:0|max:6',
            'start_time'     => 'sometimes|required|date_format:H:i',
            'end_time'       => 'sometimes|required|date_format:H:i|after:start_time',
            'slot_duration'  => 'sometimes|required|integer|min:1',
        ]);

        $availability->update($validated);

        return response()->json($availability);
    }

    public function destroy(Professional $professional, Availability $availability)
    {
        if ($availability->professional_id !== $professional->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $availability->delete();

        return response()->json(null, 204);
    }
}
