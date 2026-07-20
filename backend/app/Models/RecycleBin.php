<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'model_type',
    'model_id',
    'display_name',
    'deleted_at'
])]
class RecycleBin extends Model
{
    protected $casts = [
        'deleted_at' => 'datetime',
    ];
}
