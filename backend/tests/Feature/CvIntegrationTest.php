<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CvIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_upload_and_retrieve_cv()
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'role' => 'employee',
        ]);

        Sanctum::actingAs($user);

        // 1. Check getProfile returns null cv initially
        $response = $this->getJson('/api/user/profile');
        $response->assertStatus(200)
            ->assertJsonPath('data.cv', null);

        // 2. Upload CV
        $file = UploadedFile::fake()->create('my_cv.pdf', 100, 'application/pdf');

        $response = $this->postJson('/api/user/profile', [
            'name' => $user->name,
            'email' => $user->email,
            'cv' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $user->refresh();
        $this->assertNotNull($user->cv);
        Storage::disk('public')->assertExists($user->cv);

        // 3. Check getProfile returns correct cv path
        $response = $this->getJson('/api/user/profile');
        $response->assertStatus(200)
            ->assertJsonPath('data.cv', asset('storage/' . $user->cv));
    }

    public function test_admin_can_retrieve_and_update_employee_cv()
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $employee = User::factory()->create([
            'role' => 'employee',
        ]);

        Sanctum::actingAs($admin);

        // 1. Get employee profile
        $response = $this->getJson('/api/employees/' . $employee->id . '/profile');
        $response->assertStatus(200)
            ->assertJsonPath('data.cv', null);

        // 2. Update employee CV as admin
        $file = UploadedFile::fake()->create('employee_cv.docx', 200, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $response = $this->postJson('/api/employees/' . $employee->id . '/profile', [
            'name' => $employee->name,
            'email' => $employee->email,
            'cv' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $employee->refresh();
        $this->assertNotNull($employee->cv);
        Storage::disk('public')->assertExists($employee->cv);

        // 3. Confirm retrieval
        $response = $this->getJson('/api/employees/' . $employee->id . '/profile');
        $response->assertStatus(200)
            ->assertJsonPath('data.cv', asset('storage/' . $employee->cv));
    }
}
