// DBTow Falling Sand Simulator

class Grid {
    constructor(width, height, particleSize) {
        this.initialize(width, height, particleSize);
    }

    initialize(width, height, particleSize) {
        this.width = Math.floor(width / particleSize);
        this.height = Math.floor(height / particleSize);
        this.particleSize = particleSize;
        this.grid = new Array(this.width * this.height).fill(0);
    }

    clear() {
        this.grid = new Array(this.width * this.height).fill(0);
    }

    set(x, y, color) {
        const gridX = Math.floor(x / this.particleSize);
        const gridY = Math.floor(y / this.particleSize);
        if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
            this.grid[gridY * this.width + gridX] = color;
        }
    }

    setCircle(x, y, colorFn, radius, probability) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx*dx + dy*dy <= radius*radius && Math.random() < probability) {
                    this.set(x + dx * this.particleSize, y + dy * this.particleSize, colorFn());
                }
            }
        }
    }

    swap(a, b) {
        const temp = this.grid[a];
        this.grid[a] = this.grid[b];
        this.grid[b] = temp;
    }

    isEmpty(index) {
        return this.grid[index] === 0;
    }

    updatePixel(i) {
        if (this.grid[i] === 0) return; // Skip empty cells

        const below = i + this.width;
        const belowLeft = below - 1;
        const belowRight = below + 1;

        // Check if we're not at the bottom edge
        if (below < this.grid.length) {
            // If there's empty space below, move down
            if (this.isEmpty(below)) {
                this.swap(i, below);
            }
            // If we can't move straight down, try diagonal left
            else if(i % this.width !== 0 && this.isEmpty(belowLeft)) {
                this.swap(i, belowLeft);
            }
            // If we can't move diagonal left, try diagonal right
            else if ((i + 1) % this.width !== 0 && this.isEmpty(belowRight)) {
                this.swap(i, belowRight)
            }
        }
    }

    update() {
        // Iterate from bottom to top, right to left
        for (let i = this.grid.length - 1; i >= 0; i--) {
            this.updatePixel(i);
        }
    }

}


const sandColor = 'hsl(50, 80%, 50%)'; // Default Sand Color

function varyColor(color) {
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
        let [, hue, saturation, lightness] = hslMatch.map(Number);
        saturation += Math.floor(Math.random() * 21) - 20;
        saturation = Math.max(0, Math.min(100, saturation));
        lightness += Math.floor(Math.random() * 21) - 10;
        lightness = Math.max(0, Math.min(100, lightness));
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    return color;
}

const canvas = document.getElementById('sandCanvas');
const ctx = canvas.getContext('2d');
let grid;

// Initial Particle Size Setup
let particleSize = 3;
let dropRadius = 2;
let dropProbability = 0.5;

const backgroundColor = 'rgb(220, 220, 220)'; // Light grey background

function drawGrid() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
            const color = grid.grid[y * grid.width + x] || backgroundColor;
            const rgb = color.startsWith('hsl') ? hslToRgb(color) : parseRgb(color);
            for (let dy = 0; dy < grid.particleSize; dy++) {
                for (let dx=0; dx < grid.particleSize; dx++) {
                    const pixelIndex = ((y * grid.particleSize + dy) * canvas.width + (x * grid.particleSize + dx)) * 4;
                    imageData.data[pixelIndex] = rgb[0];
                    imageData.data[pixelIndex + 1] = rgb[1];
                    imageData.data[pixelIndex + 2] = rgb[2];
                    imageData.data[pixelIndex + 3] = 255;
                }
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function parseRgb(rgbColor) {
    const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return match.slice(1).map(Number);
    }
    return [0, 0, 0]; // Default to black if parsing fails

}

function hslToRgb(hslColor) {
    const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
        let [, h, s, l] = hslMatch.map(Number);
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    return [0, 0, 0];
}

function initializeCanvas() {
    canvas.width = 600;
    canvas.height = 400;
    grid = new Grid(canvas.width, canvas.height, particleSize);
}

function dropSand(x, y) {
    grid.setCircle(
        x,
        y,
        () => varyColor(sandColor),
        dropRadius,
        dropProbability
    );
}


// Mouse Functionalities
function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    dropSand(x, y);
}

let isMouseDown = false;
canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    onMouseDown(event);
});

canvas.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        onMouseDown(event);
    }
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('mouseleave', () => {
    isMouseDown = false;
});

// Control Panel Functionality
const particleSizeInput = document.getElementById('particleSize');
const particleSizeValue = document.getElementById('particleSizeValue');

particleSizeInput.addEventListener('input', (event) => {
    particleSize = parseInt(event.target.value);
    particleSizeValue.textContent = particleSize;
    initializeCanvas();
});

// Clear Function
document.getElementById('clearCanvas').addEventListener('click', () => {
    grid.clear();
});


// Main simulation loop
function update() {
    grid.update();
    drawGrid();
    requestAnimationFrame(update);
}

initializeCanvas();
update();