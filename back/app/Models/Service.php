<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'tag', 'description', 'price', 'duration_minutes'];

    protected $casts = [
        'price' => 'float',
        'duration_minutes' => 'integer',
    ];
}
