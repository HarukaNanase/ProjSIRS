<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    /**
     * Disables timestamps
     */
    public $timestamps = true;

    /**
    * The attributes that are mass assignable.
    *
    * @var array
    */
    protected $fillable = [
        'name', 'parent', 'owner', 'path', 'needs_reciphering',
    ];

    /**
    * The attributes that aren't mass assignable.
    *
    * @var array
    */
    protected $guarded = [
        'id',
    ];

    /**
    * The attributes excluded from the model's JSON form.
    *
    * @var array
    */
    protected $hidden = [
        'path',
    ];

    /**
     * Recursively deletes this file/folder
     */
    public function recursivelyDelete() {
        if (!empty($this->path)) {
            unlink($this->path);
        }

        $files = File::where('parent', $this->id)->get();

        foreach ($files as $file) {
            $file->recursivelyDelete();
        }

        $this->delete();
    }

    /**
     * Define a one-to-many relationship
     */
    public function user(){
        return $this->belongsTo('App\User', 'id', 'owner');
    }

    /**
     * Define a one-to-many relationship
     */
    public function accesses(){
        return $this->hasMany('App\Access');
    }

    /**
     * Define a one-to-many relationship
     */
    public function contains(){
        return $this->hasMany('App\File', 'parent', 'id');
    }

    /**
     * Define a one-to-many relationship
     */
    public function containedBy(){
        return $this->belongsTo('App\File', 'id', 'parent');
    }
}
