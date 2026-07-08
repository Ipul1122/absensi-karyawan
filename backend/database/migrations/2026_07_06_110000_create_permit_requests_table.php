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
        Schema::create('permit_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('category');
            $table->string('custom_category')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');
            $table->string('image')->nullable();
            $table->string('status')->default('pending'); // pending, pending_director, approved, rejected
            $table->text('admin_notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permit_requests');
    }
};
