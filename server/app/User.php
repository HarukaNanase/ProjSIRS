<?php

namespace App;

use Illuminate\Auth\Authenticatable;
use Laravel\Lumen\Auth\Authorizable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class User extends Model implements AuthenticatableContract, AuthorizableContract
{
    use Authenticatable, Authorizable;

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
        'username', 'email', 'password', 'public_key', 'private_key', 'api_token', 'api_token_expiration',
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
        'password',
    ];

    /**
     * Checks if a given password is valid
     * @param  string $password The password to match against
     * @return bool             Whether the password was valid
     */
    public function checkPassword(string $password) {
        return Hash::check($password, $this->password);
    }

    /**
     * Generates a new API token with the specified validity
     * @param  int    expirationSeconds Lifespan for the requested API token
     * @return string                   The generated API token
     */
    public function generateToken(int $expirationSeconds) {
        $this->api_token = Hash::make($this->id . Carbon::now()->toDateTimeString() . bin2hex(random_bytes(8)));
        $this->api_token_expiration = Carbon::now()->addSeconds($expirationSeconds);
        $this->save();

        return $this->api_token;
    }

    /**
     * Checks whether a user's API request is valid
     * @param  string $api_token (Optional) The API token to validate
     * @return bool              Whether the user is cleared for API access
     */
    public function checkToken(string $api_token = null) {
        if (!empty($api_token)) {
            if ($api_token != $this->api_token) {
                return false;
            }
        }

        return Carbon::parse($this->api_token_expiration)->gt(Carbon::now());
    }

    /**
     * Invalidates a user's API token
     */
    public function invalidateToken() {
        $this->api_token = null;
        $this->api_token_expiration = Carbon::createFromTimestamp(-1);
        $this->save();
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
    public function files(){
        return $this->hasMany('App\File', 'owner', 'id');
    }

    /**
     * Define a one-to-many relationship
     */
    public function logs(){
        return $this->hasMany('App\Log');
    }
}
