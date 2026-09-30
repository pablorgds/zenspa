<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Professional;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'service_id' => Service::factory(),
            'professional_id' => Professional::factory(),
            'date' => $this->faker->date(),
            'time' => $this->faker->time('H:i'),
            'status' => $this->faker->randomElement([
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_CANCELLED,
                Booking::STATUS_COMPLETED
            ]),
            'location' => $this->faker->address,
            'price' => $this->faker->randomFloat(2, 50, 500),
            'payment_method' => $this->faker->randomElement(['credit_card', 'pix', 'cash']),
        ];
    }
}
