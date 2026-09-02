const canvas = document.querySelector("#spatial-canvas");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const points = [
  [-1.7, -0.7, 0.8],
  [-1.1, 0.8, 0.2],
  [-0.2, -1.1, -0.4],
  [0.1, 0.3, 1.2],
  [0.9, -0.5, 0.4],
  [1.4, 0.8, -0.6],
  [1.9, -0.1, -1.1],
];

const edges = [
  [0, 1], [0, 2], [1, 3], [2, 3], [2, 4],
  [3, 4], [3, 5], [4, 5], [4, 6], [5, 6],
];

let width = 0;
let height = 0;
let pointerX = 0;
let pointerY = 0;
let frameId;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function project([x, y, z], time) {
  const rotation = time * 0.00008 + pointerX * 0.08;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const rotatedX = x * cosine - z * sine;
  const rotatedZ = x * sine + z * cosine;
  const depth = 5.4 + rotatedZ;
  const scale = Math.min(width, height) * 0.19 / depth;

  return {
    x: width * 0.73 + rotatedX * scale * 4.2,
    y: height * 0.5 + (y + pointerY * 0.12) * scale * 4.2,
    depth,
  };
}

function drawGrid(time) {
  context.save();
  context.translate(width * 0.73, height * 0.73);
  context.rotate(-0.18 + pointerX * 0.015);
  context.strokeStyle = "rgba(183, 227, 204, 0.11)";
  context.lineWidth = 1;

  const size = Math.max(width, height) * 0.72;
  const gap = Math.max(42, size / 14);

  for (let x = -size; x <= size; x += gap) {
    context.beginPath();
    context.moveTo(x, -size * 0.34);
    context.lineTo(x * 1.7, size * 0.45);
    context.stroke();
  }

  for (let y = -size * 0.34; y <= size * 0.45; y += gap) {
    context.beginPath();
    context.moveTo(-size, y);
    context.lineTo(size, y);
    context.stroke();
  }
  context.restore();
}

function draw(time = 0) {
  context.clearRect(0, 0, width, height);
  drawGrid(time);

  const projected = points.map((point) => project(point, time));

  context.lineWidth = 1.5;
  for (const [startIndex, endIndex] of edges) {
    const start = projected[startIndex];
    const end = projected[endIndex];
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.strokeStyle = "rgba(255, 255, 255, 0.32)";
    context.stroke();
  }

  projected.forEach((point, index) => {
    const pulse = reducedMotion ? 0 : Math.sin(time * 0.0016 + index) * 1.2;
    const radius = Math.max(3, 8 - point.depth * 0.45) + pulse;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fillStyle = index === 3 ? "#f05d3b" : index % 2 ? "#b7e3cc" : "#d9b44a";
    context.fill();
  });

  if (!reducedMotion) {
    frameId = window.requestAnimationFrame(draw);
  }
}

window.addEventListener("resize", () => {
  resize();
  if (reducedMotion) draw();
});

window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
  pointerY = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
});

window.addEventListener("pagehide", () => window.cancelAnimationFrame(frameId));

resize();
draw();
