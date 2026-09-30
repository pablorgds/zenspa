<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professional;
use App\Services\SlotOccupancy;
use Illuminate\Http\Request;

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
        if (! $date) {
            return response()->json(['message' => 'Date is required'], 400);
        }

        Professional::findOrFail($id);

        return response()->json(SlotOccupancy::freeSlots((int) $id, $date));
    }
}
