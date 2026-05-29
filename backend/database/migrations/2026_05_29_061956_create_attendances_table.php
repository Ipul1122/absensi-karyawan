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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            
            // Clock In
            $table->time('clock_in')->nullable();
            $table->string('latitude_in')->nullable();
            $table->string('longitude_in')->nullable();
            $table->string('photo_in')->nullable();
            $table->text('notes_in')->nullable();
            $table->string('status_in')->nullable(); // early, normal, late
            
            // Clock Out
            $table->time('clock_out')->nullable();
            $table->string('latitude_out')->nullable();
            $table->string('longitude_out')->nullable();
            $table->string('photo_out')->nullable();
            $table->text('notes_out')->nullable();
            $table->string('status_out')->nullable(); // early_departure, normal, overtime
            
            $table->timestamps();

            // Indeks agar query pencarian per user dan tanggal lebih cepat
            $table->unique(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
