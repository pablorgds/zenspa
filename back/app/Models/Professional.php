<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Professional extends Model
{
    protected $fillable = ['name', 'role', 'avatar', 'rating', 'specialties'];

    protected $casts = [
        'specialties' => 'array',
        'rating' => 'float',
    ];
}
