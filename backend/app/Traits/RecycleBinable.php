<?php

namespace App\Traits;

use App\Models\RecycleBin;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @mixin \Illuminate\Database\Eloquent\Model
 */
trait RecycleBinable
{
    use SoftDeletes;

    /**
     * Boot the RecycleBinable trait for a model.
     */
    public static function bootRecycleBinable(): void
    {
        static::deleted(function ($model) {
            // If the model is being force deleted, don't create a recycle bin entry
            if (method_exists($model, 'isForceDeleting') && $model->isForceDeleting()) {
                return;
            }

            RecycleBin::create([
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'display_name' => $model->getRecycleBinName(),
                'deleted_at' => now(),
            ]);
        });

        static::restored(function ($model) {
            RecycleBin::where('model_type', get_class($model))
                ->where('model_id', $model->id)
                ->delete();
        });

        static::forceDeleted(function ($model) {
            RecycleBin::where('model_type', get_class($model))
                ->where('model_id', $model->id)
                ->delete();
        });
    }

    /**
     * Get a user-friendly name for this specific record in the Recycle Bin.
     */
    abstract public function getRecycleBinName(): string;
}
