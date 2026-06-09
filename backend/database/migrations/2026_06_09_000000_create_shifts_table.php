<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->time('clock_in');
            $table->time('clock_out');
            $table->time('early_checkin_before');
            $table->time('late_checkin_after');
            $table->time('early_checkout_before');
            $table->time('overtime_checkout_after');
            $table->timestamps();
        });

        // Seed default normal shift
        $shiftId = DB::table('shifts')->insertGetId([
            'name' => 'Shift Normal',
            'clock_in' => '09:00:00',
            'clock_out' => '17:00:00',
            'early_checkin_before' => '08:30:00',
            'late_checkin_after' => '09:00:00',
            'early_checkout_before' => '17:00:00',
            'overtime_checkout_after' => '18:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('users', function (Blueprint $table) use ($shiftId) {
            $table->unsignedBigInteger('shift_id')->nullable()->after('role');
            $table->foreign('shift_id')->references('id')->on('shifts')->onDelete('set null');
        });

        // Set existing employees to default shift
        DB::table('users')->where('role', 'employee')->update(['shift_id' => $shiftId]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn('shift_id');
        });

        Schema::dropIfExists('shifts');
    }
};
