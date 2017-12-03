<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    /**
    * The attributes that are mass assignable.
    *
    * @var array
    */
    protected $fillable = [
        'name', 'parent',
    ];

    /**
    * The attributes that aren't mass assignable.
    *
    * @var array
    */
    protected $guarded = [
        'id', 'owner', 'path',
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
