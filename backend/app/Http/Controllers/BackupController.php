<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\Reimbursement;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    /**
     * Backup employee data and download as a ZIP file.
     * Accessible by Admin or Director.
     */
    public function backup(Request $request)
    {
        // Increase memory limit and execution time for large data compile
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        // 1. Get all employees & admins with their salary configurations
        $employees = User::whereIn('role', ['employee', 'admin'])
            ->with('salaryConfiguration')
            ->orderBy('id', 'asc')
            ->get();

        if ($employees->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada data karyawan untuk dibackup.'
            ], 404);
        }

        // 2. Instantiate custom Pure PHP Zip Writer
        $zip = new PureZip();

        // 3. Write Master CSV: daftar_karyawan.csv
        $masterCsvStream = fopen('php://temp', 'r+');
        // Write CSV UTF-8 BOM for Excel compatibility
        fprintf($masterCsvStream, chr(0xEF).chr(0xBB).chr(0xBF));
        
        fputcsv($masterCsvStream, [
            'ID Karyawan', 'Nama Lengkap', 'Email', 'No Karyawan (NIP)', 'Divisi', 
            'Perusahaan', 'No WhatsApp', 'No Rekening', 'Lokasi Kantor', 'Tanggal Lahir', 
            'Alamat', 'Tanggal Bergabung', 'Jenis Kelamin', 'Libur Sabtu', 'Libur Minggu', 
            'Status Akun', 'Tanggal Terdaftar',
            'Gaji Pokok', 'Tunjangan Makan Harian', 'Tunjangan Transport Harian', 'Tunjangan Jabatan',
            'Potongan Terlambat Harian', 'Potongan Mangkir Harian', 'Potongan Tetap'
        ]);

        foreach ($employees as $emp) {
            $sc = $emp->salaryConfiguration;
            fputcsv($masterCsvStream, [
                $emp->id,
                $emp->name,
                $emp->email,
                $emp->employee_number ?? '-',
                $emp->division ?? '-',
                $emp->company ?? '-',
                $emp->whatsapp ?? '-',
                $emp->no_rekening ?? '-',
                ucfirst($emp->office_location ?? 'jakarta'),
                $emp->date_of_birth ?? '-',
                $emp->address ?? '-',
                $emp->join_date ?? '-',
                $emp->gender === 'male' ? 'Laki-laki' : ($emp->gender === 'female' ? 'Perempuan' : '-'),
                $emp->saturday_off ? 'Ya' : 'Tidak',
                $emp->sunday_off ? 'Ya' : 'Tidak',
                ucfirst($emp->status ?? 'active'),
                $emp->created_at ? $emp->created_at->format('Y-m-d H:i:s') : '-',
                $sc ? (float)$sc->basic_salary : 0,
                $sc ? (float)$sc->allowance_meal_daily : 0,
                $sc ? (float)$sc->allowance_transport_daily : 0,
                $sc ? (float)$sc->allowance_position : 0,
                $sc ? (float)$sc->deduction_late_daily : 0,
                $sc ? (float)$sc->deduction_absence_daily : 0,
                $sc ? (float)$sc->deduction_fixed : 0
            ]);
        }

        rewind($masterCsvStream);
        $masterCsvContent = stream_get_contents($masterCsvStream);
        fclose($masterCsvStream);
        
        $zip->addFile('daftar_karyawan.csv', $masterCsvContent);

        // 4. Process each employee folders
        foreach ($employees as $emp) {
            // Folder name prefix
            $empFolderCleanName = str_replace([' ', '/', '\\', ':', '*', '?', '"', '<', '>', '|'], '_', $emp->name);
            $empNumber = $emp->employee_number ? str_replace([' ', '/', '\\', ':', '*', '?', '"', '<', '>', '|'], '_', $emp->employee_number) : 'ID_' . $emp->id;
            $folderName = 'karyawan_' . $empNumber . '_' . $empFolderCleanName . '/';

            // Add Profile / Biodata text file
            $sc = $emp->salaryConfiguration;
            $bioText = "==================================================\n";
            $bioText .= "            BIODATA LENGKAP KARYAWAN              \n";
            $bioText .= "==================================================\n\n";
            $bioText .= "ID Database      : " . $emp->id . "\n";
            $bioText .= "Nama Lengkap     : " . $emp->name . "\n";
            $bioText .= "Email            : " . $emp->email . "\n";
            $bioText .= "Nomor Karyawan   : " . ($emp->employee_number ?? '-') . "\n";
            $bioText .= "Divisi           : " . ($emp->division ?? '-') . "\n";
            $bioText .= "Perusahaan       : " . ($emp->company ?? '-') . "\n";
            $bioText .= "WhatsApp         : " . ($emp->whatsapp ?? '-') . "\n";
            $bioText .= "No Rekening      : " . ($emp->no_rekening ?? '-') . "\n";
            $bioText .= "Lokasi Kantor    : " . ucfirst($emp->office_location ?? 'jakarta') . "\n";
            $bioText .= "Tanggal Lahir    : " . ($emp->date_of_birth ?? '-') . "\n";
            $bioText .= "Alamat           : " . ($emp->address ?? '-') . "\n";
            $bioText .= "Tanggal Gabung   : " . ($emp->join_date ?? '-') . "\n";
            $bioText .= "Jenis Kelamin    : " . ($emp->gender === 'male' ? 'Laki-laki' : ($emp->gender === 'female' ? 'Perempuan' : '-')) . "\n";
            $bioText .= "Libur Sabtu      : " . ($emp->saturday_off ? 'Ya' : 'Tidak') . "\n";
            $bioText .= "Libur Minggu     : " . ($emp->sunday_off ? 'Ya' : 'Tidak') . "\n";
            $bioText .= "Status Akun      : " . ucfirst($emp->status ?? 'active') . "\n";
            $bioText .= "Terdaftar Pada   : " . ($emp->created_at ? $emp->created_at->format('Y-m-d H:i:s') : '-') . "\n\n";
            
            $bioText .= "==================================================\n";
            $bioText .= "            INFORMASI GAJI KARYAWAN               \n";
            $bioText .= "==================================================\n";
            $bioText .= "Gaji Pokok                : Rp " . ($sc ? number_format($sc->basic_salary, 0, ',', '.') : '0') . "\n";
            $bioText .= "Tunjangan Makan / Hari    : Rp " . ($sc ? number_format($sc->allowance_meal_daily, 0, ',', '.') : '0') . "\n";
            $bioText .= "Tunjangan Transport / Hari: Rp " . ($sc ? number_format($sc->allowance_transport_daily, 0, ',', '.') : '0') . "\n";
            $bioText .= "Tunjangan Jabatan         : Rp " . ($sc ? number_format($sc->allowance_position, 0, ',', '.') : '0') . "\n";
            $bioText .= "Potongan Terlambat / Hari : Rp " . ($sc ? number_format($sc->deduction_late_daily, 0, ',', '.') : '0') . "\n";
            $bioText .= "Potongan Mangkir / Hari   : Rp " . ($sc ? number_format($sc->deduction_absence_daily, 0, ',', '.') : '0') . "\n";
            $bioText .= "Potongan Tetap Bulanan    : Rp " . ($sc ? number_format($sc->deduction_fixed, 0, ',', '.') : '0') . "\n\n";

            $zip->addFile($folderName . 'biodata_lengkap.txt', $bioText);

            // Add profile photo from storage if exists
            if ($emp->photo) {
                $cleanPhotoPath = str_replace(['/storage/', 'storage/'], '', $emp->photo);
                if (Storage::disk('public')->exists($cleanPhotoPath)) {
                    $ext = pathinfo($cleanPhotoPath, PATHINFO_EXTENSION);
                    $zip->addFile($folderName . 'foto_profil.' . ($ext ?: 'webp'), Storage::disk('public')->get($cleanPhotoPath));
                }
            }

            // Add CV file from storage if exists
            if ($emp->cv) {
                $cleanCvPath = str_replace(['/storage/', 'storage/'], '', $emp->cv);
                if (Storage::disk('public')->exists($cleanCvPath)) {
                    $ext = pathinfo($cleanCvPath, PATHINFO_EXTENSION);
                    $zip->addFile($folderName . 'cv_karyawan.' . ($ext ?: 'pdf'), Storage::disk('public')->get($cleanCvPath));
                }
            }

            // Write 4.1 Attendance CSV
            $attendances = $emp->attendances()->orderBy('date', 'desc')->get();
            if ($attendances->isNotEmpty()) {
                $stream = fopen('php://temp', 'r+');
                fprintf($stream, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($stream, ['Tanggal', 'Masuk (Clock In)', 'Status Masuk', 'Foto Masuk', 'Catatan Masuk', 'Keluar (Clock Out)', 'Status Keluar', 'Foto Keluar', 'Catatan Keluar']);
                foreach ($attendances as $att) {
                    fputcsv($stream, [
                        $att->date,
                        $att->clock_in ?? '-',
                        ucfirst($att->status_in ?? '-'),
                        $att->photo_in ? 'Ada (Berkas Sistem)' : '-',
                        $att->notes_in ?? '-',
                        $att->clock_out ?? '-',
                        ucfirst($att->status_out ?? '-'),
                        $att->photo_out ? 'Ada (Berkas Sistem)' : '-',
                        $att->notes_out ?? '-'
                    ]);
                }
                rewind($stream);
                $zip->addFile($folderName . 'riwayat_absensi.csv', stream_get_contents($stream));
                fclose($stream);
            }

            // Write 4.2 Leave Request CSV
            $leaves = $emp->leaveRequests()->orderBy('start_date', 'desc')->get();
            if ($leaves->isNotEmpty()) {
                $stream = fopen('php://temp', 'r+');
                fprintf($stream, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($stream, ['Kategori', 'Kategori Kustom', 'Tanggal Mulai', 'Tanggal Selesai', 'Alasan', 'Status', 'Catatan Admin/Direktur']);
                foreach ($leaves as $lv) {
                    fputcsv($stream, [
                        ucfirst($lv->category),
                        $lv->custom_category ?? '-',
                        $lv->start_date,
                        $lv->end_date,
                        $lv->reason,
                        ucfirst($lv->status),
                        $lv->admin_notes ?? '-'
                    ]);
                }
                rewind($stream);
                $zip->addFile($folderName . 'riwayat_cuti.csv', stream_get_contents($stream));
                fclose($stream);
            }

            // Write 4.3 Payroll History CSV
            $payrolls = $emp->payrolls()->orderBy('period_month', 'desc')->get();
            if ($payrolls->isNotEmpty()) {
                $stream = fopen('php://temp', 'r+');
                fprintf($stream, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($stream, ['Periode (Bulan)', 'Hadir (Hari)', 'Terlambat (Hari)', 'Cuti (Hari)', 'Gaji Pokok', 'Tunjangan Transport', 'Tunjangan Tetap', 'Potongan Terlambat', 'Potongan Tetap', 'Gaji Bersih (Net)', 'Status Pembayaran', 'Tanggal Dibayar']);
                foreach ($payrolls as $pay) {
                    fputcsv($stream, [
                        $pay->period_month,
                        $pay->days_present,
                        $pay->days_late,
                        $pay->days_leave,
                        $pay->basic_salary,
                        $pay->allowance_transport,
                        $pay->allowance_fixed,
                        $pay->deduction_late,
                        $pay->deduction_fixed,
                        $pay->net_salary,
                        ucfirst($pay->status),
                        $pay->paid_at ?? '-'
                    ]);
                }
                rewind($stream);
                $zip->addFile($folderName . 'riwayat_payroll.csv', stream_get_contents($stream));
                fclose($stream);
            }

            // Write 4.4 Reimbursement CSV
            $reimbursements = $emp->reimbursements()->orderBy('expense_date', 'desc')->get();
            if ($reimbursements->isNotEmpty()) {
                $stream = fopen('php://temp', 'r+');
                fprintf($stream, chr(0xEF).chr(0xBB).chr(0xBF));
                fputcsv($stream, ['Tanggal Pengeluaran', 'Judul', 'Kategori', 'Jumlah', 'Deskripsi', 'Status', 'Catatan Admin']);
                foreach ($reimbursements as $reimb) {
                    fputcsv($stream, [
                        $reimb->expense_date,
                        $reimb->title,
                        ucfirst($reimb->category),
                        $reimb->amount,
                        $reimb->description ?? '-',
                        ucfirst($reimb->status),
                        $reimb->admin_notes ?? '-'
                    ]);
                }
                rewind($stream);
                $zip->addFile($folderName . 'riwayat_reimbursement.csv', stream_get_contents($stream));
                fclose($stream);
            }
        }

        // 5. Download the file stream
        $filename = 'Backup_Karyawan_' . date('d_M_Y_H_i') . '.zip';
        return response($zip->getZip(), 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}

/**
 * Pure PHP Zip Writer (STORE mode)
 * Does not require php-zip extension or ZipArchive class.
 */
class PureZip
{
    private $files = [];
    private $zipContent = '';
    private $offset = 0;

    /**
     * Add a file to the ZIP archive.
     *
     * @param string $name Name of the file inside the ZIP.
     * @param string $content Contents of the file.
     */
    public function addFile($name, $content)
    {
        // Normalize name: use forward slashes and trim
        $name = trim(str_replace('\\', '/', $name));
        
        $time = time();
        $dtime = getdate($time);
        $hexdtime = pack('V', (($dtime['mday'] & 0x1f) << 16) |
                             (($dtime['mon'] & 0x0f) << 21) |
                             ((($dtime['year'] - 1980) & 0x7f) << 25) |
                             (($dtime['seconds'] >> 1) & 0x1f) |
                             (($dtime['minutes'] & 0x3f) << 5) |
                             (($dtime['hours'] & 0x1f) << 11));

        $uncLen = strlen($content);
        $crc = crc32($content);

        // Local file header signature (PK\x03\x04)
        $localHeader = "\x50\x4b\x03\x04";
        $localHeader .= "\x0a\x00"; // version needed to extract (10)
        $localHeader .= "\x00\x08"; // general purpose bit flag (UTF-8 filename)
        $localHeader .= "\x00\x00"; // compression method (0 = stored)
        $localHeader .= $hexdtime;  // last mod file time and date
        $localHeader .= pack('V', $crc); // crc-32
        $localHeader .= pack('V', $uncLen); // compressed size
        $localHeader .= pack('V', $uncLen); // uncompressed size
        $localHeader .= pack('v', strlen($name)); // file name length
        $localHeader .= "\x00\x00"; // extra field length
        $localHeader .= $name;

        $this->zipContent .= $localHeader . $content;

        $this->files[] = [
            'name' => $name,
            'crc' => $crc,
            'uncLen' => $uncLen,
            'hexdtime' => $hexdtime,
            'offset' => $this->offset
        ];

        $this->offset += strlen($localHeader) + $uncLen;
    }

    /**
     * Generate the complete ZIP file content.
     *
     * @return string
     */
    public function getZip()
    {
        $ctrlDir = '';
        foreach ($this->files as $file) {
            // Central directory file header signature (PK\x01\x02)
            $ctrlDir .= "\x50\x4b\x01\x02";
            $ctrlDir .= "\x14\x00"; // version made by (20)
            $ctrlDir .= "\x0a\x00"; // version needed to extract (10)
            $ctrlDir .= "\x00\x08"; // general purpose bit flag (UTF-8)
            $ctrlDir .= "\x00\x00"; // compression method (stored)
            $ctrlDir .= $file['hexdtime'];
            $ctrlDir .= pack('V', $file['crc']);
            $ctrlDir .= pack('V', $file['uncLen']);
            $ctrlDir .= pack('V', $file['uncLen']);
            $ctrlDir .= pack('v', strlen($file['name']));
            $ctrlDir .= "\x00\x00"; // extra field length
            $ctrlDir .= "\x00\x00"; // file comment length
            $ctrlDir .= "\x00\x00"; // disk number start
            $ctrlDir .= "\x00\x00"; // internal file attributes
            $ctrlDir .= pack('V', 32); // external file attributes (archive attribute)
            $ctrlDir .= pack('V', $file['offset']); // offset of local header
            $ctrlDir .= $file['name'];
        }

        // End of central directory record signature (PK\x05\x06)
        $eocd = "\x50\x4b\x05\x06";
        $eocd .= "\x00\x00"; // number of this disk
        $eocd .= "\x00\x00"; // disk where central directory starts
        $eocd .= pack('v', count($this->files)); // number of central directory records on this disk
        $eocd .= pack('v', count($this->files)); // total number of central directory records
        $eocd .= pack('V', strlen($ctrlDir)); // size of central directory
        $eocd .= pack('V', strlen($this->zipContent)); // offset of start of central directory relative to archive start
        $eocd .= "\x00\x00"; // comment length

        return $this->zipContent . $ctrlDir . $eocd;
    }
}
