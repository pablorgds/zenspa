<?php

use App\Http\Controllers\Api\AdminAvailabilityController;
use App\Http\Controllers\Api\AdminBookingController;
use App\Http\Controllers\Api\AdminFinancialController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ProfessionalController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::apiResource('services', ServiceController::class)->except(['index']);
        Route::apiResource('professionals', ProfessionalController::class)->except(['index']);
        Route::get('/agenda', [AdminBookingController::class, 'agenda']);
        Route::get('/bookings', [AdminBookingController::class, 'index']);
        Route::post('/bookings', [AdminBookingController::class, 'store']);
        Route::put('/bookings/{booking}', [AdminBookingController::class, 'update']);
        Route::delete('/bookings/{booking}', [AdminBookingController::class, 'destroy']);
        Route::post('/bookings/{booking}/cancel', [AdminBookingController::class, 'cancel']);
        Route::get('/professionals/{professional}/availabilities', [AdminAvailabilityController::class, 'index']);
        Route::post('/professionals/{professional}/availabilities', [AdminAvailabilityController::class, 'store']);
        Route::put('/professionals/{professional}/availabilities/{availability}', [AdminAvailabilityController::class, 'update']);
        Route::delete('/professionals/{professional}/availabilities/{availability}', [AdminAvailabilityController::class, 'destroy']);
        Route::get('/financial/summary', [AdminFinancialController::class, 'summary']);
        Route::get('/financial/transactions', [AdminFinancialController::class, 'transactions']);
    });
    Route::put('/user', [AuthController::class, 'updateProfile']);
});

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/professionals', [ProfessionalController::class, 'index']);
Route::get('/professionals/{id}/slots', [ProfessionalController::class, 'availableSlots']);
