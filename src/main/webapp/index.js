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
	const player = createEntity( "player", 0 );

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
		// return a uniform random integer [min..max)
		return Math.floor( ( Math.random() * max - min ) + min );
	} else {
		// Return a skewed normal random number [min..max)

	    let u = 0;
	    let v = 0;

	    while( u == 0 ) u = Math.random(); // Converting [0,1) to (0,1)
	    while( v == 0 ) v = Math.random();

	    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

	    num = num / 10.0 + 0.5; // Translate to 0 -> 1
	    if ( num > 1 || num < 0 ) num = prng( min, max, skew ); // resample between 0 and 1 if out of range
	    num = Math.pow( num, skew ); // Skew
	    num *= max - min; // Stretch to fill range
	    num += min; // offset to min
	    return num;

		// console.warn( "BM PRNG function not yet implemented" );
		// return prng( min, max );
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
	entity.lastAction = "created";

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
	const hazard = createEntity( "hazard", hazardIds.next().value, atX, atY );

	animateDeath( hazard );

	return hazard;
}

const buffIds = ids();
function createBuff ( type, atX, atY ) {
	const buff = createEntity( type, buffIds.next().value, atX, atY );

	animateBirth( buff );

	return buff;
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

function endAnimation ( event ) {
	event.target.classList.remove( event.animationName );
}

function startAnimation ( element, animationName ) {
	element.addEventListener( "animationend", endAnimation );
	element.classList.add( animationName );
}

function animateDeath ( element ) {
	startAnimation( element, "death_anim" );
}

function animateBirth ( element ) {
	startAnimation( element, "birth_anim" );
}

function animatePickup ( element ) {
	startAnimation( element, "pickup_anim" );
}


/**
 * Begins Game: create the grid and player.
 *
 * @returns
 */
function gameBegin ( e ) {

	createGrid( app.grid, app.config.width, app.config.height );

	app.player = createPlayer( app.config );

	app.controls.teleport.disabled = false;
	app.controls.lastStand.disabled = false;

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

	const buffs = new Array();
	app.buffs = buffs;

	// Attack Buffs
	if ( player.app.level == 1 || ( player.app.level % 17 == 0 ) || prng() <= app.config.attackBuff.chance ) {

		const howMany = player.app.level % 17 == 0 ? 17 : ( prng() <= 0.2 ? 2 : 1 );

		for ( let i = 0; i < howMany; i++ ) {
			const buff = createBuff( "attackBuff", prng( 0, app.config.width), prng( 0, app.config.height) );
			buffs.push( buff );
			placeOnGrid( buff );
		}
	}

	// Life buffs
	if ( prng() <= app.config.lifeBuff.chance && player.app.level > 1 ) {
		const buff = createBuff( "lifeBuff", Math.round( prng( 0, app.config.width, 1.0 ) ), Math.round( prng( 0, app.config.height, 1.0 ) ) );
		buffs.push( buff );
		placeOnGrid( buff );
	}

	app.hazards = new Array();

	player.app.attackCount += app.config.attackPerLevel;
	player.app.mana += app.config.mana.perLevel;
	if ( player.app.mana > app.config.mana.limit ) player.app.mana = app.config.mana.limit;

	app.controls.teleport.classList.remove( "hidden" );
	app.controls.attack.classList.remove( "hidden" );
	app.controls.lastStand.classList.remove( "hidden" );

	app.controls.gameAction.classList.add( "hidden" );


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

	entity.app.lastAction = action;

	if ( action >= 1 && action <= 8 ) {

		entity.app.x += DIRS[ action ].x;
		entity.app.y += DIRS[ action ].y;

		placeOnGrid( entity );
	} else if ( entity == app.player && action == 0 ) {
		entity.app.mana += app.config.mana.resting;
		if ( entity.app.mana > app.config.mana.limit ) entity.app.mana = app.config.mana.limit;
	} else if ( entity != app.player && action == 0 ) {
		console.error( "DEATH BY TP" );
	} else if ( action == "attack" ) {
		const player = entity;
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

				player.app.score += app.config.attackScore;
				console.debug( "pke", dist, enemy.app );
			}
		}

		cullDead( enemies );
	} else if ( action == "teleport" ) {
		const player = entity;
		const enemies = app.enemies;
		const hazards = app.hazards;

		let notYet = true;
		let tX, tY;

		while ( notYet ) {

			notYet = false;
			tX = prng( app.config.width, app.config.height );
			tY = prng( app.config.width, app.config.height );

			if ( player.app.mana >= app.config.mana.upper ) {
				// Attempt safe-next-move teleport
				// A) Is it onto a hazard?
				for ( let i = 0; i < hazards.length; i++ ) {
					const hazard = hazards[ i ];
					const dist = getDistanceFromTo( tX, tY, hazard.app.x, hazard.app.y );
					if ( dist < 1.0 ) {
						notYet = true;
						break;
					}
				}

				if ( notYet ) break;

				// B) Is it far enough away from Enemies?
				for ( let i = 0; i < enemies.length; i++ ) {
					const enemy = enemies[ i ];
					const dist = getDistanceFromTo( tX, tY, enemy.app.x, enemy.app.y );
					if ( dist <= app.config.teleport.safeDistance ) {
						notYet = true;
						break;
					}
				}

				console.debug( "SNM-TP", !notYet );

			} else if ( player.app.mana >= app.config.mana.lower ) {
				// Attempt not-onto teleport
				// A) Is it onto a hazard?
				for ( let i = 0; i < hazards.length; i++ ) {
					const hazard = hazards[ i ];
					const dist = getDistanceFromTo( tX, tY, hazard.app.x, hazard.app.y );
					if ( dist < 1.0 ) {
						notYet = true;
						break;
					}
				}

				if ( notYet ) break;

				// B) Is it far enough away from Enemies?
				for ( let i = 0; i < enemies.length; i++ ) {
					const enemy = enemies[ i ];
					const dist = getDistanceFromTo( tX, tY, enemy.app.x, enemy.app.y );
					if ( dist <= 1.0 ) {
						notYet = true;
						break;
					}
				}

				console.debug( "NO-TP", !notYet );

			} else {
				notYet = false;

				console.debug( "R-TP", !notYet );
			}

			player.app.mana -= app.config.teleport.check;
		}

		player.app.mana -= app.config.teleport.cost;
		if ( player.app.mana < 0 ) player.app.mana = 0;

		player.app.x = tX;
		player.app.y = tY;

		placeOnGrid( player );
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
	const buffs = app.buffs;
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

				player.app.score += app.config.enemyCollisionScore;
				console.debug( "e2e", enemy.app, enem.app );
			}
		}

		if ( !enemy.parentElement ) continue;

		// ...enemy to hazard
		for ( let j = 0; j < hazards.length; j++ ) {
			const hazard = hazards[ j ];
			if ( collided( enemy, hazard ) ) {
				removeFromParent( enemy );

				animateDeath( hazard );

				player.app.score += app.config.hazardCollisionScore;
				console.debug( "e2h", enemy.app, hazard.app );
			}
		}

		if ( !enemy.parentElement ) continue;

		// ...enemy to buff
		for ( let i = 0; i < buffs.length; i++ ) {
			const buff = buffs[ i ];
			if ( collided( enemy, buff ) ) {
				removeFromParent( buff );
				console.debug( "e2b", enemy.app, buff.app );
			}
		}

		// ...enemy to player
		if ( collided( enemy, player ) ) {
			player.app.isDead = true;

			console.debug( "e2p", enemy.app, player.app );
		}
	}

	// Check Player collisions
	// ...Player to buff
	for ( let i = 0; i < buffs.length; i++ ) {
		const buff = buffs[ i ];
		if ( collided( player, buff ) ) {
			if ( buff.classList.contains( "attackBuff" ) ) {
				const amt = Math.round( prng( app.config.attackBuff.min, app.config.attackBuff.max, app.config.attackBuff.skew ) );
				player.app.attackCount += amt;
			} else if ( buff.classList.contains( "lifeBuff" ) ) {
				const amt = Math.round( prng( app.config.lifeBuff.min, app.config.lifeBuff.max, app.config.lifeBuff.skew ) );
				player.app.lives += amt;
			}

			console.debug( "p2b", player.app, buff.app );
			removeFromParent( buff );
		}
	}

	// ...Player to hazard
	for ( let i = 0; i < hazards.length; i++ ) {
		const hazard = hazards[ i ];
		if ( collided( player, hazard ) ) {
			player.app.isDead = true;

			console.debug( "p2h", player.app, hazard.app );
		}
	}

	cullDead( enemies );
	cullDead( buffs );

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

	app.controls.teleport.classList.add( "hidden" );
	app.controls.attack.classList.add( "hidden" );
	app.controls.lastStand.classList.add( "hidden" );

	app.controls.gameAction.classList.remove( "hidden" );

	if ( player.app.lives <= 0 ) {
		app.controls.gameAction.innerHTML = "Game Over!";
	} else if ( player.app.isDead ) {
		app.controls.gameAction.innerHTML = "They got you!";
	} else {
		app.controls.gameAction.innerHTML = "Excelent job!";
	}
}

