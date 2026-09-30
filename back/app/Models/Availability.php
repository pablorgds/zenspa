<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Availability extends Model
{
    protected $fillable = [
        'professional_id',
        'day_of_week',
        'start_time',
        'end_time',
        'slot_duration'
    ];

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }
}
