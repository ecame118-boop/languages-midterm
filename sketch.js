
// audio file order matches colors below.
let soundFiles = [
  "babyrattle.wav",
  "baguette.wav",
  "bamboowindchime.wav",
  "lemonleaves.wav",
  "ribbons.wav",
  "snowfeet.wav",
  "ziptie.wav"
];

let colors = [
  [220, 20, 60],
  [255, 165, 0],
  [255, 215, 0],
  [46, 139, 87],
  [0, 191, 255],
  [72, 61, 139],
  [147, 112, 219]
];

let prompts = [
  "Show me your self-confidence.",
  "Release your disappointment.",
  "Leave behind something heavy.",
  "How would it feel to lighten your load?",
  "Do you have a funny bone?",
  "Are you open to joy?",
  "What's your favorite color?",
  "What's your least favorite color?",
  "How do you see loneliness?",
  "How does laughter feel to you?",
  "How do tears feel on your face?",
  "What does strength fill your head with?",
  "What color is your heart? Your soul?",
  "Place a gift on the canvas.",
  "Show me the full moon's impact on you."
];

let sounds = [];
let marks = [];
let remainingPrompts = [];

let drawingLayer;
let selectedColor = 0;
let dragging = false;

let paletteY;
let paletteSpacing;
let paletteStartX;

let inspoX;
let inspoY = 106;
let inspoWidth = 84;
let inspoHeight = 32;

let paintingTop = 145;

// Pixels per second (river speed)
let riverSpeed = 5;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);

  drawingLayer = createGraphics(width, height);
  drawingLayer.pixelDensity(1);

  // Prevent browser page from scrolling.
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  // Prepare sound files.
  for (let file of soundFiles) {
    let sound = new Audio(file);
    sound.preload = "auto";
    sounds.push(sound);
  }

  updateLayout();
}

function draw() {
  // Limit elapsed time so switching tabs doesn't
  // suddenly move everything a large distance.
  let seconds = min(deltaTime, 50) / 1000;

  drawingLayer.background(249, 246, 239);

  // Draw everything in the order it was added.
  for (let mark of marks) {
    mark.y -= riverSpeed * seconds;

    if (mark.type === "paint") {
      // Grow toward the final size.
      mark.size +=
        (mark.finalSize - mark.size) *
        min(1, seconds * 7);

      drawSplash(mark);
    } else {
      drawPrompt(mark);
    }
  }

  // Remove marks after they leave the screen.
  for (let i = marks.length - 1; i >= 0; i--) {
    let margin = marks[i].finalSize || 100;

    if (marks[i].y + margin < 0) {
      marks.splice(i, 1);
    }
  }

  // Cover moving artwork with fixed controls.
  drawControls();

  // Show the color being dragged.
  if (dragging) {
    let c = colors[selectedColor];

    drawingLayer.noStroke();
    drawingLayer.fill(c[0], c[1], c[2], 180);
    drawingLayer.circle(mouseX, mouseY, 30);
  }

  // Display our flat drawing layer on the WEBGL canvas.
  background(249, 246, 239);
  image(drawingLayer, -width / 2, -height / 2);
}

function drawSplash(mark) {
  let g = drawingLayer;
  let c = colors[mark.colorIndex];

  g.push();
  g.translate(mark.x, mark.y);
  g.noStroke();
  g.fill(c[0], c[1], c[2], 175);

  g.beginShape();

  // Make a circle with an uneven, organic edge.
  for (let angle = 0; angle < TWO_PI; angle += 0.08) {
    let noiseX = mark.seed + cos(angle) * 0.9;
    let noiseY = mark.seed + sin(angle) * 0.9;

    let edge = map(
      noise(noiseX, noiseY),
      0, 1,
      0.65, 1.25
    );

    let radius = mark.size * edge;

    let x = cos(angle) * radius;
    let y = sin(angle) * radius;

    g.vertex(x, y);
  }

  g.endShape(CLOSE);
  g.pop();
}