function gameEnd () {
	displayIntro();
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

	app.config.attackScore = 1;
	app.config.hazardCollisionScore = 3;
	app.config.enemyCollisionScore = 7;

	app.config.teleport.check = 5;
	app.config.teleport.cost = 5;
	app.config.teleport.safeDistance = Math.sqrt( Math.pow( 1, 2 ) + Math.pow( 1, 2 ) );

	app.config.mana.limit = 100;
	app.config.mana.upper = 75;
	app.config.mana.lower = 10;
	app.config.mana.resting = 15;
	app.config.mana.perLevel = 10;

	app.config.attackBuff.chance = 0.4;
	app.config.attackBuff.min = 2;
	app.config.attackBuff.max = 5;
	app.config.attackBuff.skew = 1.17;

	app.config.lifeBuff.chance = 0.2;
	app.config.lifeBuff.min = 1;
	app.config.lifeBuff.max = 2;
	app.config.lifeBuff.skew = 2.0;

	gameBegin();
}

function playerMove ( event ) {
	const player = app.player;

	if ( player.app.isDead ) return;

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

function gameAction ( event ) {
	if ( app.player.app.lives <= 0 ) {
		gameEnd();
	} else {
		levelBegin();
	}
}

function playerTeleport ( event ) {
	turnAction( app.player, "teleport" );
}

function handleEvent ( event ) {

	let handler = null;

	if ( event.target == app.controls.play ) {
		handler = play;
	} else if ( event.currentTarget == app.grid ) {
		handler = playerMove;
	} else if ( event.target == app.controls.attack ) {
		handler = playerAttack;
	} else if ( event.target == app.controls.gameAction ) {
		handler = gameAction;
	} else if ( event.target == app.controls.teleport ) {
		handler = playerTeleport;
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

	app.config.attackScore = null;
	app.config.hazardCollisionScore = null;
	app.config.enemyCollisionScore = null;

	app.config.teleport = new Object();
	app.config.teleport.check = null;
	app.config.teleport.cost = null;
	app.config.teleport.safeDistance = null;

	app.config.mana = new Object();
	app.config.mana.limit = null;
	app.config.mana.upper = null;
	app.config.mana.lower = null;
	app.config.mana.resting = null;

	app.config.attackBuff = new Object();
	app.config.attackBuff.chance = null;
	app.config.attackBuff.min = null;
	app.config.attackBuff.max = null;
	app.config.attackBuff.skew = null;

	app.config.lifeBuff = new Object();
	app.config.lifeBuff.chance = null;
	app.config.lifeBuff.min = null;
	app.config.lifeBuff.max = null;
	app.config.lifeBuff.skew = null;


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
