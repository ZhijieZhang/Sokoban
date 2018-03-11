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

	get player() {
		return this.actors.find(a => a.type === 'player');
	}
};

let Player = {
	init(pos) {
		this.pos = pos;
	},

	create(pos) {
		let newPlayer = Object.create(Player);
		newPlayer.init(pos);
		return newPlayer;		
	},

	type: 'player'
};

let Box = {
	init(pos) {
		this.pos = pos;
	},

	create(pos) {
		let newBox = Object.create(Box);
		newBox.init(pos);
		return newBox;		
	},

	type: 'box'
};

let Hole = {
	init(pos) {
		this.pos = pos;
	},

	create(pos) {
		let newHole = Object.create(Hole);
		newHole.init(pos);
		return newHole;		
	},

	type: 'hole'
};

const gameChars = {
	'.': 'floor',
	'#': 'wall',
	'@': Player,
	'=': Box,
	'O': Hole
};

const scale = 50;

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
				} else { // background has either floor or wall.
					this.cx.drawImage(wall, posX, posY, scale, scale);
				}
			})
		});
	},

	drawActors(actors) {
		actors.forEach(actor => {
			let posX = actor.pos.x * scale;
			let posY = actor.pos.y * scale;
			if (actor.type === 'player') {
				this.cx.drawImage(rightFig, posX, posY, scale, scale);
			} else if (actor.type === 'box') {
				this.cx.drawImage(box, posX, posY, scale, scale);
			} else {
				this.cx.drawImage(hole, posX, posY, scale, scale);
			}
		})	
	}
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

let level = Object.create(Level);
level.init(gameLevel[0]);
console.log(level);
let state = State.start(level);
console.log(state);
let canvasDis = Object.create(CanvasDisplay);
canvasDis.init(document.body, level);


// floor.addEventListener('load', (event) => {

// 	canvasDis.setState(state);
// });

setInterval(function () {
	canvasDis.setState(state);
}, 100);


