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

/**
 * Computes an angular direction "from" fX/fY "towards" tX/tY. If only fX/fY are supplied then it assumes fX/fY have
 * been translated. fX and fY can also be "entities"
 *
 * @param fX
 * @param fY
 * @param tX
 * @param tY
 * @returns A direction 0 = NONE, 1 = NW, 2 = N... 8 = E.
 */
function getAngualrDirectionFromTo ( fX, fY, tX, tY ) {

	if ( fX.app ) {
		// Getting passed in entities...
		return getAngualrDirectionFromTo( fX.app.x, fX.app.y, fY.app.x, fY.app.y );
	}

	tX = tX != null ? tX - fX : fX;
	tY = tY != null ? tY - fY : fY;

	if ( tX == 0 && tY == 0 ) return 0;

	const dir = Math.floor( (157.5 + ( Math.atan2( tY, tX ) * 180.0 / Math.PI ) ) / 45.0 );

	return dir >= 0 ? ( dir + 1) : 8;
}

/**
 * Computes a "Manhattan" direction "from" fX/fY "towards" tX/tY. If only fX/fY are supplied then it assumes fX/fY have
 * been translated. fX and fY can also be "entities"
 *
 * @param fX
 * @param fY
 * @param tX
 * @param tY
 * @returns A direction 0 = NONE, 1 = NW, 2 = N... 8 = E.
 */
function getManhattanDirectionFromTo (fX, fY, tX, tY ) {

	if ( fX.app ) {
		// Getting passed entities...
		return getManhattanDirectionFromTo( fX.app.x, fX.app.y, fY.app.x, fY.app.y );
	}

	let x, y;

	if ( fX == tX ) {
		x = 0;
	} else if ( fX < tX ) {
		x = 1;
	} else {
		x = -1;
	}

	if ( fY == tY ) {
		y = 0;
	} else if ( fY < tY ) {
		y = 1;
	} else {
		y = -1;
	}

	for ( let i = 0; i < DIRS.length; i++ ) {
		if ( DIRS[i].x == x && DIRS[i].y == y ) return i;
	}

	throw new Error( "Impossible direction." );
}

function getDistanceFromTo ( fX, fY, tX, tY ) {
	if ( fX.app ) return getDistanceFromTo( fX.app.x, fX.app.y, fY.app.x, fY.app.y );

	return Math.sqrt( Math.pow( (fX-tX), 2 ) + Math.pow( (fY-tY), 2 ) );
}

function createEntity( type, id, atX, atY ) {
	const entity = document.createElement( "div" );
	entity.classList.add( type );
	entity.classList.add( "entity" );

	entity.app = new Object();
	entity.app.id = id;
	entity.app.x = atX;
	entity.app.y = atY;

	return entity;
}

function* ids() {
	var index = 0;
	while ( index < index + 1 ) {
		yield index++;
	}
}

const enemyIds = ids();
function createEnemy ( atX, atY ) {
	return createEntity( "enemy", enemyIds.next().value, atX, atY );
}

const hazardIds = ids();
function createHazard ( atX, atY ) {
	return createEntity( "hazard", hazardIds.next().value, atX, atY );
}

function cullDead ( entities ) {
	for ( let i = 0; i < entities.length; i++ ) {
		if ( ! entities[ i ].parentElement ) {
			entities[i] = null;
		}
	}

	let index = entities.indexOf( null );

	while ( index >= 0 ) {
		entities.splice( index, 1 );
		index = entities.indexOf( null );
	}
}

function collided ( entityA, entityB ) {
	return entityA.app.x == entityB.app.x && entityA.app.y == entityB.app.y;
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

	// Clear grid
	for ( let i = 0; i < grid.rows.length; i++ ) {
		const row = grid.rows[ i ];
		for ( let j = 0; j < row.cells.length; j++ ) {
			row.cells[j].innerHTML = "";
		}
	}

	if ( player.app.level == 1 ) {
		// First level, place in center
		player.app.x = Math.floor( app.config.width / 2 );
		player.app.y = Math.floor( app.config.height / 2 );
	} else {
		// ...place randomly
		player.app.x = prng( 0, app.config.width );
		player.app.y = prng( 0, app.config.height );
	}

	player.app.isDead = false;

	placeOnGrid( player );

	const enemyCount = Math.round( app.config.startingEnemies + (app.config.enemyFactor * (player.app.level - 1) ) );

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
			placeOnGrid( enemy );
		}
	}

	app.hazards = new Array();

	player.app.attackCount += app.config.attackPerLevel;


	updateDisplay();

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
			// Possibly determined by configuration (difficulty and/or an option).
			// turnAction( enemy, getAngualrDirectionFromTo( enemy, app.player ) );
			turnAction( enemy, getManhattanDirectionFromTo( enemy, app.player ) );
		}
		turnEnd();
	}
}

function turnAction ( entity, action ) {

	if ( action >= 1 && action <= 8 ) {

		entity.app.x += DIRS[ action ].x;
		entity.app.y += DIRS[ action ].y;

		placeOnGrid( entity );
	} else if ( action == "attack" ) {
		const player = app.player;
		const enemies = app.enemies;

		player.app.attackCount--;

		for ( let i = 0; i < enemies.length; i++ ) {
			const enemy = enemies[ i ];
			const dist = getDistanceFromTo( player, enemy );
			if ( dist <= app.config.attackDistance ) {
				removeFromParent( enemy );

				const hazard = createHazard( enemy.app.x, enemy.app.y );
				app.hazards.push( hazard );
				placeOnGrid( hazard );

				console.debug( "pke", dist, enemy.app );
			}
		}

		cullDead( enemies );
	}

	turnEnd( entity );
}

