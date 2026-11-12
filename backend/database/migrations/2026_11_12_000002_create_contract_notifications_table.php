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
        Schema::create('contract_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('Karyawan yang kontraknya akan habis');
            $table->foreignId('director_id')->constrained('users')->onDelete('cascade')->comment('Direktur yang menerima notifikasi');
            $table->enum('notification_type', ['expiring_soon', 'expired'])->comment('Tipe notifikasi (akan habis/sudah habis)');
            $table->integer('days_remaining')->nullable()->comment('Sisa hari kontrak saat notifikasi dibuat');
            $table->boolean('is_read')->default(false)->comment('Apakah notifikasi sudah dibaca');
            $table->timestamp('read_at')->nullable()->comment('Waktu notifikasi dibaca');
            $table->timestamp('notified_at')->nullable()->comment('Waktu notifikasi dikirim');
            $table->timestamps();

            $table->index('director_id');
            $table->index('user_id');
            $table->index('is_read');
            $table->unique(['user_id', 'notification_type', 'days_remaining']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_notifications');
    }
};
