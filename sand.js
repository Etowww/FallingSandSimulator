// DBTow Falling Sand Simulator

class Grid {
    constructor(width, height) {
        this.initialize(width, height);
    }

    initialize(width, height) {
        this.width = width;
        this.height = height;
        this.grid = new Array(width * height).fill(0);
    }

    clear() {
        this.grid = new Array(this.width * this.height).fill(0);
    }

    set(x, y, color) {
        this.grid[y * this.width + x] = color;
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
                this.swap(i, belowRight);
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
const grid = new Grid(canvas.width, canvas.height);

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    const color = varyColor(sandColor);
    grid.set(x, y, color);
    drawGrid();
});



const backgroundColor = 'rgb(240, 240, 240'; // Light grey background

function drawGrid() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < grid.grid.length; i++) {
        const color = grid.grid[i] || backgroundColor;
        const rgb = color.startsWith('hsl') ? hslToRgb(color) : parseRgb(color);
        imageData.data[i * 4] = rgb[0];
        imageData.data[i * 4 + 1] = rgb[1];
        imageData.data[i * 4 + 2] = rgb[2];
        imageData.data[i * 4 + 3] = 255;  // Full opacity
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

// Initialize the canvas size
canvas.width = 400;
canvas.height = 400;
grid.initialize(canvas.width, canvas.height);

// Main simulation loop
function update() {
    grid.update();
    drawGrid();
    requestAnimationFrame(update);
}

update();