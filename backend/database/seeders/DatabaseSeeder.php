<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@absen.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'karyawan@absen.com'],
            [
                'name' => 'Syaiful Karyawan',
                'password' => bcrypt('password'),
                'role' => 'employee',
            ]
        );

        \App\Models\OfficeSetting::updateOrCreate(
            ['id' => 1],
            [
                'latitude' => '-6.1942189',
                'longitude' => '106.815998',
                'radius' => 100,
            ]
        );
    }
}
