# CipherBox - G26

CipherBox is a document sharing platform focused on absolute privacy and nearly-complete detachment from server logic, with some compromises to keep usability.

------

* [Client Installation](#client-installation)
* [Server Installation](#server-installation)

### Client Installation

### Server Installation

Development environment:

* MariaDB Version 10.1.28
* Apache 2.4.29
* PHP 7.1.1

These were used in the development environment, and so should be stable. PHP versions below 7 will not work at all. When using other versions, your mileage may vary.

The development environment was run using [XAMPP](https://www.apachefriends.org/download.html) for Windows, for simplicity, but the packages (Apache/NGINX, PHP, MariaDB/MySQL) can be installed on other environments. There shouldn't be any issues as long as recent versions of those packages are used, as the only real requirement is the use of PHP7.

In Windows machines, and Linux machines, make sure that PHP executables are found in your PATH environment variable, otherwise the php commands used below will fail.

#### Setting up the environment

After a local copy of the project is setup, and the above requirements installed, open a terminal, and move to the project's directory, and to the "server" subfolder.

First, we will [install composer](https://getcomposer.org/download/), which can be done by running the following 3 commands:

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
```

After that is done, packages need to be updated, so run the following command:

```bash
php composer.phar update
```

All done, the environment is now configured!

#### Configuring the application

The server needs the .env file to be copied from the .env.example file and to have its values changed, namely the database details. A properly configured .env file should look something like this:

```php
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_TIMEZONE=UTC

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cipherbox
DB_USERNAME=cipherbox
DB_PASSWORD=ZFR3oxshM376CZH8

CACHE_DRIVER=file
QUEUE_DRIVER=sync

FILE_STORAGE=files

API_TOKEN_LIFETIME=3600
API_TOKEN_RENEW_LIFETIME=1800
```

If copying in Windows, you will not be able to keep a file named ".env" unless you rename it through the terminal. So, if in the folder, just execute the following command:

```bash
copy .env.example .env
```

#### Preparing database

The database can be automatically populated by Lumen/Laravel after it is correctly configured in the .env file.

```bash
php artisan migrate
```

#### Purging database

If for some reason you wish to reset the database, the following command can be used, which will automatically drop all tables and recreate them:

```bash
php artisan migrate:refresh
```

#### Configuring PHP

There are two configuration values, in php.ini, that need to be configured for the application to work correctly. They only need to be increased so that the server accepts larger files, with the default limit being 2MB. We recommend increasing this limit to at least 32MB, just so that reasonably-large files can be tested.

The values that have to be tweaked are the following:

* post_max_size
* upload_max_filesize

If both those values are set to 32MB, then files up to around 32MB will be uploadable.

#### Additional configurations

If this application were to be deployed in real-world scenarios, HTTPS would need to be in place, mainly to prevent replay attacks and session hijacking. Data would remain confidential even if both the server and the network were completely controlled by an attacker, but all platform usability would go out the door.

HTTPS could be deployed through a reverse-proxy and coupled with free LetsEncrypt certificates. For the purposes of this project, we will not detail how to configure an apache2/nginx reverse proxy and LetsEncrypt.

The application does not enforce HTTPS, as that would be up to the reverse-proxy to enforce.
