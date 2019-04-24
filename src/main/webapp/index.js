"use strict";
/**
 *
 */

function createGrid ( grid, width, height ) {

	grid.innerHTML = "";

	for ( let i = 0; i < height; i++ ) {
		const tr = grid.insertRow();
		for ( let j = 0; j < width; j++ ) {
			const td = tr.insertCell();
		}
	}
}

function createPlayer ( config ) {
	const player = document.createElement( "div" );
	player.classList.add( "player" );
	player.classList.add( "entity" );

	player.app = new Object();
	player.app.x = null;
	player.app.y = null;

	player.app.lives = config.startingLives;
	player.app.level = config.startingLevel;
	player.app.score = 0;
	player.app.attackCount = config.startingAttacks;
	player.app.mana = config.startingMana;

	player.app.isDead = false;

	return player;
}

/**
 * Generates a random number.
 *
 * @param min
 * @param max
 * @param skew
 * @returns
 */
function prng ( min, max, skew ) {
	if ( min == null || max == null ) {
		// Return a uniform random number [0..1)
		return Math.random();
	} else if ( skew == null ) {
		// return a uniform random number [min..max)
		return Math.floor( ( Math.random() * max - min ) + min );
	} else {
		// Return a skewed normal random number [min..max)
		console.warn( "BM PRNG function not yet implemented" );
		return prng( min, max );
	}
}

function removeFromParent ( entity ) {
	if ( entity.parentElement ) entity.parentElement.removeChild( entity );
}

function placeOnGrid ( grid, entity, atX, atY ) {
	removeFromParent( entity );

	if ( atX == null ) {
		atX = entity.app.x;
	} else {
		entity.app.x = atX;
	}

	if ( atY == null ) {
		atY = entity.app.y;
	} else {
		entity.app.y = atY;
	}

	const cell = grid.rows[ atY ].cells[ atX ];
	cell.appendChild( entity );

	return cell;
}

/**
 * Computes a cardinal direction "from" fX/fY "towards" tX/tY. If only fX/fY are supplied then it assumes fX/fY have
 * been translated. fX and fY can also be "entities"
 *
 * @param fX
 * @param fY
 * @param tX
 * @param tY
 * @returns A direction 0 = NONE, 1 = NW, 2 = N... 8 = E.
 */
function getDirectionFromTo ( fX, fY, tX, tY ) {

	if ( fX.app ) {
		// Getting passed in entities...
		tX = fY.app.x;
		tY = fY.app.y;

		fY = fX.app.y
		fX = fX.app.x
	}

	tX = tX != null ? tX - fX : fX;
	tY = tY != null ? tY - fY : fY;

	if ( tX == 0 && tY == 0 ) return 0;

	const dir = Math.floor( (157.5 + ( Math.atan2( tY, tX ) * 180.0 / Math.PI ) ) / 45.0 );

	return dir >= 0 ? ( dir + 1) : 8;
}

const DIRS = new Array();
DIRS[0] = {x: 0, y: 0}; // --
DIRS[1] = {x:-1, y:-1}; // NW
DIRS[2] = {x: 0, y:-1}; // N
DIRS[3] = {x: 1, y:-1}; // NE
DIRS[4] = {x: 1, y: 0}; // E
DIRS[5] = {x: 1, y: 1}; // SE
DIRS[6] = {x: 0, y: 1}; // S
DIRS[7] = {x:-1, y: 1}; // SW
DIRS[8] = {x:-1, y: 0}; // W

function createEnemy ( atX, atY ) {
	const enemy = document.createElement( "div" );
	enemy.classList.add( "enemy" );
	enemy.classList.add( "entity" );

	enemy.app = new Object();
	enemy.app.x = atX;
	enemy.app.y = atY;

	return enemy;
}

/**
 * Begins Game: create the grid and player.
 *
 * @returns
 */
function gameBegin ( e ) {

	createGrid( app.grid, app.config.width, app.config.height );

	app.player = createPlayer( app.config );

	levelBegin();
}

/**
 * Begins the level: places player on grid, creates and places enemies
 *
 * @returns
 */
function levelBegin () {
	const player = app.player;
	const grid = app.grid;

	if ( player.app.level == 1 ) {
		// First level, place in center
		player.app.x = Math.floor( app.config.width / 2 );
		player.app.y = Math.floor( app.config.height / 2 );
	} else {
		// ...place randomly
		player.app.x = prng( 0, app.config.width );
		player.app.y = prng( 0, app.config.height );
	}

	placeOnGrid( grid, player );

	const enemyCount = app.config.startingEnemies + (app.config.enemyFactor * (player.app.level - 1) );

	const enemies = new Array( enemyCount );
	app.enemies = enemies;

	for ( let i = 0; i < enemyCount; i++ ) {

		const eX = prng( 0, app.config.width );
		const eY = prng( 0, app.config.height );

		if ( eX == player.app.x && eY == player.app.y ) {
			i--;
		} else {
			const enemy = createEnemy( eX, eY );
			enemies[ i ] = enemy;
			placeOnGrid( grid, enemy );
		}
	}

	roundBegin();
}

function roundBegin () {

	turnBegin( app.player );
}

