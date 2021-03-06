<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('files', function (Blueprint $table) {
            $table->increments('file_id');
            $table->string('name');
            $table->unsignedInteger('owner');
            $table->string('path')->unique()->nullable();
            $table->unsignedInteger('parent')->nullable();
            $table->boolean('needs_reciphering')->default(false);
            $table->timestamps();

            $table->foreign('owner')->references('user_id')->on('users');
            $table->foreign('parent')->references('file_id')->on('files');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('files');
    }
}
