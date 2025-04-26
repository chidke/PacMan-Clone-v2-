const canvas = document.querySelector("canvas"); // This code is calling the canvas from html to connect
const c = canvas.getContext("2d"); // gets context from canvas all canvases use this and the game is 2d
console.log(canvas); // also important

const scoreEl = document.querySelector("#scoreEl");

// below creates individual squares that make the boundaries of the maze
class Boundary {
  static width = 40;
  static height = 40;

  constructor({ position, image }) {
    //the {} around position is a reference that is passed. the {} is there so you can make references in any order. w/o it you have to konow the order
    this.position = position;
    this.width = 40;
    this.height = 40;
    this.image = image;
  }
  // Creating the Context of the maze that is wahy there is a c.
  draw() {
    // c.fillStyle= 'blue'
    //c.fillRect(this.position.x, this.position.y, this.width, this.height)

    c.drawImage(this.image, this.position.x, this.position.y);
  }
}

const SPEED = 175;
const CHOMP_RATE = 50;

class Player {
  //this.postion  is just for its place velocity is used for dynamic movement
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 15; // size of pacman
    this.radians = 0.75;
    this.openRate = 0.12;
    this.rotation = 0;
    this.desiredDirection = {
      x: 0,
      y: 0,
    };
    this.state = "active"; //actives multiple lives
  }
  draw() {
    c.save();
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.translate(-this.position.x, -this.position.y);
    c.beginPath();
    c.arc(
      this.position.x,
      this.position.y,
      this.radius,
      this.radians,
      Math.PI * 2 - this.radians
    ); // startangle and endangle are in radians // pi *2 is a full circle
    c.lineTo(this.position.x, this.position.y);
    c.fillStyle = "yellow";
    c.fill();
    c.closePath();
    c.restore();
  }
  move(direction) {
    // this is to track the movement of the ghost
    switch (direction) {
      case "up":
        this.desiredDirection = {
          x: 0,
          y: -1,
        };
        break;
      case "down":
        this.desiredDirection = {
          x: 0,
          y: 1,
        };
        break;
      case "left":
        this.desiredDirection = {
          x: -1,
          y: 0,
        };
        break;
      case "right":
        this.desiredDirection = {
          x: 1,
          y: 0,
        };
        break;
    }
  }
  collision(boundaries) {
    for (const boundary of boundaries) {
      if (
        circleCollidesWithRectangle({
          circle: this,
          rectangle: boundary,
        })
      ) {
        return true;
      }
    }
    return false;
  }

  snapToGrid() {
    const CELL_SIZE = 20;
    this.postition = {
      x: Math.round(this.position.x / CELL_SIZE) * CELL_SIZE, // It make pacman contort to the grid centering
      y: Math.round(this.position.y / CELL_SIZE) * CELL_SIZE, //itself to the grid when pacman collides with boundary it snaps to coin position
    };
  }

  isValidMove(boundaries) {
    const PIXEL_BUFFER = 5;
    for (const boundary of boundaries) {
      if (
        circleCollidesWithRectangle({
          circle: {
            ...this,
            velocity: {
              x: this.desiredDirection.x * PIXEL_BUFFER,
              y: this.desiredDirection.y * PIXEL_BUFFER,
            },
          },
          rectangle: boundary,
        })
      ) {
        return false;
      }
    }
    return true;
  }

  movePlayerWithInput(delta, boundaries) {
    // Try applying desired direction (for smooth turning)
    const desiredVelocity = {
      x: this.desiredDirection.x,
      y: this.desiredDirection.y,
    };

    const PIXEL_BUFFER = 5;
    const willCollide = boundaries.some((boundary) =>
      circleCollidesWithRectangle({
        circle: {
          ...this,
          velocity: {
            x: desiredVelocity.x * PIXEL_BUFFER, /// look at chat gpt for explaination
            y: desiredVelocity.y * PIXEL_BUFFER,
          },
        },
        rectangle: boundary,
      })
    );

    // If the move is valid, update velocity
    if (!willCollide) {
      this.velocity.x = desiredVelocity.x;
      this.velocity.y = desiredVelocity.y;
    }

    // Move based on current velocity
    const speed = SPEED * delta;
    const steps = 4;
    const stepX = (this.velocity.x * speed) / steps;
    const stepY = (this.velocity.y * speed) / steps;

    for (let i = 0; i < steps; i++) {
      this.position.x += stepX;
      this.position.y += stepY;

      if (this.collision(boundaries)) {
        this.position.x -= stepX;
        this.position.y -= stepY;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.snapToGrid();
        break;
      }
    }

    // chomp rate of pacman
    if (this.radians < 0 || this.radians > 0.75) this.openRate = -this.openRate;
    this.radians = Math.max(0, Math.min(this.radians, 0.75));
    this.radians += this.openRate * delta * CHOMP_RATE;

    this.checkTransportOnVerticalAxis();
    this.checkTransportOnHorizontalAxis();
  }

  //transport betwwen sections
  checkTransportOnHorizontalAxis() {
    if (this.position.x + this.radius < 0) this.position.x = canvas.width;
    else if (this.position.x - this.radius > canvas.width) this.position.x = 0;
  }

  checkTransportOnVerticalAxis() {
    if (this.position.y + this.radius < 0) this.position.y = canvas.height;
    // This is for the height but i didnt wnat it in the game
    else if (this.position.y - this.radius > canvas.height) this.position.y = 0;
  }

  die(lives, game) {
    Howler.stop();
    sound.die.play();
    this.state = "initDeath";
    gsap.to(this, {
      radians: Math.PI - 0.00001,
      onComplete: () => {
        setTimeout(() => {
          if (lives > 0) {
            game.init(); // the game.init parts reset pac to its starting point and ghosts
            game.initStart(); // delays the restart
          } else {
            game.end();
          }
        }, 750); //miliseconds
      },
    });
  }

  // to update the movment of the pacman so that any computer as a consistent speed
  update(delta, boundaries) {
    this.draw();

    switch (this.state) {
      case "active":
        this.movePlayerWithInput(delta, boundaries);
        break;
      case "initDeath":
        this.state = "death";
        break;
    }
  }
}

