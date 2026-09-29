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
        // 1. Master KPI / Tanggung Jawab Karyawan (diinput oleh Admin)
        Schema::create('employee_responsibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('target_indicator')->nullable();
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
        });

        // 2. Sesi Laporan Kerja Harian (Daily Work Report)
        Schema::create('daily_work_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('attendance_id')->nullable()->constrained('attendances')->onDelete('set null');
            $table->date('date');
            $table->text('summary')->nullable();
            $table->string('status')->default('draft'); // draft, submitted, reviewed_admin, reviewed_director
            $table->decimal('completion_rate', 5, 2)->default(0.00);
            
            // Admin review & rating
            $table->text('admin_notes')->nullable();
            $table->unsignedTinyInteger('admin_rating')->nullable(); // 1 - 5
            $table->foreignId('reviewed_by_admin_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Director review & rating
            $table->text('director_notes')->nullable();
            $table->unsignedTinyInteger('director_rating')->nullable(); // 1 - 5
            $table->foreignId('reviewed_by_director_id')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'date']);
            $table->index(['date', 'status']);
        });

        // 3. Butir-butir Tugas / To-Do List Harian
        Schema::create('daily_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_report_id')->constrained('daily_work_reports')->onDelete('cascade');
            $table->foreignId('responsibility_id')->nullable()->constrained('employee_responsibilities')->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable(); // Foto bukti kerja (< 2MB)
            $table->string('priority')->default('medium'); // low, medium, high
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled
            $table->timestamp('completed_at')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->index(['daily_work_report_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_tasks');
        Schema::dropIfExists('daily_work_reports');
        Schema::dropIfExists('employee_responsibilities');
    }
};
