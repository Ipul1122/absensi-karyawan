<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;

class ImageHelper
{
    /**
     * Compress an uploaded image, resize it if it exceeds maxWidth,
     * convert it to WebP format, and save it to the specified public storage path.
     *
     * @param UploadedFile $file The uploaded file
     * @param string $folder The subfolder under public storage (e.g., 'photos', 'reimbursements/receipts')
     * @param int $maxWidth Maximum width of the image (default: 1000px)
     * @param int $quality WebP quality (0-100, default: 75)
     * @return string Saved relative path (to be stored in DB, e.g., 'photos/filename.webp')
     */
    public static function compressAndSaveWebp(UploadedFile $file, string $folder, int $maxWidth = 1000, int $quality = 75): string
    {
        // Generate a unique filename with .webp extension
        $filename = uniqid('img_', true) . '_' . time() . '.webp';
        $destinationPath = storage_path('app/public/' . $folder);
        
        // Create folder if it doesn't exist
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0775, true);
        }
        
        $fullPath = $destinationPath . '/' . $filename;
        
        // Try compressing with GD library
        try {
            $imageInfo = getimagesize($file->getRealPath());
            if ($imageInfo === false) {
                // Not an image, fallback to standard store
                return $file->store($folder, 'public');
            }
            
            $width = $imageInfo[0];
            $height = $imageInfo[1];
            $type = $imageInfo[2];
            
            // Load image based on type
            switch ($type) {
                case IMAGETYPE_JPEG:
                    $srcImage = imagecreatefromjpeg($file->getRealPath());
                    break;
                case IMAGETYPE_PNG:
                    $srcImage = imagecreatefrompng($file->getRealPath());
                    break;
                case IMAGETYPE_WEBP:
                    $srcImage = imagecreatefromwebp($file->getRealPath());
                    break;
                case IMAGETYPE_GIF:
                    $srcImage = imagecreatefromgif($file->getRealPath());
                    break;
                default:
                    // Unsupported type, fallback to standard store
                    return $file->store($folder, 'public');
            }
            
            if (!$srcImage) {
                return $file->store($folder, 'public');
            }
            
            // Calculate new dimensions if it exceeds max width
            if ($width > $maxWidth) {
                $newWidth = $maxWidth;
                $newHeight = (int)($height * ($maxWidth / $width));
                
                $dstImage = imagecreatetruecolor($newWidth, $newHeight);
                
                // Preserve transparency for PNG/WebP
                imagealphablending($dstImage, false);
                imagesavealpha($dstImage, true);
                
                imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($srcImage);
                $finalImage = $dstImage;
            } else {
                $finalImage = $srcImage;
            }
            
            // Set alpha blending & save alpha for webp
            imagealphablending($finalImage, false);
            imagesavealpha($finalImage, true);
            
            // Save as WebP
            imagewebp($finalImage, $fullPath, $quality);
            imagedestroy($finalImage);
            
            return $folder . '/' . $filename;
        } catch (\Exception $e) {
            // Fallback to standard store if GD fails
            return $file->store($folder, 'public');
        }
    }
}
