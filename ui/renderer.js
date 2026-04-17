import { EMPTY, ARTICLE, ERROR, COOLING } from '../sim/grid.js'

// Cell state → [R, G, B]
const COLORS = new Uint8Array([
   10,  10,  10,  // EMPTY   — near-black
  235, 235, 235,  // ARTICLE — near-white
  220,  40,  40,  // ERROR   — red
  255, 190,   0,  // COOLING — yellow (visible trust damage)    
  // 120, 120, 120,  // COOLING — grey
])

// Distinct outlet centroid marker colors (hue stepped by 45°, s=80%, l=58%)
const OUTLET_COLORS = Array.from({ length: 8 }, (_, i) => hsl(i * 45, 0.8, 0.58))

function hsl(h, s, l) {
  h /= 360
  const a = s * Math.min(l, 1 - l)
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(((n + h * 12) % 12) - 3, 9 - (n + h * 12) % 12, 1))))
  return [f(0), f(8), f(4)]
}

// Small cross pattern drawn into ImageData to mark outlet centroids
const CROSS = [[-2,0],[-1,0],[0,0],[1,0],[2,0],[0,-2],[0,-1],[0,1],[0,2]]

export class Renderer {
  constructor(canvas, grid) {
    this.canvas    = canvas
    this.grid      = grid
    this.ctx       = canvas.getContext('2d')
    canvas.width   = grid.width
    canvas.height  = grid.height
    this.imageData = this.ctx.createImageData(grid.width, grid.height)
    this.buf       = this.imageData.data
  }

  render(outlets) {
    const { cells, width } = this.grid
    const buf = this.buf
    let articles = 0, errors = 0, cooling = 0

    for (let i = 0; i < cells.length; i++) {
      const state = cells[i]
      const p = i * 4, c = state * 3
      buf[p]   = COLORS[c]
      buf[p+1] = COLORS[c+1]
      buf[p+2] = COLORS[c+2]
      buf[p+3] = 255
      if (state === ARTICLE) articles++
      else if (state === ERROR)   errors++
      else if (state === COOLING) cooling++
    }

    // Draw outlet centroid crosses into the pixel buffer
    for (let o = 0; o < outlets.length; o++) {
      const [r, g, b] = OUTLET_COLORS[o % OUTLET_COLORS.length]
      const { cx, cy } = outlets[o]
      for (const [dx, dy] of CROSS) {
        const x = cx + dx, y = cy + dy
        if (x < 0 || x >= this.grid.width || y < 0 || y >= this.grid.height) continue
        const p = (y * width + x) * 4
        buf[p] = r; buf[p+1] = g; buf[p+2] = b; buf[p+3] = 255
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0)
    return { articles, errors, cooling }
  }
}