function turnEnd ( entity ) {

	if ( entity == app.player ) {
		turnBegin();
	} else if ( entity == null ) {
		roundEnd();
	}
}

function roundEnd () {
	const player = app.player;
	const enemies = app.enemies;
	const hazards = app.hazards;
	const grid = app.grid;

	// Check enemy collisions
	for ( let i = 0; i < enemies.length; i++ ) {
		const enemy = enemies[ i ];

		// ...enemy to enemy
		for ( let j = 0; j < enemies.length; j++ ) {

			if ( i == j ) continue;

			const enem = enemies[ j ];

			if ( !enem.parentElement ) continue;

			if ( collided(enemy, enem) ) {
				removeFromParent( enemy );
				removeFromParent( enem );

				const hazard = createHazard( enemy.app.x, enemy.app.y );
				hazards.push( hazard );
				placeOnGrid( hazard );

				console.debug( "e2e", enemy.app, enem.app );
			}
		}

		if ( !enemy.parentElement ) continue;

		// ...enemy to hazard
		for ( let j = 0; j < hazards.length; j++ ) {
			const hazard = hazards[ j ];
			if ( collided( enemy, hazard ) ) {
				removeFromParent( enemy );

				console.debug( "e2h", enemy.app, hazard.app );
			}
		}

		if ( !enemy.parentElement ) continue;

		// ...enemy to player
		if ( collided( enemy, player ) ) {
			player.app.isDead = true;

			console.debug( "e2p", enemy.app, player.app );
		}
	}

	// Check Player to Hazard collision
	for ( let i = 0; i < hazards.length; i++ ) {
		const hazard = hazards[ i ];
		if ( collided( player, hazard ) ) {
			player.app.isDead = true;

			console.debug( "p2h", player.app, hazard.app );
		}
	}

	cullDead( enemies );

	updateDisplay();

	if ( app.player.app.isDead || app.enemies.length == 0 ) {
		levelEnd();
	} else {
		roundBegin();
	}
}

function levelEnd () {

	const player = app.player;

	if ( player.app.isDead ) {
		player.app.lives--;
	} else {
		player.app.level++;
	}

	if ( player.app.lives < 0 ) {
		gameEnd();
	} else {
		levelBegin();
	}
}

function gameEnd () {
	console.log( "...game end...", app.player.app.isDead ? "Player died" : "Player WINS" );
}

function updateDisplay () {
	const hud = app.hud;
	const player = app.player;
	const enemies = app.enemies;

	hud.lives.innerHTML = player.app.lives;
	hud.level.innerHTML = player.app.level;
	hud.attacks.innerHTML = player.app.attackCount;
	hud.score.innerHTML = player.app.score;
	hud.enemies.innerHTML = enemies.length;
	hud.mana.value = player.app.mana;

	app.controls.attack.disabled = player.app.attackCount < 1;

	if ( app.config.debug ) setDebug( true );
}

function placeOnGrid ( entity, atX, atY ) {
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

	const cell = app.grid.rows[ atY ].cells[ atX ];
	cell.appendChild( entity );

	return cell;
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

	app.config.attackPerLevel = 1;
	app.config.attackDistance = Math.sqrt( Math.pow( 1, 2 ) + Math.pow( 1, 2 ) );

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

	const dir = getAngualrDirectionFromTo( player.app.x, player.app.y, target.cellIndex, target.parentElement.rowIndex );

	turnAction( app.player, dir );
}

function playerAttack ( event ) {
	turnAction( app.player, "attack" );
}

function handleEvent ( event ) {

	let handler = null;

	if ( event.target == app.controls.play ) {
		handler = play;
	} else if ( event.currentTarget == app.grid ) {
		handler = playerMove;
	} else if ( event.target == app.controls.attack ) {
		handler = playerAttack;
	} else {
		console.warn( "Unkown event:", event, event.currentTarget );
	}

	if ( handler != null ) {
		Promise.resolve( event ).then( handler );
	}
}

function setDebug ( debug ) {
	app.config.debug = debug;
	for ( let i = 0; i < app.enemies.length; i++ ) {
		const enemy = app.enemies[ i ];
		enemy.innerHTML = debug ? enemy.app.id : "";
	}
	for ( let i = 0; i < app.hazards.length; i++ ) {
		const hazard = app.hazards[ i ];
		hazard.innerHTML = debug ? hazard.app.id : "";
	}
}

function cheat () {

	setDebug( true );

	const player = app.player;
	player.app.attackCount = 100;
	player.app.mana = 100;
	player.app.lives = 100;
	updateDisplay();

	return "Cheater!";
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
	app.config.debug = false;
	app.config.width = null;
	app.config.height = null;

	app.config.startingLevel = null;
	app.config.startingLives = null;
	app.config.startingAttacks = null;
	app.config.startingMana = null;

	app.config.startingEnemies = null;
	app.config.enemyFactor = null;

	app.config.attackPerLevel = null;
	app.config.attackDistance = null;

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
