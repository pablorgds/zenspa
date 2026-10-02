<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Professional extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'role', 'avatar', 'rating', 'specialties'];

    protected $casts = [
        'specialties' => 'array',
        'rating' => 'float',
    ];

    public function availabilities()
    {
        return $this->hasMany(Availability::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function blocks()
    {
        return $this->hasMany(Block::class);
    }
}
