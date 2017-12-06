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
     * Overrides the primary key
     */
    protected $primaryKey = 'file_id';

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
        'file_id',
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
     * Traverses through the file tree
     */
    public function treeTraverse() {
        $contents = [$this];
        if ($this->isDirectory()) {
            foreach (File::where('parent', $this->file_id)->get() as $file) {
                $contents = array_merge($file->treeTraverse(), $contents);
            }
        }

        return $contents;
    }

    public function isDirectory() {
        return empty($this->path);
    }

    /**
     * Define a one-to-many relationship
     */
    public function user(){
        return $this->belongsTo('App\User', 'user_id', 'owner');
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
        return $this->hasMany('App\File', 'parent', 'file_id');
    }

    /**
     * Define a one-to-many relationship
     */
    public function containedBy(){
        return $this->belongsTo('App\File', 'file_id', 'parent');
    }
}