class Ghost {
  //this.postion  is just for its place velocity is used for dynamic movement
  static speed = 1; //controls ghost speed
  constructor({
    position,
    velocity,
    color = "red",
    imgSrc,
    state,
    speed,
    outOfCage,
  }) {
    this.position = JSON.parse(JSON.stringify(position));
    this.velocity = velocity;
    this.radius = 15; // size of pacman
    this.color = color;
    this.prevCollisions = [];
    this.speed = speed;
    this.previousValidMoves = [];
    this.outOfCage = outOfCage;

    this.imageLoaded = false;
    this.image = new Image();
    this.image.src = imgSrc;
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.sprites = {
      default: {
        maxFrames: 8,
        image: null,
        src: imgSrc,
        loaded: false,
      },
      scared: {
        maxFrames: 8,
        image: null,
        src: "./Images/Ghost_sprites/scaredGhost.png",
        loaded: false,
      },
    };

    for (const key in this.sprites) {
      this.sprites[key].image = new Image();
      this.sprites[key].image.src = this.sprites[key].src;
      this.sprites[key].image.onload = () => {
        this.sprites[key].loaded = true;
      };
    }

    this.elapsedTime = 0;
    this.maxFrames = 8;
    this.currentFrame = 8;
    this.state = state;
  }
  draw() {
    if (this.imageLoaded) {
      const scaledWidth = this.image.width * 2;
      const scaledHeight = this.image.height * 2;

      const cropbox = {
        x: 0,
        y: 0,
        width: this.image.width / this.maxFrames,
        height: this.image.height,
      };

      // There's 8 ghost images. This code sections off each ghost to help create animation
      c.drawImage(
        this.image,
        cropbox.width * this.currentFrame,
        cropbox.y,
        cropbox.width,
        cropbox.height,
        this.position.x - cropbox.width, // these two centers the the ghost sprint
        this.position.y - cropbox.height,
        scaledWidth / this.maxFrames,
        scaledHeight
      );
    }
  }
  collision(boundaries) {
    for (const boundary of boundaries) {
      if (
        circleCollidesWithRectangle({
          circle: this,
          rectangle: boundary,
        })
      ) {
        return true;
      }
    }
    return false;
  }

