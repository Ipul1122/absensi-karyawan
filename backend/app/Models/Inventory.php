<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'nama_barang',
    'tanggal_pembelian',
    'harga',
    'foto',
    'lokasi',
    'struk_pembelian',
    'pemakai_barang',
    'kondisi_barang',
    'status',
    'admin_notes',
])]
class Inventory extends Model
{
    //
}
