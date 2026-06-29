<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Export the database as a SQL dump download.
     */
    public function exportDatabase()
    {
        $tables = Schema::getTableListing();

        $response = new StreamedResponse(function () use ($tables) {
            $handle = fopen('php://output', 'w');

            // Write database SQL headers
            fwrite($handle, "-- GoodPeople HCMS Database Backup\n");
            fwrite($handle, "-- Generated at: " . date('Y-m-d H:i:s') . "\n");
            fwrite($handle, "-- Laravel Version: " . app()->version() . "\n\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

            foreach ($tables as $table) {
                // Skip migrations if they are not needed, but generally keeping all is best
                fwrite($handle, "-- --------------------------------------------------------\n");
                fwrite($handle, "-- Table structure for table `$table`\n");
                fwrite($handle, "-- --------------------------------------------------------\n");
                fwrite($handle, "DROP TABLE IF EXISTS `$table`;\n");

                try {
                    $createTableResult = DB::select("SHOW CREATE TABLE `$table`");
                    if (!empty($createTableResult)) {
                        $createTableSql = ((array)$createTableResult[0])['Create Table'] ?? '';
                        fwrite($handle, $createTableSql . ";\n\n");
                    }
                } catch (\Exception $e) {
                    fwrite($handle, "-- Failed to get structure for `$table`: " . $e->getMessage() . "\n\n");
                    continue;
                }

                // Dump data
                fwrite($handle, "-- Dumping data for table `$table`\n");
                
                // Chunk records to prevent PHP out of memory errors
                DB::table($table)->orderBy(DB::raw('1'))->chunk(100, function ($rows) use ($handle, $table) {
                    foreach ($rows as $row) {
                        $rowArray = (array)$row;
                        $columns = array_keys($rowArray);
                        $escapedColumns = array_map(function ($col) {
                            return "`" . str_replace("`", "``", $col) . "`";
                        }, $columns);

                        $escapedValues = array_map(function ($val) {
                            if ($val === null) {
                                return 'NULL';
                            }
                            // Escape quotes and backslashes for SQL
                            return "'" . str_replace(["\\", "'"], ["\\\\", "\\'"], $val) . "'";
                        }, array_values($rowArray));

                        $sql = "INSERT INTO `$table` (" . implode(', ', $escapedColumns) . ") VALUES (" . implode(', ', $escapedValues) . ");\n";
                        fwrite($handle, $sql);
                    }
                });

                fwrite($handle, "\n");
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
            fclose($handle);
        });

        $filename = 'backup_goodpeople_hcms_' . date('Ymd_His') . '.sql';

        $response->headers->set('Content-Type', 'application/sql');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }

    /**
     * Import a SQL file to restore the database.
     */
    public function importDatabase(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file'
        ]);

        $file = $request->file('backup_file');
        $sql = file_get_contents($file->getRealPath());

        if (empty($sql)) {
            return response()->json([
                'status' => 'error',
                'message' => 'File backup kosong.'
            ], 400);
        }

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Execute the raw SQL backup file
            DB::unprepared($sql);

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'status' => 'success',
                'message' => 'Basis data berhasil dipulihkan dari file backup.'
            ]);
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memulihkan basis data: ' . $e->getMessage()
            ], 500);
        }
    }
}
