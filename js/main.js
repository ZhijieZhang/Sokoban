const gameLevel = [
	`..............
	 ....######....
	 ....#@...#....
	 ....####=#....
	 .......#.#....
	 .......#O#....
	 .......###....
	 ..............`
];
const validKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const scale = 40;

let Vec = {
	init(x, y) {
		this.x = x;
		this.y = y;
	},

	plus(anotherVec) {
		let newVec = Object.create(Vec);
		newVec.init(this.x + anotherVec.x, this.y + anotherVec.y);
		return newVec;
	},

	times(factor) {
		let newVec = Object.create(Vec);
		newVec.init(this.x * factor, this.y * factor);
		return newVec;
	}
}

let Level = {
	init(plan) {
    let rows = plan.split('\n').map(row => row.trim()).map(row => [...row]);
    this.width = rows[0].length;
    this.height = rows.length;
    this.actors = []; // Player, box, or hole.
    this.rows = rows.map((row, y) => {
    	return row.map((ch, x) => {
    		let gameChar = gameChars[ch];
    		if (typeof gameChar === 'string') // This char is either 'empty' or 'wall'
    			return gameChar;
        // Either a player, a box, or a hole. 
        // Making them as objects is because their states can change during the game
        let position = Object.create(Vec);
        position.init(x, y);
    		this.actors.push(gameChar.create(position));
    		return 'floor'; // I want to draw actors separatly
    	})
    });
	},

	touch(pos, type) {
		if (this.rows[pos.y][pos.x] === type) {
			return true;
		}
		return false;
	}
};

let State = {
	init(level, actors, status) {
		this.level = level;
		this.actors = actors;
		this.status = status;
	},

	start(level) {
		let newState = Object.create(State);
		newState.init(level, level.actors, 'playing');
		return newState;
	},

	update(key) {
		let actors = this.actors.map(actor => actor.update(key, this));
		let newState = Object.create(State);
		newState.init(this.level, actors, this.status);
		let newPlayer = newState.player;
		for (let actor of actors) {
			if (actor !== newPlayer && this.overlap(actor, newPlayer)) {
				console.log('hit');
				let stateBeforeMove = newState;
				newState = actor.move(newState);
				// newState didn't change after we tried to move the box,
				// which means the box hits a wall. Therefore we return the original
				// state (the state before player moves)
				if (newState === stateBeforeMove) return this;
			}
		}
		// Check if all the boxes are in holes.
		let allInHoles = newState.actors.every(actor => {
			if (actor === newPlayer) return true;
			return actor.state === 'inHole';
		});
		if (allInHoles) 
			newState.init(newState.level, newState.actors, 'finish');
		return newState;
	},

	overlap(actor1, actor2) {
		return actor1.pos.x === actor2.pos.x && actor1.pos.y === actor2.pos.y;
	},

	get player() {
		return this.actors.find(a => a.type === 'player');
	}
};

let Player = {
	init(pos, direction) {
		this.pos = pos;
		this.direction = direction;
	},

	create(pos, direction = 'down') {
		let newPlayer = Object.create(Player);
		newPlayer.init(pos, direction);
		return newPlayer;		
	},

	update(key, state) {
		let newPlayer, direction, newPos;
		let move = Object.create(Vec);
		if (key === 'ArrowLeft') {
			move.init(-1,0);
			direction = 'left';
		} else if (key === 'ArrowRight') {
			move.init(1,0);
			direction = 'right';
		} else if (key === 'ArrowUp') {
			move.init(0,-1);
			direction = 'up';
		} else {
			move.init(0,1);
			direction = 'down';
		}
		newPos = this.pos.plus(move);
		newPlayer = this.create(newPos, direction);
		// If player's new position hits the wall, don't move player.
		if (state.level.touch(newPos, 'wall'))
			return this.create(this.pos, direction);
		return newPlayer;
	},

	type: 'player'
};