  snapToGrid() {
    const CELL_SIZE = 20;
    this.postition = {
      x: Math.round(this.position.x / CELL_SIZE) * CELL_SIZE, // It make pacman contort to the grid centering
      y: Math.round(this.position.y / CELL_SIZE) * CELL_SIZE, //itself to the grid
    };
  }

  // movemovents of ghosts
  gatherValidMoves(boundaries) {
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    // filters out opposite direction. Everything until update controls ghosts movement where it only follows one path without retracing
    const validMoves = directions.filter((direction) => {
      const oppositeDirection = { x: -this.velocity.x, y: -this.velocity.y };

      return (
        direction.x !== oppositeDirection.x ||
        direction.y !== oppositeDirection.y
      );
    });

    const PIXEL_BUFFER = 5;
    for (const boundary of boundaries) {
      for (const direction of directions) {
        if (
          circleCollidesWithRectangle({
            circle: {
              ...this,
              velocity: {
                x: direction.x * PIXEL_BUFFER,
                y: direction.y * PIXEL_BUFFER,
              },
            },
            rectangle: boundary,
          })
        ) {
          // splice out of the direction from our validMoves array
          validMoves.splice(
            validMoves.findIndex(
              (move) => move.x === direction.x && move.y === direction.y
            ),
            1
          );
        }
      }
    }

    return validMoves;
  }

  updateFrames(delta) {
    this.elapsedTime += delta;

    // Amination of the sprites
    const GHOST_ANIMATION_RATE = 1000 / 30 / 1000;
    if (this.elapsedTime > GHOST_ANIMATION_RATE) {
      this.elaspedTime = 0;
      this.currentFrame++;

      if (this.currentFrame >= this.maxFrames) {
        this.currentFrame = 0;
      }
    }
  }

  enterGame(cageCenter) {
    this.outOfCage = true;
    this.state = "enteringGame"; // gsap is used to animate the ghost to come out of its cage its first installed in html file

    const timeline = gsap.timeline();

    timeline.to(this.position, {
      x: cageCenter.x,
    });

    timeline.to(this.position, {
      y: cageCenter.y - Boundary.height,
      onComplete: () => {
        this.state = "active"; // allows the ghost to get out cage and move
      },
    });
  }

  move(delta, boundaries) {
    const validMoves = this.gatherValidMoves(boundaries);

    if (
      validMoves.length > 0 &&
      validMoves.length !== this.previousValidMoves.length
    ) {
      // change ghost velocity

      const chosenMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];

      this.velocity.x = chosenMove.x;
      this.velocity.y = chosenMove.y;
    }

    if (this.collision(boundaries)) {
      // For the ghosts to move in position of coins or if colliding with wall the ghosts stops
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.snapToGrid();
    } else {
      this.position.x += this.velocity.x * delta * this.speed;
      this.position.y += this.velocity.y * delta * this.speed;
    }
    this.previousValidMoves = validMoves;

