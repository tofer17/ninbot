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
	player.app.standing = null;

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
		return Math.floor( ( Math.random() * ( max - min ) ) + min );
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

function createBoss ( atX, atY ) {
	return createEntity( "boss", enemyIds.next().value * -1, atX, atY );
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

function endTextAnimation ( event ) {
	removeFromParent( event.target );
}

function animateText ( text, atEntity ) {
	const textNode = document.createElement( "div" );
	textNode.innerHTML = text;
	textNode.classList.add( "animated_text" );
	textNode.addEventListener( "animationend", endTextAnimation );
	atEntity.appendChild( textNode );
	startAnimation( textNode, "text_anim" );
}

function isBoss ( enemy ) {
	return enemy.classList.contains( "boss" );
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
		// ...place randomly (but not on edges)
		player.app.x = prng( 1, app.config.width - 1 );
		player.app.y = prng( 1, app.config.height - 1 );

		if ( player.app.x == 0 || player.app.y == 0 || player.app.x == app.config.width-1|| player.app.y == app.config.height-1) {
			console.error("Invalid starting coords", player.app);
		}
	}

	player.app.isDead = false;

	placeOnGrid( player );
	animateText( "Hi", player.parentElement );

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

	const maxBosses = 1 + Math.floor( player.app.level * app.config.boss.perLevelFactor );

	for ( let i = 0; i < maxBosses; i++ ) {
		const dieRoll = prng( 0.0, 99.0, player.app.level / maxBosses );
		const chance = player.app.level * app.config.boss.perLevelFactor * app.config.boss.chance;
		console.log( "DR:"+i+" of "+maxBosses, player.app.level, dieRoll, chance, dieRoll <= chance );
		if ( dieRoll <= chance ) {

			let bX = Math.floor( prng() * 4.0 );
			let bY;
			if ( bX == 0 ) {
				// North
				bX = prng( 0, app.config.width );
				bY = 0;
			} else if ( bX == 1 ) {
				// East
				bX = app.config.width - 1;
				bY = prng( 0, app.config.height );
			} else if ( bX == 2 ) {
				// South
				bX = prng( 0, app.config.width );
				bY = app.config.height - 1;
			} else {
				// West
				bX = 0;
				bY = prng( 0, app.config.height );
			}

			const boss = createBoss( bX, bY );
			enemies.push( boss );
			placeOnGrid( boss );
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
	player.app.standing = null;

	app.controls.teleport.classList.remove( "hidden" );
	app.controls.attack.classList.remove( "hidden" );
	app.controls.lastStand.classList.remove( "hidden" );

	app.controls.gameAction.classList.add( "hidden" );

	app.controls.teleport.disabled = false;
	app.controls.lastStand.disabled = false;

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

			// Bosses beat to a different drum!
			if ( isBoss( enemy ) ) {
				turnAction( enemy, getAngualrDirectionFromTo( enemy, app.player ) );
			} else {
				turnAction( enemy, getManhattanDirectionFromTo( enemy, app.player ) );
			}
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

			// Bosses are unaffected by attack
			if ( isBoss( enemy ) ) continue;

			const dist = getDistanceFromTo( player, enemy );
			if ( dist <= app.config.attackDistance ) {
				removeFromParent( enemy );

				const hazard = createHazard( enemy.app.x, enemy.app.y );
				app.hazards.push( hazard );
				placeOnGrid( hazard );

				const score = app.config.attackScore * ( player.app.standing != null ? app.config.lastStandBonus : 1 );
				player.app.score += score;
				animateText( "+" + score, hazard );
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
		const player = entity;

		if ( player.app.standing != null ) {
			window.clearTimeout( player.app.standing );
			player.app.standing = window.setTimeout( turnAction, app.config.lastStandTimeout, player, 0 );
		}
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

				if ( isBoss( enemy ) && isBoss( enem ) ) {
					// Spectacular collision
					console.debug( "B2B!!", enemy.app, enem.app );

					removeFromParent( enemy );
					removeFromParent( enem );
					const hazard = createHazard( enemy.app.x, enemy.app.y );
					placeOnGrid( hazard );
					animateDeath( hazard );

					const score = ( app.config.boss.score * 2 ) * ( player.app.standing != null ? app.config.lastStandBonus : 1 );
					player.app.score += score;
					animateText( "+" + score, hazard );

					for ( let k = 0; k < enemies.length; k++ ) {
						const en = enemies[ k ];
						if ( en == enemy || en == enem || !en.parentElement ) continue;
						const dist = getDistanceFromTo( enemy, en );
						if ( dist <= app.config.boss.explosionRadius ) {
							removeFromParent( en );

							const hazar = createHazard( en.app.x, en.app.y );
							app.hazards.push( hazar );
							placeOnGrid( hazar );

							const score = app.config.attackScore * ( player.app.standing != null ? app.config.lastStandBonus : 1 );
							player.app.score += score;
							animateText( "+" + score, hazar );
							console.debug( "bke", enemy.app, en.app );
						}

					}

				} else {

					let bossInvolved = false;

					if (!isBoss( enemy ) ) {
						removeFromParent( enemy );
					} else {
						bossInvolved = true;
					}

					if ( !isBoss( enem) ) {
						removeFromParent( enem );
					} else {
						bossInvolved = true;
					}

					if ( !bossInvolved ) {
						const hazard = createHazard( enemy.app.x, enemy.app.y );
						hazards.push( hazard );
						placeOnGrid( hazard );

						const score = app.config.enemyCollisionScore * ( player.app.standing != null ? app.config.lastStandBonus : 1 );
						player.app.score += score;
						animateText( "+" + score, hazard );
						console.debug( "e2e", enemy.app, enem.app );
					} else {
						console.debug( "b2e", enemy.app, enem.app );
					}
				}
			}
		}

		if ( !enemy.parentElement ) continue;

		// ...enemy to hazard
		for ( let j = 0; j < hazards.length; j++ ) {
			const hazard = hazards[ j ];
			if ( collided( enemy, hazard ) ) {
				if ( !isBoss( enemy ) ) {
					removeFromParent( enemy );

					animateDeath( hazard );

					const score = app.config.hazardCollisionScore * ( player.app.standing != null ? app.config.lastStandBonus : 1 );
					player.app.score += score;
					animateText( "+" + score, hazard );
					console.debug( "e2h", enemy.app, hazard.app );
				} else {
					// ...Boss hit hazard
					removeFromParent( hazard );
					animateDeath( enemy );
					console.debug( "b2h", enemy.app, hazard.app );
				}
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
			let amt = 0;
			if ( buff.classList.contains( "attackBuff" ) ) {
				amt = Math.round( prng( app.config.attackBuff.min, app.config.attackBuff.max, app.config.attackBuff.skew ) );
				player.app.attackCount += amt;
			} else if ( buff.classList.contains( "lifeBuff" ) ) {
				amt = Math.round( prng( app.config.lifeBuff.min, app.config.lifeBuff.max, app.config.lifeBuff.skew ) );
				player.app.lives += amt;
			}

			animateText( "+" + amt, player.parentElement );
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

	// Final boss check (bosses die if only they are left)
	let nonBossAlive = false;
	let haveBosses = false;
	for ( let i = 0; i < enemies.length; i++ ) {
		if ( !isBoss( enemies[ i ] ) ) {
			nonBossAlive = true;
		} else {
			haveBosses = true;
		}
	}

	if ( haveBosses && ! nonBossAlive ) {
		// We have nothing but bosses!
		for ( let i = 0; i < enemies.length; i++ ) {
			const boss = enemies[ i ];
			const hazard = createHazard( boss.app.x, boss.app.y );
			placeOnGrid( hazard );
			animateDeath( hazard );
			removeFromParent( boss );
			const score = app.config.boss.score * ( player.app.standing != null ? app.config.lastStandBonus : 1 );
			player.app.score += score;
			animateText( "+" + score, hazard );
		}

		cullDead( enemies );
	}

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

	if ( player.app.standing != null ) {
		window.clearTimeout( player.app.standing );
	}

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

	app.config = {
			width : 21,
			height : 21,

			startingLevel : 1,
			startingLives : 3,
			startingAttacks : 0,
			startingMana : 75,

			startingEnemies : 4,
			enemyFactor : 1.5,

			attackPerLevel : 1,
			attackDistance : Math.sqrt( Math.pow( 1, 2 ) + Math.pow( 1, 2 ) ),

			attackScore : 1,
			hazardCollisionScore : 3,
			enemyCollisionScore : 7,

			teleport : {
				check : 5,
				cost : 5,
				safeDistance : Math.sqrt( Math.pow( 1, 2 ) + Math.pow( 1, 2 ) )
			},

			mana : {
				limit : 100,
				upper : 75,
				lower : 10,
				resting : 15,
				perLevel : 10
			},

			attackBuff : {
				chance : 0.4,
				min : 2,
				max : 5,
				skew : 1.17
			},

			lifeBuff : {
				chance : 0.2,
				min : 1,
				max : 2,
				skew : 2.0
			},

			lastStandTimeout : 700,
			lastStandBonus : 2,

			boss : {
				perLevelFactor : 1.0 / Math.E,
				chance : 2.9, // Not used in usual way...
				score : 17,
				explosionRadius : Math.sqrt( Math.pow( 2, 2 ) + Math.pow( 2, 2 ) )
			}

		};


	gameBegin();
}

function playerMove ( event ) {
	const player = app.player;

	if ( player.app.isDead || player.app.standing != null || !app.controls.gameAction.classList.contains( "hidden" ) ) return;

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

function playerStands ( event ) {
	app.controls.teleport.disabled = true;
	app.controls.lastStand.disabled = true;
	app.player.app.standing = window.setTimeout( turnAction, 0, app.player, 0 );
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
	} else if ( event.target == app.controls.lastStand ) {
		handler = playerStands;
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

	//setDebug( true );

	const player = app.player;
	player.app.attackCount = 100;
	player.app.mana = 100;
	player.app.lives = 100;
	updateDisplay();

	return "Cheater!";
}

function killAll () {
	for ( let i = 0; i < app.enemies.length; i++ ) {
		removeFromParent( app.enemies[ i ] );
	}
	cullDead( app.enemies );
	turnAction( app.player, 0 );
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

	app.config = null;

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
