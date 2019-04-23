"use strict";
/**
 *
 */

function handleEvent ( event ) {
	console.log( event );
}

function main ( event ) {
	window.app = new Object();

	app.hud = document.querySelector( "#ninbot #hud");
	app.hud.lives = app.hud.querySelector( "#lives" );
	app.hud.level = app.hud.querySelector( "#level" );
	app.hud.enemies = app.hud.querySelector( "#enemies" );
	app.hud.score = app.hud.querySelector( "#score" );
	app.hud.attacks = app.hud.querySelector( "#attacks" );
	app.hud.mana = app.hud.querySelector( "#mana" );

	app.grid = document.querySelector( "#ninbot #grid");

	app.controls = document.querySelector( "#ninbot #controls");
	app.controls.game = app.controls.querySelector( "#game" );
	app.controls.teleport = app.controls.querySelector( "#teleport" );
	app.controls.attack = app.controls.querySelector( "#attack" );
	app.controls.lastStand = app.controls.querySelector( "#lastStand" );




	app.grid.addEventListener( "click", handleEvent );
	app.controls.game.addEventListener( "click", handleEvent );
	app.controls.teleport.addEventListener( "click", handleEvent );
	app.controls.attack.addEventListener( "click", handleEvent );
	app.controls.lastStand.addEventListener( "click", handleEvent );
}

window.addEventListener( "load", main );