    this.checkTransportOnVerticalAxis();
    this.checkTransportOnHorizontalAxis();
  }

  // ghost transports
  checkTransportOnHorizontalAxis() {
    if (this.position.x + this.radius < 0) this.position.x = canvas.width;
    else if (this.position.x - this.radius > canvas.width) this.position.x = 0;
  }

  checkTransportOnVerticalAxis() {
    if (this.position.y + this.radius < 0) this.position.y = canvas.height;
    // This is for the height but i didnt wnat it in the game
    else if (this.position.y - this.radius > canvas.height) this.position.y = 0;
  }

  // to update the movment of the ghost
  update(delta, boundaries) {
    this.draw();
    this.updateFrames(delta);

    // start of Pacman having multiple lives
    switch (this.state) {
      case "preActive":
        this.image = this.sprites.default.image;
        this.state = "active";
        break;
      case "active":
        this.move(delta, boundaries);
        break;
      case "scared":
        this.move(delta, boundaries);
        break;
      case "preScared":
        this.image = this.sprites.scared.image;
        this.state = "scared";
        break;
    }
  }
}

class Coin {
  constructor({ position }) {
    this.position = position;
    this.radius = 3; // size of coin
  }
  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2); // startangle and endangle are in radians // pi *2 is a full circle
    c.fillStyle = "white";
    c.fill();
    c.closePath();
  }
}

class PowerUp {
  constructor({ position }) {
    this.position = position;
    this.radius = 10; // size of powerups
    this.visible = true; // ← for blinking
    this.blinkTimer = 0; // ← keeps track of time
    this.blinkInterval = 0.7; // ← seconds between toggles
  }
  update(delta) {
    this.blinkTimer += delta;

    if (this.blinkTimer >= this.blinkInterval) {
      this.visible = !this.visible;
      this.blinkTimer = 0;
    }

    this.draw();
  }

  draw() {
    if (!this.visible) return;

    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2); // startangle and endangle are in radians // pi *2 is a full circle
    c.fillStyle = "white";
    c.fill();
    c.closePath();
  }
}

class Item {
  constructor({ position, imgSrc = "./Images/Ghost_sprites/cherry.png" }) {
    this.position = position;
    this.radius = 8; // size of powerup
    this.image = new Image();
    this.image.src = imgSrc;
    this.loaded = false; // just in case the image doesn't load and the computer doesn't show error
    this.image.onload = () => {
      this.loaded = true;
    };
    this.center = JSON.parse(JSON.stringify(position));
    this.radians = 0;
  }
  draw() {
    if (!this.loaded) return;

    c.drawImage(
      this.image,
      this.position.x - this.image.width / 2,
      this.position.y - this.image.height / 2
    );

    this.radians += 0.07;

    this.position.x = this.center.x + Math.cos(this.radians); // the code to make the cherry move back and forth
    this.position.y = this.center.y + Math.sin(this.radians); // up and down
  }
}

