<?php

/* ------------------
 User-related routes
------------------ */

// Logs in
$router->post('login', 'UserController@login');

// Registers a new user
$router->post('register', 'UserController@register');

// Requires authentication
$router->group(['middleware' => 'auth'], function ($router) {
    // Renews session
    $router->get('renew', 'UserController@renew');

    // Logs the user out
    $router->get('logout', 'UserController@logout');
});


/* ------------------
 File-related routes
------------------ */

// Requires authentication
$router->group(['middleware' => 'auth'], function ($router) {
  // Uploads a new file
  $router->post('file', 'FileController@upload');

  // Gets the root directory
  $router->get('file', 'FileController@root');

  // Downloads a file with a specific ID
  $router->get('file/{file_id}', 'FileController@download');

  // Updates a file with a specific ID
  $router->put('file/{file_id}', 'FileController@update');

  // Renames a file with a specific ID
  $router->post('file/{file_id}', 'FileController@rename');

  // Deletes a file with a specific ID
  $router->delete('file/{file_id}', 'FileController@delete');

  // Shares a file with a specific ID with someone else
  $router->post('file/{file_id}/share', 'FileController@share');

  // Revokes share of a file with a specific ID with someone else
  $router->post('file/{file_id}/revoke', 'FileController@revoke');
});

/* -------------------
 Miscellaneous routes
------------------- */

// Brews coffee
$router->get('brew', 'TeapotController@brew');
$router->post('brew', 'TeapotController@brew');
