let audioContext;
let mic;
let pitch;
let balloon;
let explode = false;
const canvasWidth = 400;
const canvasHeight = 400;
const minBalloonWidth = 200;
const maxBalloonHeight = 400;

const minFrequency = 100;
const maxFrequency = 2000;

let particles = [];
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
     // 根据lightness值设置颜色
    colorMode(HSL);
     // 添加渐变
     let gradient = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size / 2);
     gradient.addColorStop(0, `hsl(0, 100%, ${this.lightness + 10}%)`);
     gradient.addColorStop(1, `hsl(0, 100%, ${this.lightness}%)`);
     drawingContext.fillStyle = gradient;
     // 绘制气球
     ellipse(this.x, this.y, this.size);
  }
}

function setup() {
  balloon = new Balloon(canvasWidth/2, canvasWidth/2, minBalloonWidth);
  // noCanvas();
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container');
  select('#enable').mousePressed(function () {
    try {
      audioContext = getAudioContext();
      audioContext.resume()
      mic = new p5.AudioIn();
      mic.start(startPitch);
      select('#enable').remove();
    } catch (err) {
      console.error(err);
      select('#status').html('Unable to enable audio');
    }
  });
}

function draw() {
  background(255);

  // 绘制气球
  if (explode===true) {
    // 气球爆炸动画
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].show();
      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      }
    }
    if (particles.length === 0) {
      explode = false;
      balloon.size = minBalloonWidth;
      balloon.lightness = 90;
    }
  } else {
    balloon.display();
  }
}
function startPitch() {
  select('#status').html('Loading Model');
  pitch = ml5.pitchDetection('./model/', audioContext, mic.stream, modelLoaded);
}

function modelLoaded() {
  select('#status').html('模型已加载');
  getPitch();
}

function getPitch() {
  pitch.getPitch(function (err, frequency) {
    if (frequency) {
      select('#result').html(`频率为：${frequency}Hz`);
      if(frequency>350){
        explode = true;
        for (let i = 0; i < 100; i++) {
          particles.push(new Particle(balloon.x, balloon.y));
        }
      }
      let size = map(frequency, minFrequency, maxFrequency, minBalloonWidth, maxBalloonHeight);
      balloon.lightness = map(frequency, minFrequency, maxFrequency, 90, 35);
      balloon.size = size;
    } else {
      select('#result').html("未检测到声音");
    }
    getPitch();
  })
}