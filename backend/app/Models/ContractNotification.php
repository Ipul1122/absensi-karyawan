<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ContractNotification extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'director_id', 'notification_type', 'days_remaining', 'is_read', 'read_at', 'notified_at'];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'read_at' => 'datetime',
            'notified_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function director()
    {
        return $this->belongsTo(User::class, 'director_id');
    }
}
