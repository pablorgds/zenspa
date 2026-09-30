<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;
    const STATUS_PENDING = 'pendente';
    const STATUS_CONFIRMED = 'confirmado';
    const STATUS_CANCELLED = 'cancelado';
    const STATUS_COMPLETED = 'concluído';

    protected $fillable = [
        'status',
        'service_id',
        'professional_id',
        'user_id',
        'date',
        'time',
        'location',
        'price',
        'payment_method'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }
}
