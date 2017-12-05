<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Access extends Model
{
    /**
     * Disables timestamps
     */
    public $timestamps = false;

    /**
    * The attributes that are mass assignable.
    *
    * @var array
    */
    protected $fillable = [
        'user_id', 'key', 'file_id',
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
    ];

    /**
     * Define a one-to-many relationship
     */
    public function user(){
        return $this->belongsTo('App\User');
    }

    /**
     * Define a one-to-many relationship
     */
    public function file(){
        return $this->belongsTo('App\File');
    }
}