const maps = [
  // prettier-ignore
  [
    ['1','-','-','-','-','_','-','-','-','-','-','-','-','-','-','-','-','-','-','_','-','-','-','-','2'],  
    ['|',' ','.','.','.','|','.','.','.','.','.','.','.','.','.','.','.','.','.','|','.','.','.','p','|'],
    ['|','.','<','>','.','V','.','<','-','_','-','>','.','<','-','_','-','>','.','V','.','<','>','.','|'],
    ['|','.','.','.','.','.','.','.','.','|','.','.','I','.','.','|','.','.','.','.','.','.','.','.','|'],
    ['|','.','<','>','.','^','.','b','.','V','.','<','-','>','.','V','.','b','.','^','.','<','>','.','|'],
    ['V','.','.','.','.','|','.','.','.','.','.',' ',' ',' ','.','.','.','.','.','|','I','.','.','.','V'],
    ['.','.','<','-','-','+','-','-','-','>',' ','<','?','>',' ','<','-','-','-','+','-','-','>','.','.'],
    ['^','.','.','.','.','|','.','.','.','.','.',' ',' ',' ','.','.','.','.','.','|','.','.','.','.','^'],
    ['|','.','<','>','.','V','.','b','.','^','.','<','-','>','.','^','.','b','.','V','.','<','>','.','|'],
    ['|','.','.','.','.','.','.','.','I','|','.','.','.','.','.','|','.','.','.','.','.','.','.','.','|'],
    ['|','.','<','>','.','^','.','<','-','?','-','>','.','<','-','?','-','>','.','^','.','<','>','.','|'],
    ['|','p','.','.','.','|','.','.','.','.','.','.','.','.','.','.','.','.','.','|','.','.','.','p','|'],
    ['4','-','-','-','-','?','-','-','-','-','-','-','-','-','-','-','-','-','-','?','-','-','-','-','3'],
 
],

  //prettier-ignore
  [
    ['1','-','-','-','_','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','_','-','-','-','2'],  
    ['|',' ','.','.','|','p','.','.','.','.','.','.','.','.','.','.','.','.','.','.','|','.','.','p','|'],
    ['V','.','^','.','V','.','<','-','_','-','>','.','^','.','<','-','_','-','>','.','V','.','^','.','V'],
    ['.','.','|','.','.','.','.','.','|','.','.','.','|','.','.','I','|','.','.','.','.','.','|','.','.'],
    ['^','.','4','>','.','<','>','.','V','.','<','-','?','-','>','.','V','.','<','>','.','<','3','.','^'],
    ['|','.','.','.','.','.','.','.','.','.',' ',' ',' ',' ',' ','.','.','.','.','.','.','.','.','.','|'],
    ['|','.','b','.','b','.','^','.','<','>',' ','<','?','>',' ','<','>','.','^','.','b','.','b','.','|'],
    ['|','.','.','.','.','.','|','.','.','.',' ',' ',' ',' ',' ','.','.','.','|','.','.','.','.','.','|'],
    ['V','.','1','>','.','<','3','.','^','.','<','-','_','-','>','.','^','.','4','>','.','<','2','.','V'],
    ['.','.','|','.','.','.','.','.','|','I','.','.','|','.','.','.','|','.','.','.','.','.','|','.','.'],
    ['^','.','V','.','^','.','<','-','?','-','>','.','V','.','<','-','?','-','>','.','^','.','V','.','^'],
    ['|','p','.','.','|','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','|','.','.','p','|'],
    ['4','-','-','-','?','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','?','-','-','-','3'], 
],

  //prettier-ignore
  [
    ['1','-','-','-','-','>','.','<','-','-','-','>','.','<','-','-','-','>','.','<','-','-','-','-','2'],  
    ['|',' ','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','p','|'],
    ['V','.','<','>','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','<','>','.','V'],
    ['.','.','.','.','.','.','.','.','.','.','.','.','I','.','.','.','.','.','.','.','.','.','.','.','.'],
    ['^','.','<','>','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','<','>','.','^'],
    ['|','.','.','.','p','.','.','.','.','.',' ',' ',' ',' ',' ','.','.','.','.','.','.','.','.','.','|'],
    ['|','.','<','>','.','b','.','b','.','b',' ','<','?','>',' ','b','.','b','.','b','.','<','>','.','|'],
    ['|','.','.','.','.','.','.','.','.','.',' ',' ',' ',' ',' ','.','.','.','.','.','I','.','.','.','|'],
    ['V','.','<','>','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','<','>','.','V'],
    ['.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','p','.','.','.','.','.','.','.','.'],
    ['^','.','<','>','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','b','.','<','>','.','^'],
    ['|','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','|'],
    ['4','-','-','-','-','>','.','<','-','-','-','>','.','<','-','-','-','>','.','<','-','-','-','-','3'], 
],
]; // 1,2,3,4 are the numbered corners

// Instead of creating multiple boundaries that muds our code, we made a map of the maze and called it below
let coinSoundIndex = 0;
let coins = [];
let powerUps = [];
let ghosts = [];
let player = {};
let items = [];
let ghostSpeed = 75;
const GHOST_SPEED_INCREMENT = 25;

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
};

