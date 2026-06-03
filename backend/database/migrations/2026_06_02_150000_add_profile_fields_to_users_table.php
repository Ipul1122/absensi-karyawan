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
        Schema::table('users', function (Blueprint $table) {
            $table->string('photo')->nullable()->after('email');
            $table->date('date_of_birth')->nullable()->after('photo');
            $table->text('address')->nullable()->after('date_of_birth');
            $table->string('employee_number')->nullable()->unique()->after('address');
            $table->date('join_date')->nullable()->after('employee_number');
            $table->string('gender')->nullable()->after('join_date'); // 'male' | 'female'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['photo', 'date_of_birth', 'address', 'employee_number', 'join_date', 'gender']);
        });
    }
};
