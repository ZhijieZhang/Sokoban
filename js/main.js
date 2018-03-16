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
      let actor = gameChar.create(position);
  		this.actors.push(actor);
  		if (actor.type === 'box' && actor.state === 'inHole')
  			return 'hole';
  		return 'floor';
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
			if (actor !== newPlayer && this.overlap(actor.pos, newPlayer.pos)) {
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

	overlap(pos1, pos2) {
		return pos1.x === pos2.x && pos1.y === pos2.y;
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
		} else if (key === 'ArrowDown') {
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
		} else if (direction === 'down') {
			move.init(0, 1);
		}
		newPos = this.pos.plus(move);
		if (state.level.touch(newPos, 'wall'))
			return state;
		if (state.actors.some(actor => state.overlap(actor.pos, newPos)))
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

let BoxInHole = {
	create(pos) {
		return Box.create(pos, 'inHole');
	}
}

let CanvasDisplay = {
	init(parent, level) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = level.width * scale;
		this.canvas.height = level.height * scale;
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

let state;
let canvasDis;
let undos;
let stage = 0;
let gameDiv = document.querySelector('#game');
let undoIcon = document.querySelector('#undo');
let helpIcon = document.querySelector('#help');
let gotoIcon = document.querySelector('#goto');
let input = document.querySelector('input');
const gameChars = {
	'.': 'floor',
	'#': 'wall',
	'O': 'hole',
	'@': Player,
	'=': Box,
	'+': BoxInHole,
};
const validMoveKeys = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'];
const scale = 40;

function runLevel(stage) {
	undos = [];
	let level = Object.create(Level);
	level.init(gameLevel[stage]);
	state = State.start(level);
	canvasDis = Object.create(CanvasDisplay);
	canvasDis.init(gameDiv, level);
	canvasDis.setState(state);
}

function update(event) {
	if (!validMoveKeys.includes(event.key)) return;
	undos.push(state);
	state = state.update(event.key);
	canvasDis.setState(state);
	if (state.status === 'finish') {
		if (stage === gameLevel.length-1) {
			window.removeEventListener('keydown', update);
			setTimeout(() => alert('Congrats! You have finished all the Levels.'), 0);
		} else {
			// I set a timeout before the next level starts,
			// so that the user can see all the boxes are in holes for a short time
			// feel be proud(?) of that
			setTimeout(() => {
				canvasDis.clear(gameDiv, canvasDis.canvas);
				runLevel(++stage);
			}, 500);
		}
	}
}

function undo(event) {
	if (undos.length !== 0) {
		state = undos.pop();
		canvasDis.setState(state);
	}
}

function toggleHelpInfo(event) {
	$('#help-info').fadeToggle('3000');
}

function toggleGoto(event) {
	$('#goto-level').fadeToggle('2000');
}

function gotoOtherLevel(event) {
	if (event.key === 'Enter') {
		let level = event.target.value;
		if (level >= 0 && level < gameLevel.length) {
			canvasDis.clear(gameDiv, canvasDis.canvas);
			runLevel(level);
			toggleGoto();
		}
	}
}

window.addEventListener('keydown', update);
undoIcon.addEventListener('click', undo);
helpIcon.addEventListener('click', toggleHelpInfo);
gotoIcon.addEventListener('click', toggleGoto);
input.addEventListener('keydown', gotoOtherLevel);

window.onload = () => {
	runLevel(stage); // stage is initially 0
}



