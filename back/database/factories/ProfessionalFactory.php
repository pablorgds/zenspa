<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Professional>
 */
class ProfessionalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name,
            'role' => $this->faker->jobTitle,
            'specialties' => [$this->faker->word, $this->faker->word],
            'rating' => $this->faker->randomFloat(1, 1, 5),
            'avatar' => 'https://i.pravatar.cc/150?u=' . $this->faker->unique()->safeEmail,
        ];
    }
}
