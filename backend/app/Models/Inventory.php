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
    use \App\Traits\RecycleBinable;

    protected static function boot()
    {
        parent::boot();
        static::forceDeleted(function ($inventory) {
            if ($inventory->foto) {
                $storagePath = str_replace('/storage/', '', $inventory->foto);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($storagePath);
            }
            if ($inventory->struk_pembelian) {
                $storagePath = str_replace('/storage/', '', $inventory->struk_pembelian);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($storagePath);
            }
        });
    }

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    public function getRecycleBinName(): string
    {
        return "Inventaris: " . $this->nama_barang . " (Rp " . number_format($this->harga, 0, ',', '.') . ")";
    }
}
