<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\User;
use App\Services\SlotOccupancy;
use Carbon\Carbon;
use DateTimeImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminBookingController extends Controller
{
    public function agenda(Request $request)
    {
        $date = $request->query('date');
        if (! is_string($date) || ! $this->isCalendarDate($date)) {
            return response()->json(['message' => 'Data inválida.'], 422);
        }

        if ($request->filled('professional_id')) {
            $professionals = collect([
                Professional::query()->findOrFail($request->query('professional_id')),
            ]);
        } else {
            $professionals = Professional::query()->orderBy('name')->get();
        }

        $rows = $professionals->sortBy('name')->values()->map(function (Professional $professional) use ($date) {
            $bookings = Booking::query()
                ->with(['user', 'service'])
                ->where('professional_id', $professional->id)
                ->whereDate('date', $date)
                ->whereIn('status', SlotOccupancy::OCCUPYING)
                ->orderBy('time')
                ->get()
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'time' => Carbon::parse($booking->time)->format('H:i'),
                    'status' => $booking->status,
                    'user' => $booking->user,
                    'service' => $booking->service,
                ])
                ->values();

            return [
                'id' => $professional->id,
                'name' => $professional->name,
                'bookings' => $bookings,
                'free_slots' => SlotOccupancy::freeSlots($professional->id, $date),
            ];
        })->values();

        return response()->json([
            'date' => $date,
            'professionals' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $hasId = $request->filled('user_id');
        $hasEmail = $request->filled('email');

        if (! $hasId && ! $hasEmail) {
            return response()->json(['message' => 'Informe o usuário.'], 422);
        }

        if ($hasId && $hasEmail) {
            return response()->json(['message' => 'Informe só o id ou o e-mail.'], 422);
        }

        $user = $hasId
            ? User::query()->find($request->input('user_id'))
            : User::query()->where('email', $request->input('email'))->first();

        if ($user === null) {
            return response()->json(['message' => 'Usuário não encontrado.'], 422);
        }

        $status = $request->input('status');
        if (! in_array($status, [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED], true)) {
            return response()->json(['message' => 'Status inicial inválido.'], 422);
        }

        $payment = $request->input('payment_method');
        if (! in_array($payment, ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'], true)) {
            return response()->json(['message' => 'Forma de pagamento inválida.'], 422);
        }

        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'required|exists:professionals,id',
            'date' => 'required|date_format:Y-m-d',
            'time' => 'required|date_format:H:i',
        ]);

        $service = Service::query()->findOrFail($validated['service_id']);
        $professionalId = (int) $validated['professional_id'];
        $date = $validated['date'];
        $time = $validated['time'];
        $duration = (int) $service->duration_minutes;
        $message = null;

        $booking = SlotOccupancy::run($professionalId, function () use (&$message, $user, $service, $professionalId, $date, $time, $duration, $status, $payment) {
            if (Carbon::parse($date)->startOfDay()->lt(Carbon::now()->startOfDay())) {
                $message = 'Não é possível agendar em data passada.';

                return null;
            }

            if (SlotOccupancy::isPast($date, $time)) {
                $message = 'Horário já passou.';

                return null;
            }

            if (! SlotOccupancy::fitsWindow($professionalId, $date, $time, $duration)) {
                $message = 'Horário fora da disponibilidade do profissional.';

                return null;
            }

            if (SlotOccupancy::overlaps($professionalId, $date, $time, $duration)) {
                $message = 'Horário já reservado.';

                return null;
            }

            $booking = Booking::create([
                'user_id' => $user->id,
                'service_id' => $service->id,
                'professional_id' => $professionalId,
                'date' => $date,
                'time' => $time,
                'status' => $status,
                'payment_method' => $payment,
                'price' => $service->price,
            ]);

            Transaction::create([
                'booking_id' => $booking->id,
                'amount' => $booking->price,
                'type' => 'entrada',
                'description' => "Agendamento #{$booking->id}",
            ]);

            return $booking->load(['service', 'professional', 'user']);
        });

        if ($message !== null) {
            return response()->json(['message' => $message], 422);
        }

        return response()->json($booking, 201);
    }

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

    private function isCalendarDate(string $date): bool
    {
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        $errors = DateTimeImmutable::getLastErrors();

        if ($parsed === false || $parsed->format('Y-m-d') !== $date) {
            return false;
        }

        return ! is_array($errors) || ($errors['warning_count'] === 0 && $errors['error_count'] === 0);
    }
}
