<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Booking::with(['service', 'professional'])
                ->where('user_id', $request->user()->id)
                ->get()
        );
    }

    public function show(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        return response()->json($booking->load(['service', 'professional']));
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        if ($booking->status === Booking::STATUS_CANCELLED) {
            return response()->json(['message' => 'Agendamento já está cancelado.'], 422);
        }

        if ($booking->status === Booking::STATUS_COMPLETED) {
            return response()->json(['message' => 'Não é possível cancelar um agendamento concluído.'], 422);
        }

        $booking->update(['status' => Booking::STATUS_CANCELLED]);

        return response()->json($booking->load(['service', 'professional']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id'      => 'required|exists:services,id',
            'professional_id' => 'required|exists:professionals,id',
            'date'            => 'required|date|after_or_equal:today',
            'time'            => 'required|date_format:H:i',
            'payment_method'  => 'required|in:cartao_credito,cartao_debito,pix,dinheiro',
        ]);

        $dayOfWeek = Carbon::parse($validated['date'])->dayOfWeek;

        $available = Availability::where('professional_id', $validated['professional_id'])
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<=', $validated['time'])
            ->where('end_time', '>', $validated['time'])
            ->exists();

        if (!$available) {
            return response()->json(['message' => 'Horário fora da disponibilidade do profissional.'], 422);
        }

        $conflict = Booking::where('professional_id', $validated['professional_id'])
            ->where('date', $validated['date'])
            ->where('time', $validated['time'])
            ->whereNotIn('status', [Booking::STATUS_CANCELLED])
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'Horário já reservado.'], 422);
        }

        $service = Service::findOrFail($validated['service_id']);

        $validated['price']   = $service->price;
        $validated['user_id'] = $request->user()->id;
        $validated['status']  = Booking::STATUS_PENDING;

        $booking = Booking::create($validated);

        Transaction::create([
            'booking_id'  => $booking->id,
            'amount'      => $booking->price,
            'type'        => 'entrada',
            'description' => "Agendamento #{$booking->id}",
        ]);

        return response()->json($booking->load(['service', 'professional']), 201);
    }
}
