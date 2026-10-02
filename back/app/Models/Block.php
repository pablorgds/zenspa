<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    protected $fillable = [
        'professional_id',
        'starts_at',
        'ends_at',
        'reason',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }
}
