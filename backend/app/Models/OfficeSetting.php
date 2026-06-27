<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'latitude',
    'longitude',
    'radius',
    'bogor_latitude',
    'bogor_longitude',
    'bogor_radius'
])]
class OfficeSetting extends Model
{
    //
}
