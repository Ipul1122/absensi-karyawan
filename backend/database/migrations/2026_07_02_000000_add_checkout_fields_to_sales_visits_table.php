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
        Schema::table('sales_visits', function (Blueprint $table) {
            $table->time('visit_time_out')->nullable();
            $table->string('latitude_out')->nullable();
            $table->string('longitude_out')->nullable();
            $table->string('photo_path_out')->nullable();
            $table->text('notes_out')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_visits', function (Blueprint $table) {
            $table->dropColumn([
                'visit_time_out',
                'latitude_out',
                'longitude_out',
                'photo_path_out',
                'notes_out'
            ]);
        });
    }
};