function turnBegin ( entity ) {

	if ( entity == app.player ) {

	} else if ( entity == null ) {
		for ( let i = 0; i < app.enemies.length; i++ ) {
			const enemy = app.enemies[ i ];
			turnAction( enemy, getDirectionFromTo( enemy, app.player ) );
		}
		turnEnd();
	}
}

function turnAction ( entity, action ) {

	if ( action >= 1 && action <= 8 ) {

		entity.app.x += DIRS[ action ].x;
		entity.app.y += DIRS[ action ].y;

		placeOnGrid( app.grid, entity );
	}

	if ( entity == app.player ) {
		turnEnd( entity );
	}
}

function turnEnd ( entity ) {

	if ( entity == app.player ) {
		turnBegin();
	} else if ( entity == null ) {
		roundEnd();
	}
}

function roundEnd () {

	console.log( "...check collisions..." );

	if ( app.player.app.isDead || app.enemies.length == 0 ) {
		levelEnd();
	} else {
		roundBegin();
	}
}

function levelEnd () {

	if ( app.player.app.isDead || app.enemies.length == 0 ) {
		gameEnd();
	} else {
		levelBegin();
	}
}

function gameEnd () {
	console.log( "...game end..." );
}

function displayIntro () {

	app.intro.classList.remove( "hidden" );
	app.game.classList.add( "dim" );

	app.controls.gameAction.classList.add( "hidden" );
	app.controls.teleport.disabled = true;
	app.controls.attack.disabled = true;
	app.controls.lastStand.disabled = true;

	app.controls.play.disabled = false;
}

/**
 * Hides intro, displays and starts game.
 *
 * @returns
 */
function play () {

	app.intro.classList.add( "hidden" );
	app.controls.play.disabled = true;

	app.game.classList.remove( "dim" );

	// TODO: Pull these values from intro
	app.config.width = 21;
	app.config.height = 21;

	app.config.startingLevel = 1;
	app.config.startingLives = 3;
	app.config.startingAttacks = 0;
	app.config.startingMana = 75;

	app.config.startingEnemies = 4;
	app.config.enemyFactor = 1.5;

	gameBegin();
}

function playerMove ( event ) {
	const player = app.player;

	let target = event.target;

	if ( event.target.tagName != "TD" ) {
		target = event.target.parentElement;
	}

	if ( target.tagName != "TD" ) {
		console.warn( "Drag!"  );
		return;
	}

	const tX = target.cellIndex - player.app.x;
	const tY = target.parentElement.rowIndex - player.app.y;

	const dir = getDirectionFromTo( player.app.x, player.app.y, target.cellIndex, target.parentElement.rowIndex );

	turnAction( app.player, dir );

}

function handleEvent ( event ) {

	let handler = null;

	if ( event.target == app.controls.play ) {
		handler = play;
	} else if ( event.currentTarget == app.grid ) {
		handler = playerMove;
	} else {
		console.warn( "Unkown event:", event, event.currentTarget );
	}

	if ( handler != null ) {
		Promise.resolve( event ).then( handler );
	}
}

function main ( event ) {
	window.app = new Object();

	app.intro = document.querySelector( "#ninbot #intro" );
	app.intro.hst = app.intro.querySelector( "hst" );

	app.game = document.querySelector( "#ninbot #game" );

	app.hud = document.querySelector( "#ninbot #hud" );
	app.hud.lives = app.hud.querySelector( "#lives" );
	app.hud.level = app.hud.querySelector( "#level" );
	app.hud.enemies = app.hud.querySelector( "#enemies" );
	app.hud.score = app.hud.querySelector( "#score" );
	app.hud.attacks = app.hud.querySelector( "#attacks" );
	app.hud.mana = app.hud.querySelector( "#mana" );

	app.grid = document.querySelector( "#ninbot #grid" );
	// Just create a grid to show for intro for now.
	createGrid( app.grid, 21, 21 );

	app.controls = document.querySelector( "#ninbot #controls" );
	app.controls.gameAction = app.controls.querySelector( "#game_action" );
	app.controls.teleport = app.controls.querySelector( "#teleport" );
	app.controls.attack = app.controls.querySelector( "#attack" );
	app.controls.lastStand = app.controls.querySelector( "#lastStand" );
	// Keep "play" with other controls
	app.controls.play = app.intro.querySelector( "#play" );

	app.player = null;
	app.enemies = null;
	app.buffs = null;
	app.hazards = null;

	app.config = new Object();
	app.config.width = null;
	app.config.height = null;

	app.config.startingLevel = null;
	app.config.startingLives = null;
	app.config.startingAttacks = null;
	app.config.startingMana = null;

	app.config.startingEnemies = null;
	app.config.enemyFactor = null;

	app.grid.addEventListener( "click", handleEvent );
	app.controls.gameAction.addEventListener( "click", handleEvent );
	app.controls.teleport.addEventListener( "click", handleEvent );
	app.controls.attack.addEventListener( "click", handleEvent );
	app.controls.lastStand.addEventListener( "click", handleEvent );
	app.controls.play.addEventListener( "click", handleEvent );

	displayIntro();
	play();
}

window.addEventListener( "load", main );
