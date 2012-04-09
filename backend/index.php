<?php

/*
 * 
 * Markers: lat, lng
 * 
 * Play: edit_key, end_time
 * 
 * Event: edit_key, start_time?, end_time, brief
 * 
 * Camp: passphrase, categories, items
 * 
 */

$create = false;
if(!file_exists('db.sqlite'))
	$create = true;

$db = new PDO('sqlite:db.sqlite');

if($db === false)
	die('Error creating database file.');

if($create) {
	$result = $db->exec("CREATE TABLE `markers` (
		`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
		`kind` TINYINT,
		`lat` FLOAT,
		`lng` FLOAT,
		`time` FLOAT
	)");
	
	$result = $db->exec("CREATE TABLE `play` (
		`where` INTEGER,
		`time` INTEGER
	)");
	
	if($result === false)
		die('Error creating database structure.');
}
