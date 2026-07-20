<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update Shift Pagi to Shift Reguler (08:30 - 17:30)
        DB::table('shifts')
            ->where('name', 'Shift Pagi')
            ->update([
                'name' => 'Shift Reguler',
                'start_time' => '08:30:00',
                'end_time' => '17:30:00',
                'updated_at' => now()
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert Shift Reguler to Shift Pagi (09:00 - 17:00)
        DB::table('shifts')
            ->where('name', 'Shift Reguler')
            ->update([
                'name' => 'Shift Pagi',
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'updated_at' => now()
            ]);
    }
};