function drawPrompt(mark) {
  let g = drawingLayer;

  g.push();
  g.noStroke();

  // Low opacity makes the text faint.
  g.fill(65, 60, 75, 75);
  g.textFont("Georgia");
  g.textStyle(ITALIC);
  g.textSize(21);
  g.textAlign(CENTER, TOP);

  // A text box lets long prompts wrap.
  g.text(
    mark.words,
    mark.x - mark.boxWidth / 2,
    mark.y,
    mark.boxWidth,
    120
  );

  g.pop();
}

function drawControls() {
  let g = drawingLayer;

  g.push();

  // Fixed background behind controls.
  g.noStroke();
  g.fill(249, 246, 239);
  g.rect(0, 0, width, paintingTop);

  g.textAlign(CENTER, CENTER);
  g.textFont("Georgia");
  g.textStyle(NORMAL);
  g.textSize(28);
  g.fill(65, 55, 70);
  g.text("get it off your chest", width / 2, 29);

  g.textFont("Arial");
  g.textSize(12);
  g.fill(110);
  g.text(
    "drag a color onto the canvas · release to hear it",
    width / 2,
    57
  );

  // fixed palette circles.
  for (let i = 0; i < colors.length; i++) {
    let x = paletteStartX + i * paletteSpacing;
    let c = colors[i];

    if (i === selectedColor) {
      g.noFill();
      g.stroke(90, 80, 95);
      g.strokeWeight(1);
      g.circle(x, paletteY, 35);
    }

    g.noStroke();
    g.fill(c[0], c[1], c[2]);
    g.circle(x, paletteY, 25);
  }

  // Inspo button.
  g.stroke(150, 140, 150);
  g.strokeWeight(1);
  g.fill(249, 246, 239);
  g.rect(inspoX, inspoY, inspoWidth, inspoHeight, 16);

  g.noStroke();
  g.fill(90, 75, 100);
  g.textSize(14);
  g.text(
    "inspo",
    inspoX + inspoWidth / 2,
    inspoY + inspoHeight / 2
  );

  g.pop();
}

function mousePressed() {
  // Check whether a palette color was pressed.
  for (let i = 0; i < colors.length; i++) {
    let x = paletteStartX + i * paletteSpacing;

    if (dist(mouseX, mouseY, x, paletteY) < 19) {
      selectedColor = i;
      dragging = true;
      return;
    }
  }

  // Check whether the inspo button was pressed.
  if (
    mouseX >= inspoX &&
    mouseX <= inspoX + inspoWidth &&
    mouseY >= inspoY &&
    mouseY <= inspoY + inspoHeight
  ) {
    addPrompt();
  }
}

function mouseReleased() {
  if (!dragging) {
    return;
  }

  // Only place paint inside the painting area.
  if (
    mouseX >= 0 &&
    mouseX <= width &&
    mouseY > paintingTop &&
    mouseY <= height
  ) {
    marks.push({
      type: "paint",
      x: mouseX,
      y: mouseY,
      size: 3,
      finalSize: random(45, 100),
      colorIndex: selectedColor,
      seed: random(1000)
    });

    playColorSound(selectedColor);
  }

  dragging = false;
}

function addPrompt() {
  // Use every prompt before repeating the list.
  if (remainingPrompts.length === 0) {
    remainingPrompts = shuffle(prompts.slice());
  }

  let boxWidth = min(360, width - 40);

  marks.push({
    type: "prompt",
    words: remainingPrompts.pop(),
    x: random(
      boxWidth / 2 + 10,
      width - boxWidth / 2 - 10
    ),
    y: random(
      paintingTop + 15,
      max(paintingTop + 16, height - 130)
    ),
    boxWidth: boxWidth
  });
}

function playColorSound(index) {
  // Copy the audio element so sounds can overlap.
  let voice = sounds[index].cloneNode();
  voice.volume = 0.55;

  voice.play().catch(function(error) {
    console.warn(
      "Could not play sound. Check its filename:",
      soundFiles[index],
      error
    );
  });
}

function updateLayout() {
  paletteY = 84;
  paletteSpacing = min(43, (width - 40) / 7);
  paletteStartX = width / 2 - paletteSpacing * 3;

  inspoX = width / 2 - inspoWidth / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  drawingLayer.resizeCanvas(width, height);
  updateLayout();
}