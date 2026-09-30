<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminFinancialController extends Controller
{
    public function summary(Request $request)
    {
        $period = $request->query('period', 'daily');

        if ($period === 'daily') {
            $revenue = Transaction::where('type', 'entrada')
                ->whereDate('created_at', Carbon::today())
                ->sum('amount');
            $bookingsCount = Booking::whereDate('created_at', Carbon::today())->count();
        } else {
            $revenue = Transaction::where('type', 'entrada')
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('amount');
            $bookingsCount = Booking::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();
        }

        return response()->json([
            'period'         => $period,
            'revenue'        => (float) $revenue,
            'bookings_count' => $bookingsCount,
            'total_revenue'  => (float) Transaction::where('type', 'entrada')->sum('amount'),
            'total_bookings' => Booking::count(),
        ]);
    }

    public function transactions(Request $request)
    {
        $transactions = Transaction::with(['booking.service', 'booking.professional', 'booking.user'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($transactions);
    }
}
