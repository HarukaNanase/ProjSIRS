<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
    /**
     * Disables timestamps
     */
    public $timestamps = false;

    /**
     * Overrides the primary key
     */
    protected $primaryKey = 'log_id';

    /**
    * The attributes that are mass assignable.
    *
    * @var array
    */
    protected $fillable = [
        'file_id', 'user_id', 'message'
    ];

    /**
    * The attributes that aren't mass assignable.
    *
    * @var array
    */
    protected $guarded = [
        'log_id', 'date',
    ];

    /**
    * The attributes excluded from the model's JSON form.
    *
    * @var array
    */
    protected $hidden = [
    ];
}
