<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->string('nama_barang');
            $table->date('tanggal_pembelian');
            $table->decimal('harga', 15, 2);
            $table->string('foto')->nullable();
            $table->string('lokasi');
            $table->string('struk_pembelian')->nullable();
            $table->string('pemakai_barang')->nullable();
            $table->enum('kondisi_barang', ['ori', 'second']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