let Box = {
	init(pos, state) { // state for a box: in hole or not.
		this.pos = pos;
		this.state = state; 
	},

	create(pos, state = 'notInHole') {
		let newBox = Object.create(Box);
		newBox.init(pos, state);
		return newBox;		
	},

	update(key, status) { // A box itself won't update, it can only be moved by a player.
		return this;
	},

	move(state) {
		let direction = state.player.direction;
		let newPos, newBox;
		let move = Object.create(Vec);
		let newState = Object.create(State);
		if (direction === 'left') {
			move.init(-1, 0);
		} else if (direction === 'right') {
			move.init(1, 0);
		} else if (direction === 'up') {
			move.init(0, -1);
		} else {
			move.init(0, 1);
		}
		newPos = this.pos.plus(move);
		if (state.level.touch(newPos, 'wall'))
			return state;
		if (state.level.touch(newPos, 'hole')) 
			newBox = this.create(newPos, 'inHole');
		else
			newBox = this.create(newPos);
		let newActors = state.actors.map(actor => {
			if (actor === this) return newBox;
			return actor;
		});
		newState.init(state.level, newActors, state.status);
		return newState;
	},

	type: 'box'
};

const gameChars = {
	'.': 'floor',
	'#': 'wall',
	'O': 'hole',
	'@': Player,
	'=': Box
};

let CanvasDisplay = {
	init(parent, level) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = Math.min(1000, level.width * scale);
		this.canvas.height = Math.min(800, level.height * scale);
		this.cx = this.canvas.getContext('2d');
		parent.appendChild(this.canvas);
	},

	setState(state) {
		this.drawBackground(state.level);
		this.drawActors(state.actors); 
	},

	drawBackground(level) {
		this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		level.rows.forEach((row, y) => {
			row.forEach((tile, x) => {
				let posX = x * scale;
				let posY = y * scale;
				if (tile === 'floor') {
					this.cx.drawImage(floor, posX, posY, scale, scale);
				} else if (tile === 'wall') { 
					this.cx.drawImage(wall, posX, posY, scale, scale);
				} else {
					this.cx.drawImage(floor, posX, posY, scale, scale); // Background of hole image has white content.
					this.cx.drawImage(hole, posX, posY, scale, scale);
				}
			})
		});
	},

	drawActors(actors) {
		actors.forEach(actor => {
			let posX = actor.pos.x * scale;
			let posY = actor.pos.y * scale;
			if (actor.type === 'player') {
				// Use different images based on the direction of play is facing.
				if (actor.direction === 'left')
					this.cx.drawImage(leftFig, posX, posY, scale, scale);
				else if (actor.direction === 'right') 
					this.cx.drawImage(rightFig, posX, posY, scale, scale);
				else if (actor.direction === 'up')
					this.cx.drawImage(upFig, posX, posY, scale, scale);
				else
					this.cx.drawImage(downFig, posX, posY, scale, scale);
			} else { // Actor is box. Draw it based on its state
				if (actor.state === 'notInHole')
					this.cx.drawImage(box, posX, posY, scale, scale);
				else 
					this.cx.drawImage(boxIn, posX, posY, scale, scale);
			}
		})	
	},

	clear(parent, element) {
		parent.removeChild(element);
	}
}

function runLevel(stage) {
	let level = Object.create(Level);
	level.init(gameLevel[stage]);
	state = State.start(level);
	canvasDis = Object.create(CanvasDisplay);
	canvasDis.init(document.body, level);
	canvasDis.setState(state);
}

let box = document.createElement('img');
let boxIn = document.createElement('img');
let floor = document.createElement('img');
let wall = document.createElement('img');
let hole = document.createElement('img');
let leftFig = document.createElement('img');
let rightFig = document.createElement('img');
let upFig = document.createElement('img');
let downFig = document.createElement('img');
box.src = 'image/box.png';
boxIn.src = 'image/box_inhole.png';
floor.src = 'image/floor.png'
wall.src = 'image/wall.png';
hole.src = 'image/hole.png';
leftFig.src = 'image/left.png';
rightFig.src = 'image/right.png';
upFig.src = 'image/up.png';
downFig.src = 'image/down.png';

let state;
let canvasDis;
let stage = 0;

function update(event) {
	if (validKeys.includes(event.key)) {
		state = state.update(event.key);
		canvasDis.setState(state);
		if (state.status === 'finish') {
			if (stage === gameLevel.length-1) {
				window.removeEventListener('keydown', update);
				setTimeout(() => alert('Congrats! You have finished all the Levels.'), 0);
			} else {
				canvasDis.clear(document.body, canvasDis.canvas);
				runLevel(++stage);
			}
		}
	}
}

window.addEventListener('keydown', update);

window.onload = () => {
	runLevel(0); 
}


