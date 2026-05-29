<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'latitude',
    'longitude',
    'radius'
])]
class OfficeSetting extends Model
{
    //
}
