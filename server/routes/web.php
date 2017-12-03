<?php

/* ------------------
 User-related routes
------------------ */

// Logs in
$app->post('login', 'UserController@login');

// Registers a new user
$app->post('register', 'UserController@register');

// Logs the user out
$app->group(['middleware' => 'auth'], function ($app) {
    $app->get('logout', 'UserController@logout');
});


/* ------------------
 File-related routes
------------------ */

$app->group(['middleware' => 'auth'], function ($app) {
  // Uploads a new file
  $app->put('file', 'FileController@upload');

  // Downloads a file with a specific ID
  $app->get('file/{file_id}', 'FileController@download');

  // Updates a file with a specific ID
  $app->put('file/{file_id}', 'FileController@update');

  // Renames a file with a specific ID
  $app->post('file/{file_id}', 'FileController@rename');

  // Deletes a file with a specific ID
  $app->delete('file/{file_id}', 'FileController@delete');

  // Shares a file with a specific ID with someone else
  $app->post('file/{file_id}/share', 'FileController@share');

  // Revokes share of a file with a specific ID with someone else
  $app->post('file/{file_id}/revoke', 'FileController@revoke');
});
