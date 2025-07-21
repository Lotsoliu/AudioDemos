const canvasWidth = 400;
const canvasHeight = 400;
const minBalloonWidth = 200;
const maxBalloonHeight = 400;
const minFrequency = 100;
const maxFrequency = 2000;

class GameManager {
  constructor() {
    this.audioContext = null;
    this.mic = null;
    this.pitch = null;
    this.balloon = null;
    this.explode = false;
    this.particles = [];
  }
}

let game = new GameManager();
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-10, 10);
    this.vy = random(-10, 10);
    this.life = 150;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 5;
  }
  show() {
    noStroke();
    ellipse(this.x, this.y, 16);
  }
}

class Balloon {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.lightness = 90;
  }
  display() {
    noStroke();
    colorMode(HSL);
    let gradient = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size / 2);
    gradient.addColorStop(0, `hsl(0, 100%, ${this.lightness + 10}%)`);
    gradient.addColorStop(1, `hsl(0, 100%, ${this.lightness}%)`);
    drawingContext.fillStyle = gradient;
    ellipse(this.x, this.y, this.size);
  }
}

function setup() {
  game.balloon = new Balloon(canvasWidth/2, canvasWidth/2, minBalloonWidth);
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container');
  select('#enable').mousePressed(function () {
    try {
      game.audioContext = getAudioContext();
      game.audioContext.resume();
      game.mic = new p5.AudioIn();
      game.mic.start(startPitch);
      select('#enable').remove();
    } catch (err) {
      console.error(err);
      select('#status').html('Unable to enable audio');
    }
  });
}

function draw() {
  background(255);
  if (game.explode === true) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      game.particles[i].update();
      game.particles[i].show();
      if (game.particles[i].life <= 0) {
        game.particles.splice(i, 1);
      }
    }
    if (game.particles.length === 0) {
      game.explode = false;
      game.balloon.size = minBalloonWidth;
      game.balloon.lightness = 90;
    }
  } else {
    game.balloon.display();
  }
}
function startPitch() {
  select('#status').html('Loading Model');
  game.pitch = ml5.pitchDetection('./model/', game.audioContext, game.mic.stream, modelLoaded);
}

function modelLoaded() {
  select('#status').html('模型已加载');
  getPitch();
}

function getPitch() {
  game.pitch.getPitch(function (err, frequency) {
    if (frequency) {
      select('#result').html(`频率为：${frequency}Hz`);
      if(frequency > 350){
        game.explode = true;
        for (let i = 0; i < 100; i++) {
          game.particles.push(new Particle(game.balloon.x, game.balloon.y));
        }
      }
      let size = map(frequency, minFrequency, maxFrequency, minBalloonWidth, maxBalloonHeight);
      game.balloon.lightness = map(frequency, minFrequency, maxFrequency, 90, 35);
      game.balloon.size = size;
    } else {
      select('#result').html("未检测到声音");
    }
    getPitch();
  })
}