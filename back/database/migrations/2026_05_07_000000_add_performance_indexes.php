<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['professional_id', 'date', 'time']);
            $table->index(['user_id', 'status']);
            $table->index('date');
            $table->index('status');
        });

        Schema::table('availabilities', function (Blueprint $table) {
            $table->index(['professional_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['professional_id', 'date', 'time']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['date']);
            $table->dropIndex(['status']);
        });

        Schema::table('availabilities', function (Blueprint $table) {
            $table->dropIndex(['professional_id', 'day_of_week']);
        });
    }
};
