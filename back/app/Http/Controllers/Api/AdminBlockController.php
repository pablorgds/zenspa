<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Professional;
use App\Services\SlotOccupancy;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminBlockController extends Controller
{
    public function index(Professional $professional)
    {
        $blocks = $professional->blocks()->orderBy('starts_at')->get()->map(fn (Block $block) => $this->payload($block));

        return response()->json($blocks->values());
    }

    public function store(Request $request, Professional $professional)
    {
        $validated = $request->validate([
            'starts_at' => 'required|date_format:Y-m-d H:i:s',
            'ends_at' => 'required|date_format:Y-m-d H:i:s|after:starts_at',
            'reason' => 'required|string',
        ]);

        $starts = Carbon::parse($validated['starts_at']);
        $ends = Carbon::parse($validated['ends_at']);
        $conflict = null;

        $block = SlotOccupancy::run((int) $professional->id, function () use ($professional, $validated, $starts, $ends, &$conflict) {
            $ids = SlotOccupancy::occupyingIdsIn((int) $professional->id, $starts, $ends);
            if ($ids !== []) {
                $conflict = $ids;

                return null;
            }

            return $professional->blocks()->create($validated);
        });

        if ($conflict !== null) {
            return response()->json([
                'message' => 'Intervalo com agendamento ativo.',
                'booking_ids' => $conflict,
            ], 422);
        }

        return response()->json($this->payload($block), 201);
    }

    public function update(Request $request, Professional $professional, Block $block)
    {
        if ($block->professional_id !== $professional->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $validated = $request->validate([
            'starts_at' => 'sometimes|required|date_format:Y-m-d H:i:s',
            'ends_at' => 'sometimes|required|date_format:Y-m-d H:i:s',
            'reason' => 'sometimes|required|string',
        ]);

        $starts = Carbon::parse($validated['starts_at'] ?? $block->starts_at);
        $ends = Carbon::parse($validated['ends_at'] ?? $block->ends_at);
        if (! $ends->gt($starts)) {
            return response()->json(['message' => 'The ends at field must be a date after starts at.'], 422);
        }

        $conflict = null;

        $updated = SlotOccupancy::run((int) $professional->id, function () use ($block, $validated, $starts, $ends, $professional, &$conflict) {
            $ids = SlotOccupancy::occupyingIdsIn((int) $professional->id, $starts, $ends);
            if ($ids !== []) {
                $conflict = $ids;

                return null;
            }

            $block->update($validated);

            return $block->fresh();
        });

        if ($conflict !== null) {
            return response()->json([
                'message' => 'Intervalo com agendamento ativo.',
                'booking_ids' => $conflict,
            ], 422);
        }

        return response()->json($this->payload($updated));
    }

    public function destroy(Professional $professional, Block $block)
    {
        if ($block->professional_id !== $professional->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $block->delete();

        return response()->json(null, 204);
    }

    private function payload(Block $block): array
    {
        return [
            'id' => $block->id,
            'professional_id' => $block->professional_id,
            'starts_at' => $block->starts_at->format('Y-m-d H:i:s'),
            'ends_at' => $block->ends_at->format('Y-m-d H:i:s'),
            'reason' => $block->reason,
        ];
    }
}
