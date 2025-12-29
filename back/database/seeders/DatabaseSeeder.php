<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Serviços
        $s1 = \App\Models\Service::create([
            'name' => 'Massagem relaxante',
            'tag' => 'Relaxamento',
            'description' => 'Alivia estresse, reduz tensão muscular e melhora a qualidade do sono em uma única sessão.',
            'duration_minutes' => 60,
            'price' => 160.00,
        ]);

        $s2 = \App\Models\Service::create([
            'name' => 'Limpeza de pele profunda',
            'tag' => 'Estética',
            'description' => 'Protocolo completo com esfoliação, extração suave e máscara calmante.',
            'duration_minutes' => 75,
            'price' => 190.00,
        ]);

        $s3 = \App\Models\Service::create([
            'name' => 'Combo Spa Day',
            'tag' => 'Bem-estar',
            'description' => 'Massagem relaxante + máscara facial hidratante + escalda-pés aromático.',
            'duration_minutes' => 120,
            'price' => 320.00,
        ]);

        // Profissionais
        \App\Models\Professional::create([
            'name' => 'Ana Paula',
            'role' => 'Massoterapeuta',
            'rating' => 4.9,
            'specialties' => ['Massagem relaxante', 'Drenagem linfática'],
        ]);

        \App\Models\Professional::create([
            'name' => 'Bruno Oliveira',
            'role' => 'Massoterapeuta Desportivo',
            'rating' => 4.8,
            'specialties' => ['Massagem desportiva', 'Massagem relaxante'],
        ]);

        \App\Models\Professional::create([
            'name' => 'Carla Mendes',
            'role' => 'Esteticista',
            'rating' => 5.0,
            'specialties' => ['Limpeza de pele profunda', 'Tratamentos faciais'],
        ]);
    }
}
