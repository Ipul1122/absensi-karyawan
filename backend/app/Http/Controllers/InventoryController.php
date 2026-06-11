<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inventory;
use Illuminate\Support\Facades\Storage;

class InventoryController extends Controller
{
    /**
     * Display a listing of the inventories.
     */
    public function index(Request $request)
    {
        $query = Inventory::query();

        // Search filter
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_barang', 'like', "%{$search}%")
                  ->orWhere('lokasi', 'like', "%{$search}%")
                  ->orWhere('pemakai_barang', 'like', "%{$search}%");
            });
        }

        // Condition filter
        if ($request->has('kondisi') && $request->kondisi != 'all') {
            $query->where('kondisi_barang', $request->kondisi);
        }

        $inventories = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $inventories
        ]);
    }

    /**
     * Store a newly created inventory.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_barang' => 'required|string|max:255',
            'tanggal_pembelian' => 'required|date',
            'harga' => 'required|numeric|min:0',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'lokasi' => 'required|string|max:255',
            'struk_pembelian' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,pdf|max:5120',
            'pemakai_barang' => 'nullable|string|max:255',
            'kondisi_barang' => 'required|in:ori,second',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            try {
                $file = $request->file('foto');
                $filename = 'inv_photo_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('inventories/photos', $filename, 'public');
                $fotoPath = '/storage/inventories/photos/' . $filename;
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah foto barang: ' . $e->getMessage()
                ], 500);
            }
        }

        $strukPath = null;
        if ($request->hasFile('struk_pembelian')) {
            try {
                $file = $request->file('struk_pembelian');
                $filename = 'inv_receipt_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('inventories/receipts', $filename, 'public');
                $strukPath = '/storage/inventories/receipts/' . $filename;
            } catch (\Exception $e) {
                // Clean up photo if upload receipt fails
                if ($fotoPath) {
                    $storagePath = str_replace('/storage/', '', $fotoPath);
                    Storage::disk('public')->delete($storagePath);
                }
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah struk pembelian: ' . $e->getMessage()
                ], 500);
            }
        }

        try {
            $inventory = Inventory::create([
                'nama_barang' => $request->nama_barang,
                'tanggal_pembelian' => $request->tanggal_pembelian,
                'harga' => $request->harga,
                'foto' => $fotoPath,
                'lokasi' => $request->lokasi,
                'struk_pembelian' => $strukPath,
                'pemakai_barang' => $request->pemakai_barang,
                'kondisi_barang' => $request->kondisi_barang,
                'status' => 'pending',
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Data inventaris berhasil ditambahkan.',
                'data' => $inventory
            ], 201);
        } catch (\Exception $e) {
            // Cleanup uploaded files
            if ($fotoPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $fotoPath));
            }
            if ($strukPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $strukPath));
            }
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan data inventaris: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified inventory.
     */
    public function show($id)
    {
        $inventory = Inventory::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $inventory
        ]);
    }

    /**
     * Update the specified inventory.
     */
    public function update(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);

        if ($inventory->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Data inventaris yang sudah diproses (disetujui/ditolak) tidak dapat diubah lagi.'
            ], 422);
        }

        $request->validate([
            'nama_barang' => 'required|string|max:255',
            'tanggal_pembelian' => 'required|date',
            'harga' => 'required|numeric|min:0',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'lokasi' => 'required|string|max:255',
            'struk_pembelian' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,pdf|max:5120',
            'pemakai_barang' => 'nullable|string|max:255',
            'kondisi_barang' => 'required|in:ori,second',
        ]);

        $fotoPath = $inventory->foto;
        if ($request->hasFile('foto')) {
            try {
                // Delete old photo
                if ($inventory->foto) {
                    $oldStoragePath = str_replace('/storage/', '', $inventory->foto);
                    Storage::disk('public')->delete($oldStoragePath);
                }
                
                $file = $request->file('foto');
                $filename = 'inv_photo_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('inventories/photos', $filename, 'public');
                $fotoPath = '/storage/inventories/photos/' . $filename;
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah foto barang baru: ' . $e->getMessage()
                ], 500);
            }
        }

        $strukPath = $inventory->struk_pembelian;
        if ($request->hasFile('struk_pembelian')) {
            try {
                // Delete old receipt
                if ($inventory->struk_pembelian) {
                    $oldStoragePath = str_replace('/storage/', '', $inventory->struk_pembelian);
                    Storage::disk('public')->delete($oldStoragePath);
                }

                $file = $request->file('struk_pembelian');
                $filename = 'inv_receipt_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('inventories/receipts', $filename, 'public');
                $strukPath = '/storage/inventories/receipts/' . $filename;
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mengunggah struk pembelian baru: ' . $e->getMessage()
                ], 500);
            }
        }

        try {
            $inventory->update([
                'nama_barang' => $request->nama_barang,
                'tanggal_pembelian' => $request->tanggal_pembelian,
                'harga' => $request->harga,
                'foto' => $fotoPath,
                'lokasi' => $request->lokasi,
                'struk_pembelian' => $strukPath,
                'pemakai_barang' => $request->pemakai_barang,
                'kondisi_barang' => $request->kondisi_barang,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Data inventaris berhasil diperbarui.',
                'data' => $inventory
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui data inventaris: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified inventory.
     */
    public function destroy($id)
    {
        $inventory = Inventory::findOrFail($id);

        if ($inventory->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Data inventaris yang sudah diproses (disetujui/ditolak) tidak dapat dihapus.'
            ], 422);
        }

        try {
            // Delete photo from storage if exists
            if ($inventory->foto) {
                $storagePath = str_replace('/storage/', '', $inventory->foto);
                Storage::disk('public')->delete($storagePath);
            }

            // Delete receipt from storage if exists
            if ($inventory->struk_pembelian) {
                $storagePath = str_replace('/storage/', '', $inventory->struk_pembelian);
                Storage::disk('public')->delete($storagePath);
            }

            $inventory->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Data inventaris berhasil dihapus.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus data inventaris: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an inventory item (Director).
     */
    public function directorApprove($id)
    {
        $inventory = Inventory::findOrFail($id);

        try {
            $inventory->update([
                'status' => 'approved',
                'admin_notes' => 'Disetujui oleh Direktur.'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Barang inventaris berhasil disetujui oleh Direktur.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui barang: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an inventory item (Director).
     */
    public function directorReject(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);

        $request->validate([
            'admin_notes' => 'required|string|max:1000'
        ], [
            'admin_notes.required' => 'Alasan penolakan wajib diisi.'
        ]);

        try {
            $inventory->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Barang inventaris berhasil ditolak oleh Direktur.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak barang: ' . $e->getMessage()
            ], 500);
        }
    }
}