function circleCollidesWithRectangle({ circle, rectangle }) {
  const padding = Boundary.width / 2 - circle.radius - 2; // this is the invisible shield the walls we used 2 to decrese the shield

  return (
    circle.position.y - circle.radius + circle.velocity.y <=
      rectangle.position.y + rectangle.height + padding &&
    circle.position.x + circle.radius + circle.velocity.x >=
      rectangle.position.x - padding && // the collision of the blue boxes
    circle.position.y + circle.radius + circle.velocity.y >=
      rectangle.position.y - padding &&
    circle.position.x - circle.radius + circle.velocity.x <=
      rectangle.position.x + rectangle.width + padding
  );
}

let ghostScaredSoundId;
let lastKey = " ";
let score = 0;
let animationId;
let prevMs = Date.now(); // run the game at reasonable time
let accumulatedTime = 0; // to track the time in the game
let ghostReleaseIntervals = [0, 7, 14, 21]; // these are the milisec intervals for when the ghosts are released
let currentLevelIndex = 0; // Which level you are on?
let lives = 3;
let boundaries = generateBoundaries(currentLevelIndex, maps);

// starting positions of ghosts in each maze
const ghostPositions = [
  [
    {
      x: Boundary.width * 12 + Boundary.width / 2,
      y: Boundary.height * 5 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 12 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 11 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 13 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
  ],
  [
    {
      x: Boundary.width * 12 + Boundary.width / 2,
      y: Boundary.height * 5 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 12 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 11 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 13 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
  ],

  [
    {
      x: Boundary.width * 12 + Boundary.width / 2,
      y: Boundary.height * 5 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 12 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 11 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
    {
      x: Boundary.width * 13 + Boundary.width / 2,
      y: Boundary.height * 6 + Boundary.height / 2,
    },
  ],
];

const game = {
  isPaused: false,

  // reset conditions
  init() {
    Howler.stop();
    //clearTimeout(ghostScaredSoundId);
    // coins = [];  it disappers the coins so dont add back
    //powerUps = []; same
    //items = []; it disappears the iems
    accumulatedTime = 0;
    player = new Player({
      position: {
        x: Boundary.width + Boundary.width / 2,
        y: Boundary.height + Boundary.height / 2, // position of pacman
      },
      velocity: {
        x: 0,
        y: 0,
      },
    });
    ghosts = [
      new Ghost({
        position: ghostPositions[currentLevelIndex][0], //[the 1st level][the 1st ghost in array]
        velocity: {
          x: Ghost.speed * (Math.random() < 0.5) ? -1 : 1,
          y: 0,
        },
        imgSrc: "./Images/Ghost_sprites/orangeGhost.png",
        state: "active", // the only one moving
        speed: ghostSpeed,
        outOfCage: true,
      }),

      new Ghost({
        position: ghostPositions[currentLevelIndex][1],
        velocity: {
          x: Ghost.speed * (Math.random() < 0.5) ? -1 : 1,
          y: 0,
        },

        imgSrc: "./Images/Ghost_sprites/greenGhost.png",
        speed: ghostSpeed,
      }),
      new Ghost({
        position: ghostPositions[currentLevelIndex][2],
        velocity: {
          x: Ghost.speed * (Math.random() < 0.5) ? -1 : 1,
          y: 0,
        },

        imgSrc: "./Images/Ghost_sprites/redGhost.png",
        speed: ghostSpeed,
      }),
      new Ghost({
        position: ghostPositions[currentLevelIndex][3],
        velocity: {
          x: Ghost.speed * (Math.random() < 0.5) ? -1 : 1,
          y: 0,
        },

        imgSrc: "./Images/Ghost_sprites/yellowGhost.png",
        speed: ghostSpeed,
      }),
    ];
    // boundaries = generateBoundaries(currentLevelIndex, maps); // responsible for coins repopulating
  },

  initStart() {
    // conditions when new life Player
    player.state = "paused";
    ghosts.forEach((ghost) => {
      ghost.state = "paued";
    });

    setTimeout(() => {
      ghosts[0].state = "active";
      ghosts[1].state = null;
      ghosts[2].state = null;
      ghosts[3].state = null;
      player.state = "active";
      sound.siren.play();
    }, 1000);
  },

  nextRound() {
    Howler.stop();
    sound.success.play();
    player.state = "paused";
    ghosts.forEach((ghost) => {
      ghost.state = "paused";
    });

    ghostSpeed += GHOST_SPEED_INCREMENT;
    ghostReleaseIntervals = ghostReleaseIntervals.map((interval, index) => {
      // descreases the time the ghosts come out as levels progress
      if (index === 0) return interval;
      else if (index === 1 && interval > 1) return interval - 1;
      else if (index === 2 && interval > 2) return interval - 1;
      else if (index === 3 && interval > 3) return interval - 1;
    });

    // the functions that happen when game is over
    setTimeout(() => {
      // the timer for next level
      currentLevelIndex++;
      if (currentLevelIndex > maps.length - 1) currentLevelIndex = 0;
      boundaries = generateBoundaries(currentLevelIndex, maps);
      game.init();
      game.initStart();
    }, 1000);
  },
  pause() {
    player.state = "paused";
    ghosts.forEach((ghost) => {
      ghost.state = "paused";
    });
  },

  resume() {
    this.isPaused = false;
    player.state = "active";
    ghosts.forEach((ghost) => {
      ghost.state = "active";
    });
  },

  end() {
    Howler.stop();
    sound.gameOver.play();
    document.querySelector("#gameOverScoreLabel").innerHTML = score;
    document.querySelector("#gameOverScreen").style.display = "block";
    document.querySelector("#pauseButton").style.display = "none";
  },

  restart() {
    currentLevelIndex = 0; // Which level you are on?
    boundaries = generateBoundaries(currentLevelIndex, maps);
    lives = 3;
    score = 0;
    scoreEl.innerHTML = score;
    document.querySelector("#livesEl").innerHTML = lives;
    document.querySelector("#pauseButton").style.display = "block";
  },
};

game.init();
game.pause();

function animate() {
  animationId = requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);

  const currentMs = Date.now();
  const delta = (currentMs - prevMs) / 1000;
  prevMs = currentMs;

  if (player.state === "active") accumulatedTime += delta; // Only allow accumulated time to enlarge when player is active (game has started)

  accumulatedTime += delta;

  if (keys.w.pressed && lastKey === "w") player.move("up");
  else if (keys.a.pressed && lastKey === "a") player.move("left");
  else if (keys.s.pressed && lastKey === "s") player.move("down");
  else if (keys.d.pressed && lastKey === "d") player.move("right");

  // detect collision between ghosts and player
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const ghost = ghosts[i];

    // ghost touches player
    if (
      Math.hypot(
        ghost.position.x - player.position.x,
        ghost.position.y - player.position.y
      ) <
        ghost.radius + player.radius &&
      player.state === "active" // THIS Function does that specifically
    ) {
      if (ghost.state === "scared") {
        score += 100;
        scoreEl.innerHTML = score;
        ghosts.splice(i, 1);
      } else {
        // lose a life
        lives--;
        document.querySelector("#livesEl").innerHTML = lives; // ← Update the display
        player.die(lives, game);
        ghosts.forEach((ghost) => {
          ghost.state = "paused";
        });
        console.log("You lost a life!");
      }
    }
  }
  // win condition goes here
  if (coins.length === 0 && player.state === "active") {
    game.nextRound();
  }

  // powerups go here
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUps.forEach((powerUp) => powerUp.update(delta)); // powerup blinks

    if (
      Math.hypot(
        powerUp.position.x - player.position.x, // This is the function that collects the poweruo
        powerUp.position.y - player.position.y
      ) <
      powerUp.radius + player.radius
    ) {
      powerUps.splice(i, 1); // make the power disappear
      Howler.stop();
      sound.powerUp.play();
      sound.ghostScared.play();

      ghostScaredSoundId = setTimeout(() => {
        Howler.stop();
        sound.siren.play();
      }, 5000);

      //make ghost scared
      ghosts.forEach((ghost) => {
        ghost.state = "preScared";

        setTimeout(() => {
          ghost.state = "preActive";
        }, 5000); // ghosts are scared for 5 secs
      });
    }
  }

  // items go here
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.draw();

    if (
      Math.hypot(
        item.position.x - player.position.x, // This is the  collision detection function that collects the item
        item.position.y - player.position.y
      ) <
      item.radius + player.radius
    ) {
      sound.cherry.play();
      items.splice(i, 1); // make the item disappear
      score += 50;
      scoreEl.innerHTML = score;
    }
  }

  // touch coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    coin.draw();

    if (
      Math.hypot(
        coin.position.x - player.position.x, // This is the function that collects the coins
        coin.position.y - player.position.y
      ) <
      coin.radius + player.radius
    ) {
      console.log(coinSoundIndex);
      sound.coins[coinSoundIndex].play();
      coinSoundIndex = coinSoundIndex === 1 ? 0 : coinSoundIndex + 1;
      coins.splice(i, 1); // makes the coins disappear
      score += 10;
      scoreEl.innerHTML = score;
    }
  }

  boundaries.forEach((boundary) => {
    boundary.draw();
  });

  player.update(delta, boundaries);
  ghosts.forEach((ghost, index) => {
    ghost.update(delta, boundaries);

    if (accumulatedTime > ghostReleaseIntervals[index] && !ghost.outOfCage)
      ghost.enterGame(ghostPositions[currentLevelIndex][1]); // as time accumulates a ghost will enter at its designated time and when PAC dies ghosts stop
  });
  if (player.velocity.x > 0) player.rotation = 0;
  else if (player.velocity.x < 0) player.rotation = Math.PI;
  else if (player.velocity.y > 0) player.rotation = Math.PI / 2;
  else if (player.velocity.y < 0) player.rotation = Math.PI * 1.5;
} //end of rotation

animate();

document.querySelector("#pauseButton").addEventListener("click", () => {
  if (game.isPaused) {
    game.resume();
  } else {
    game.pause();
    game.isPaused = true;
  }
});

document.querySelector("#restartGameButton").addEventListener("click", () => {
  document.querySelector("#gameOverScreen").style.display = "none";
  game.restart();
  game.init();
  game.initStart();
});

// makes start button function
document.querySelector("#startButton").addEventListener("click", (e) => {
  sound.success.play();
  document.querySelector("#startScreen").style.display = "none";
  document.querySelector("#readyTag").style.display = "block";
  setTimeout(() => {
    game.init();
    sound.siren.play();
    document.querySelector("#readyTag").style.display = "none";
    document.querySelector("#goTag").style.display = "block";
    document.querySelector("#pauseButton").style.display = "block";
    gsap.to("#goTag", {
      delay: 0.5,
      opacity: 0,
    });
  }, 2000);
});

const speakerOnIcon = document.querySelector("#speakerOnIcon");
const speakerOffIcon = document.querySelector("#speakerOffIcon");
const speakerToggle = document.querySelector("#speakerToggle");
let isMuted = false;

speakerToggle.addEventListener("click", () => {
  isMuted = !isMuted;
  Howler.mute(isMuted);

  if (isMuted) {
    speakerOnIcon.classList.add("hidden");
    speakerOffIcon.classList.remove("hidden");
  } else {
    speakerOnIcon.classList.remove("hidden");
    speakerOffIcon.classList.add("hidden");
  }
});

addEventListener("keydown", ({ key }) => {
  switch (key) {
    case "w":
      keys.w.pressed = true;
      lastKey = "w";
      break;
    case "a":
      keys.a.pressed = true;
      lastKey = "a";
      break;
    case "s":
      keys.s.pressed = true;
      lastKey = "s";
      break;
    case "d":
      keys.d.pressed = true;
      lastKey = "d";
      break;
  }
});

addEventListener("keyup", ({ key }) => {
  switch (key) {
    case "w":
      keys.w.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "s":
      keys.s.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
  }
});
